-- Corrige a relação entre auth.users e a tabela de responsáveis.
-- auth.uid() corresponde a responsaveis.user_id, não a responsaveis.id.
alter table public.responsaveis enable row level security;

drop policy if exists "Responsável vê seus próprios dados"
on public.responsaveis;

drop policy if exists "Permitir insert para usuários autenticados"
on public.responsaveis;

drop policy if exists "Responsável acessa seus próprios dados"
on public.responsaveis;

create policy "Responsável acessa seus próprios dados"
on public.responsaveis
for all
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

-- Índice usado na busca que relaciona o usuário autenticado ao responsável.
create index if not exists idx_responsaveis_user_id
on public.responsaveis (user_id);

-- Uma criança pertence ao usuário quando seu responsável pertence ao auth.uid().
alter table public.criancas enable row level security;

drop policy if exists "responsavel ve crianças"
on public.criancas;

drop policy if exists "Responsável acessa suas próprias crianças"
on public.criancas;

create policy "Responsável acessa suas próprias crianças"
on public.criancas
for all
to authenticated
using (
    exists (
        select 1
        from public.responsaveis as responsavel
        where responsavel.id = criancas.responsavel_id
          and responsavel.user_id = (select auth.uid())
    )
)
with check (
    exists (
        select 1
        from public.responsaveis as responsavel
        where responsavel.id = criancas.responsavel_id
          and responsavel.user_id = (select auth.uid())
    )
);

-- Índice usado para listar as crianças do responsável encontrado.
create index if not exists idx_criancas_responsavel_id
on public.criancas (responsavel_id);
