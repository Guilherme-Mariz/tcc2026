alter table public.criancas add constraint criancas_preferencias_valores check (
    (not (preferencias ? 'toggle_reduced-motion') or jsonb_typeof(preferencias -> 'toggle_reduced-motion') = 'boolean')
    and (not (preferencias ? 'toggle_cursor') or jsonb_typeof(preferencias -> 'toggle_cursor') = 'boolean')
    and (not (preferencias ? 'toggle_narracao') or jsonb_typeof(preferencias -> 'toggle_narracao') = 'boolean')
    and (not (preferencias ? 'toggle_efeitos') or jsonb_typeof(preferencias -> 'toggle_efeitos') = 'boolean')
    and (not (preferencias ? 'darkMode') or jsonb_typeof(preferencias -> 'darkMode') = 'boolean')
    and (not (preferencias ? 'speed') or preferencias -> 'speed' in ('"normal"'::jsonb, '"devagar"'::jsonb, '"rapido"'::jsonb))
    and (not (preferencias ? 'fontScale') or preferencias -> 'fontScale' between '0.9'::jsonb and '1.5'::jsonb)
    and (not (preferencias ? 'volNarracao') or case
        when jsonb_typeof(preferencias -> 'volNarracao') = 'number' then
            (preferencias ->> 'volNarracao')::numeric between 0 and 100
            and trunc((preferencias ->> 'volNarracao')::numeric) = (preferencias ->> 'volNarracao')::numeric
        else false end)
);
