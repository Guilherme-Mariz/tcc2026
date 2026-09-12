-- RASCUNHO DE PASSAGEM: não aplicado nem validado.
-- Antes de executar, conferir esquema, duplicatas, triggers, permissões e migrações.
-- O histórico de realizações NÃO deve ser apagado nem sobrescrito.
BEGIN;
LOCK TABLE public."realizações_atividades" IN SHARE ROW EXCLUSIVE MODE;
ALTER TABLE public.progresso_modulos ALTER COLUMN crianca_id DROP DEFAULT;
ALTER TABLE public.sequencia_atividades ALTER COLUMN crianca_id DROP DEFAULT;
CREATE UNIQUE INDEX IF NOT EXISTS progresso_crianca_modulo_unique
 ON public.progresso_modulos (crianca_id, modulo_id);
CREATE UNIQUE INDEX IF NOT EXISTS sequencia_crianca_data_unique
 ON public.sequencia_atividades (crianca_id, data);
CREATE INDEX IF NOT EXISTS realizacoes_crianca_data_idx
 ON public."realizações_atividades" (crianca_id, created_at DESC, id DESC);
ALTER TABLE public.progresso_modulos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sequencia_atividades ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.progresso_modulos, public.sequencia_atividades FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.progresso_modulos, public.sequencia_atividades TO service_role;

CREATE OR REPLACE FUNCTION public.teko_atualizar_progresso()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE module_id bigint;
BEGIN
 IF NEW.resultado->>'concluida' IS DISTINCT FROM 'true' THEN RETURN NEW; END IF;
 SELECT modulo_id INTO module_id FROM public.atividades WHERE id = NEW.atividade_id;
 IF module_id IS NOT NULL THEN
  INSERT INTO public.progresso_modulos
   (crianca_id, modulo_id, atividades_realizadas, ultima_realizacao, updated_at)
  VALUES (NEW.crianca_id, module_id, 1, NEW.created_at, now())
  ON CONFLICT (crianca_id, modulo_id) DO UPDATE
   SET atividades_realizadas = public.progresso_modulos.atividades_realizadas + 1,
       ultima_realizacao = greatest(public.progresso_modulos.ultima_realizacao, EXCLUDED.ultima_realizacao),
       updated_at = now();
 END IF;
 INSERT INTO public.sequencia_atividades (crianca_id, data)
 VALUES (NEW.crianca_id, (NEW.created_at AT TIME ZONE 'America/Sao_Paulo')::date)
 ON CONFLICT (crianca_id, data) DO NOTHING;
 RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.teko_atualizar_progresso() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER teko_conclusao_resumos
 AFTER INSERT ON public."realizações_atividades"
 FOR EACH ROW EXECUTE FUNCTION public.teko_atualizar_progresso();

INSERT INTO public.progresso_modulos
 (crianca_id, modulo_id, atividades_realizadas, ultima_realizacao, updated_at)
SELECT r.crianca_id, a.modulo_id, count(*), max(r.created_at), now()
FROM public."realizações_atividades" r
JOIN public.atividades a ON a.id = r.atividade_id
WHERE r.resultado->>'concluida' = 'true' AND a.modulo_id IS NOT NULL
GROUP BY r.crianca_id, a.modulo_id
ON CONFLICT (crianca_id, modulo_id) DO UPDATE
SET atividades_realizadas = EXCLUDED.atividades_realizadas,
 ultima_realizacao = EXCLUDED.ultima_realizacao, updated_at = now();

INSERT INTO public.sequencia_atividades (crianca_id, data)
SELECT DISTINCT crianca_id, (created_at AT TIME ZONE 'America/Sao_Paulo')::date
FROM public."realizações_atividades"
WHERE resultado->>'concluida' = 'true'
ON CONFLICT (crianca_id, data) DO NOTHING;
COMMIT;
