-- *** DISABLE AUTH MODE ***
-- This script disables strict RLS checks and allows anonymous access.

-- 1. Disable RLS on tables (easiest way to make it public)
alter table public.schools disable row level security;
alter table public.profiles disable row level security;
alter table public.posts disable row level security;
alter table public.comments disable row level security;
alter table public.reports disable row level security;

-- 2. Ensure a Demo School exists (so we can link posts to it)
insert into public.schools (id, name, code)
values ('00000000-0000-0000-0000-000000000001', 'Demo School', 'DEMO-1')
on conflict (code) do nothing;
