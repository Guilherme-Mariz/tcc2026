alter table public.criancas add column if not exists preferencias jsonb not null default '{}'::jsonb check (jsonb_typeof(preferencias) = 'object');
