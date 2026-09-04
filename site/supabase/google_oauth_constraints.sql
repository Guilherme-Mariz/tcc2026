-- Garante que cada identidade do Supabase Auth tenha somente um responsável.
-- Execute depois de confirmar que não existem user_id duplicados.
create unique index if not exists responsaveis_user_id_unique
    on public.responsaveis (user_id);

-- O índice único cobre as mesmas consultas do índice comum anterior.
drop index if exists public.idx_responsaveis_user_id;
