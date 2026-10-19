-- Conclusões e resumos são gravados atomicamente; acesso via backend autenticado.
BEGIN;
SET LOCAL lock_timeout = '10s';
LOCK TABLE public."realizações_atividades" IN SHARE ROW EXCLUSIVE MODE;
ALTER TABLE public."realizações_atividades" ALTER COLUMN crianca_id DROP DEFAULT,
 ALTER COLUMN atividade_id DROP DEFAULT, ALTER COLUMN crianca_id SET NOT NULL,
 ALTER COLUMN atividade_id SET NOT NULL;
ALTER TABLE public.progresso_modulos ALTER COLUMN crianca_id DROP DEFAULT,
 ALTER COLUMN crianca_id SET NOT NULL, ALTER COLUMN modulo_id SET NOT NULL,
 ALTER COLUMN atividades_realizadas SET NOT NULL, ALTER COLUMN ultima_realizacao SET NOT NULL;
ALTER TABLE public.sequencia_atividades ALTER COLUMN data SET NOT NULL;
ALTER TABLE public.sequencia_atividades ALTER COLUMN crianca_id DROP DEFAULT;
CREATE UNIQUE INDEX IF NOT EXISTS progresso_crianca_modulo_unique
 ON public.progresso_modulos (crianca_id, modulo_id);
CREATE UNIQUE INDEX IF NOT EXISTS sequencia_crianca_data_unique
 ON public.sequencia_atividades (crianca_id, data);
CREATE INDEX IF NOT EXISTS realizacoes_crianca_data_idx
 ON public."realizações_atividades" (crianca_id, created_at DESC, id DESC);
ALTER TABLE public.progresso_modulos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sequencia_atividades ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public."realizações_atividades", public.progresso_modulos, public.sequencia_atividades FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT ON public."realizações_atividades" TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.progresso_modulos_id_seq TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.progresso_modulos, public.sequencia_atividades TO service_role;

CREATE OR REPLACE FUNCTION public.teko_atualizar_progresso()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE module_id bigint;
BEGIN
 IF NOT coalesce(NEW.resultado @> '{"concluida":true}'::jsonb, false) THEN RETURN NEW; END IF;
 SELECT modulo_id INTO module_id FROM public.atividades WHERE id = NEW.atividade_id;
 IF module_id IS NULL THEN
  RAISE EXCEPTION 'Atividade sem módulo cadastrado' USING ERRCODE = '23514';
 END IF;
  INSERT INTO public.progresso_modulos
   (crianca_id, modulo_id, atividades_realizadas, ultima_realizacao, updated_at)
  VALUES (NEW.crianca_id, module_id, 1, NEW.created_at, now())
  ON CONFLICT (crianca_id, modulo_id) DO UPDATE
   SET atividades_realizadas = public.progresso_modulos.atividades_realizadas + 1,
       ultima_realizacao = greatest(public.progresso_modulos.ultima_realizacao, EXCLUDED.ultima_realizacao),
       updated_at = now();
 INSERT INTO public.sequencia_atividades (crianca_id, data)
 VALUES (NEW.crianca_id, (NEW.created_at AT TIME ZONE 'America/Sao_Paulo')::date)
 ON CONFLICT (crianca_id, data) DO NOTHING;
 RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.teko_atualizar_progresso() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS teko_conclusao_resumos ON public."realizações_atividades";
CREATE TRIGGER teko_conclusao_resumos
 AFTER INSERT ON public."realizações_atividades"
 FOR EACH ROW EXECUTE FUNCTION public.teko_atualizar_progresso();

INSERT INTO public.progresso_modulos
 (crianca_id, modulo_id, atividades_realizadas, ultima_realizacao, updated_at)
SELECT r.crianca_id, a.modulo_id, count(*), max(r.created_at), now()
FROM public."realizações_atividades" r
JOIN public.atividades a ON a.id = r.atividade_id
WHERE r.resultado @> '{"concluida":true}'::jsonb AND a.modulo_id IS NOT NULL
GROUP BY r.crianca_id, a.modulo_id
ON CONFLICT (crianca_id, modulo_id) DO UPDATE
SET atividades_realizadas = EXCLUDED.atividades_realizadas,
 ultima_realizacao = EXCLUDED.ultima_realizacao, updated_at = now();

INSERT INTO public.sequencia_atividades (crianca_id, data)
SELECT DISTINCT crianca_id, (created_at AT TIME ZONE 'America/Sao_Paulo')::date
FROM public."realizações_atividades"
WHERE resultado @> '{"concluida":true}'::jsonb
ON CONFLICT (crianca_id, data) DO NOTHING;
-- JSON único evita truncamento do PostgREST e páginas lidas em snapshots diferentes.
-- SECURITY INVOKER + EXECUTE apenas service_role: vínculo é validado no ActivityService.
CREATE OR REPLACE FUNCTION public.teko_progress_facts(p_child_id uuid)
RETURNS jsonb LANGUAGE sql STABLE SECURITY INVOKER SET search_path = '' AS $$
 WITH completed AS MATERIALIZED (
  SELECT atividade_id, created_at
  FROM public."realizações_atividades"
  WHERE crianca_id = p_child_id AND resultado @> '{"concluida":true}'::jsonb
 ), activity_counts AS (
  SELECT atividade_id, count(*) AS total, max(created_at) AS last
  FROM completed GROUP BY atividade_id
 ), day_counts AS (
  SELECT (created_at AT TIME ZONE 'America/Sao_Paulo')::date AS day, count(*) AS total
  FROM completed GROUP BY 1
 )
 SELECT jsonb_build_object(
  'activities', coalesce((SELECT jsonb_agg(jsonb_build_object(
   'activityId', atividade_id, 'total', total, 'last', last) ORDER BY atividade_id)
   FROM activity_counts), '[]'::jsonb),
  'days', coalesce((SELECT jsonb_agg(jsonb_build_object(
   'date', day, 'count', total) ORDER BY day) FROM day_counts), '[]'::jsonb)
 );
$$;
REVOKE ALL ON FUNCTION public.teko_progress_facts(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.teko_progress_facts(uuid) TO service_role;
COMMIT;
