BEGIN;
CREATE TABLE public.activity_recommendations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    child_id uuid NOT NULL REFERENCES public.criancas(id) ON DELETE CASCADE,
    activity_id uuid NOT NULL REFERENCES public.atividades(id) ON DELETE CASCADE,
    slot smallint NOT NULL CHECK (slot BETWEEN 1 AND 3),
    created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
    UNIQUE (child_id, slot),
    UNIQUE (child_id, activity_id)
);
CREATE INDEX activity_recommendations_activity_idx ON public.activity_recommendations(activity_id);
ALTER TABLE public.activity_recommendations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.activity_recommendations FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, DELETE ON public.activity_recommendations TO service_role;

-- Somente o backend chama esta função, após validar a sessão e o vínculo.
CREATE FUNCTION public.teko_enqueue_recommendation(p_child_id uuid, p_activity_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE free_slot smallint;
BEGIN
    -- Mesmo bloqueio usado pela conclusão: serializa a fila por criança.
    PERFORM id FROM public.criancas WHERE id = p_child_id FOR NO KEY UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Criança inexistente'; END IF;
    IF EXISTS (SELECT 1 FROM public.activity_recommendations WHERE child_id=p_child_id AND activity_id=p_activity_id) THEN
        RETURN false;
    END IF;
    SELECT n INTO free_slot FROM generate_series(1,3) AS slots(n)
    WHERE NOT EXISTS (SELECT 1 FROM public.activity_recommendations r WHERE r.child_id=p_child_id AND r.slot=n)
    ORDER BY n LIMIT 1;
    IF free_slot IS NULL THEN RETURN false; END IF;
    INSERT INTO public.activity_recommendations(child_id,activity_id,slot) VALUES (p_child_id,p_activity_id,free_slot);
    RETURN true;
END;
$$;
REVOKE ALL ON FUNCTION public.teko_enqueue_recommendation(uuid,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.teko_enqueue_recommendation(uuid,uuid) TO service_role;

CREATE FUNCTION public.teko_finish_recommendation()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
BEGIN
    IF NEW.resultado @> '{"concluida":true}'::jsonb THEN
        PERFORM id FROM public.criancas WHERE id=NEW.crianca_id FOR NO KEY UPDATE;
        DELETE FROM public.activity_recommendations
        WHERE child_id=NEW.crianca_id AND activity_id=NEW.atividade_id;
    END IF;
    RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.teko_finish_recommendation() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.teko_finish_recommendation() TO service_role;
CREATE TRIGGER finish_activity_recommendation AFTER INSERT ON public."realizações_atividades"
FOR EACH ROW EXECUTE FUNCTION public.teko_finish_recommendation();
COMMIT;
