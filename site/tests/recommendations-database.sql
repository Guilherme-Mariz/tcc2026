-- Testa a fila real e reverte todas as alterações ao terminar.
BEGIN;
DO $$
DECLARE child uuid; other_child uuid; activities uuid[]; item uuid; completion_id uuid := gen_random_uuid(); other_count integer;
BEGIN
 SELECT id INTO child FROM public.criancas ORDER BY id LIMIT 1;
 SELECT id INTO other_child FROM public.criancas WHERE id<>child ORDER BY id LIMIT 1;
 SELECT array_agg(id) INTO activities FROM (SELECT id FROM public.atividades ORDER BY id LIMIT 4) a;
 IF child IS NULL OR array_length(activities,1)<>4 THEN RAISE EXCEPTION 'Faltam perfis ou atividades para o teste'; END IF;
 SET LOCAL ROLE service_role;
 SELECT count(*) INTO other_count FROM public.activity_recommendations WHERE child_id=other_child;
 DELETE FROM public.activity_recommendations WHERE child_id=child;
 FOREACH item IN ARRAY activities[1:3] LOOP
  IF NOT public.teko_enqueue_recommendation(child,item) THEN RAISE EXCEPTION 'Não adicionou recomendação'; END IF;
 END LOOP;
 IF public.teko_enqueue_recommendation(child,activities[1]) THEN RAISE EXCEPTION 'Duplicata aceita'; END IF;
 IF public.teko_enqueue_recommendation(child,activities[4]) THEN RAISE EXCEPTION 'Quarta atividade aceita'; END IF;
 IF (SELECT count(*) FROM public.activity_recommendations WHERE child_id=child) <> 3 THEN RAISE EXCEPTION 'Limite incorreto'; END IF;
 INSERT INTO public."realizações_atividades"(crianca_id,atividade_id,resultado) VALUES(child,activities[1],'{"concluida":false}');
 IF (SELECT count(*) FROM public.activity_recommendations WHERE child_id=child) <> 3 THEN RAISE EXCEPTION 'Removeu antes da conclusão'; END IF;
 INSERT INTO public."realizações_atividades"(id,crianca_id,atividade_id,resultado) VALUES(completion_id,child,activities[1],'{"concluida":true}');
 IF (SELECT count(*) FROM public.activity_recommendations WHERE child_id=child) <> 2 THEN RAISE EXCEPTION 'Não removeu a concluída'; END IF;
 IF NOT public.teko_enqueue_recommendation(child,activities[1]) THEN RAISE EXCEPTION 'Recomendação futura bloqueada'; END IF;
 INSERT INTO public."realizações_atividades"(id,crianca_id,atividade_id,resultado) VALUES(completion_id,child,activities[1],'{"concluida":true}') ON CONFLICT(id) DO NOTHING;
 IF (SELECT count(*) FROM public.activity_recommendations WHERE child_id=child) <> 3 THEN RAISE EXCEPTION 'Reenvio apagou recomendação futura'; END IF;
 IF (SELECT count(*) FROM public.activity_recommendations WHERE child_id=other_child) <> other_count THEN RAISE EXCEPTION 'Alterou outra criança'; END IF;
 RESET ROLE;
 IF has_table_privilege('anon','public.activity_recommendations','SELECT') OR
    has_table_privilege('authenticated','public.activity_recommendations','SELECT') OR
    has_function_privilege('authenticated','public.teko_enqueue_recommendation(uuid,uuid)','EXECUTE') THEN
    RAISE EXCEPTION 'Acesso público indevido';
 END IF;
END;
$$;
ROLLBACK;
