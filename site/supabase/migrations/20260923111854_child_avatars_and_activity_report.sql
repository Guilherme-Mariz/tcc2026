BEGIN;

ALTER TABLE public.criancas
ADD COLUMN IF NOT EXISTS avatar_path text;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'child-avatars',
  'child-avatars',
  false,
  3145728,
  ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
)
ON CONFLICT (id) DO UPDATE
SET public = false,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- O backend valida o vínculo entre responsável e criança antes de chamar a função.
-- A agregação no Postgres evita transferir o histórico inteiro para montar o relatório.
CREATE OR REPLACE FUNCTION public.teko_activity_report(p_child_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $$
  WITH grouped AS (
    SELECT
      atividade_id,
      count(*) AS total,
      min(created_at) AS first_completed_at,
      max(created_at) AS last_completed_at
    FROM public."realizações_atividades"
    WHERE crianca_id = p_child_id
      AND resultado @> '{"concluida":true}'::jsonb
    GROUP BY atividade_id
  )
  SELECT jsonb_build_object(
    'totalRealizations', coalesce(sum(total), 0),
    'activities', coalesce(
      jsonb_agg(
        jsonb_build_object(
          'activityId', atividade_id,
          'count', total,
          'firstCompletedAt', first_completed_at,
          'lastCompletedAt', last_completed_at
        )
        ORDER BY total DESC, last_completed_at DESC
      ),
      '[]'::jsonb
    )
  )
  FROM grouped;
$$;

REVOKE ALL ON FUNCTION public.teko_activity_report(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.teko_activity_report(uuid) TO service_role;

COMMIT;
