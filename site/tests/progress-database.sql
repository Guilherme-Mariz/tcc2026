-- Executar após a migração. Dados de teste e alterações são revertidos.
BEGIN;
DO $$
DECLARE
 child uuid; a uuid; b uuid; attempt uuid := gen_random_uuid();
 baseline bigint; module_before bigint; days_before bigint; day_key date := date '2040-01-02';
 facts jsonb;
BEGIN
 SELECT id INTO child FROM public.criancas LIMIT 1;
 SELECT id INTO a FROM public.atividades WHERE modulo_id = 1 ORDER BY id LIMIT 1;
 SELECT id INTO b FROM public.atividades WHERE modulo_id = 2 ORDER BY id LIMIT 1;
 IF child IS NULL OR a IS NULL OR b IS NULL THEN RAISE EXCEPTION 'Fixture precisa de criança e módulos 1/2'; END IF;
 SELECT count(*) INTO baseline FROM public."realizações_atividades" WHERE crianca_id = child;
 SELECT coalesce(sum(atividades_realizadas), 0) INTO module_before FROM public.progresso_modulos WHERE crianca_id = child;
 SELECT count(*) INTO days_before FROM public.sequencia_atividades WHERE crianca_id = child AND data IN (day_key, day_key + 1);
 IF days_before <> 0 THEN RAISE EXCEPTION 'Datas de teste já possuem registros'; END IF;

 -- Inclusive as permissões de tabela, sequência e função usadas pelo backend.
 SET LOCAL ROLE service_role;
 INSERT INTO public."realizações_atividades" (id, crianca_id, atividade_id, resultado, created_at)
 VALUES (attempt, child, a, '{"concluida":true}', '2040-01-02T12:00:00Z');
 INSERT INTO public."realizações_atividades" (id, crianca_id, atividade_id, resultado, created_at)
 VALUES (attempt, child, a, '{"concluida":true}', '2040-01-02T12:00:00Z') ON CONFLICT (id) DO NOTHING;
 -- Repetição no mesmo dia, outro módulo e virada no fuso São Paulo.
 INSERT INTO public."realizações_atividades" (crianca_id, atividade_id, resultado, created_at)
 VALUES (child, a, '{"concluida":true}', '2040-01-03T02:59:59Z'),
        (child, b, '{"concluida":true}', '2040-01-03T03:00:00Z');
 INSERT INTO public."realizações_atividades" (crianca_id, atividade_id, resultado, created_at)
 SELECT child, a, '{"concluida":true}', '2040-01-02T12:00:00Z' FROM generate_series(1, 1501);
 IF (SELECT count(*) FROM public."realizações_atividades" WHERE crianca_id = child) <> baseline + 1504 THEN
  RAISE EXCEPTION 'Histórico/idempotência divergente'; END IF;
 IF (SELECT sum(atividades_realizadas) FROM public.progresso_modulos WHERE crianca_id = child) <> module_before + 1504 THEN
  RAISE EXCEPTION 'Resumo divergente'; END IF;
 IF (SELECT count(*) FROM public.sequencia_atividades WHERE crianca_id = child AND data IN (day_key, day_key + 1)) <> 2 THEN
  RAISE EXCEPTION 'Dia duplicado ou fuso incorreto'; END IF;
 facts := public.teko_progress_facts(child);
 IF (SELECT sum((item->>'total')::bigint) FROM jsonb_array_elements(facts->'activities') item) <> module_before + 1504 THEN
  RAISE EXCEPTION 'Agregação truncada'; END IF;
 RESET ROLE;

 -- Simula falha depois da atualização do módulo: todo INSERT deve reverter.
 ALTER TABLE public.sequencia_atividades ADD CONSTRAINT teko_test_partial_failure CHECK (data <> date '2040-01-04');
 BEGIN
  SET LOCAL ROLE service_role;
  INSERT INTO public."realizações_atividades" (crianca_id, atividade_id, resultado, created_at)
  VALUES (child, a, '{"concluida":true}', '2040-01-04T12:00:00Z');
  RAISE EXCEPTION 'Falha parcial não foi provocada';
 EXCEPTION WHEN check_violation THEN NULL;
 END;
 RESET ROLE;
 IF (SELECT count(*) FROM public."realizações_atividades" WHERE crianca_id = child) <> baseline + 1504 OR
    (SELECT sum(atividades_realizadas) FROM public.progresso_modulos WHERE crianca_id = child) <> module_before + 1504 THEN
  RAISE EXCEPTION 'Falha parcial deixou dados'; END IF;
 IF has_function_privilege('anon', 'public.teko_progress_facts(uuid)', 'EXECUTE') OR
    has_function_privilege('authenticated', 'public.teko_progress_facts(uuid)', 'EXECUTE') OR
    has_table_privilege('authenticated', 'public.progresso_modulos', 'UPDATE') THEN
  RAISE EXCEPTION 'Acesso público indevido'; END IF;
END;
$$;
ROLLBACK;
