-- Apply only to an isolated Supabase project AFTER review; DO NOT apply to Teach Arcade production.
-- Only an administrator marked via trusted auth.app_metadata.devhq_admin=true can access task rows.
-- Admin flag must be set securely by the Supabase Auth administrator, NOT from user_metadata.
create extension if not exists pgcrypto;
create table if not exists public.devhq_tasks (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  project text not null check (project in ('Multiplayer Arcade','Midway Mashup','Trench Run V2','Factory Flow','Teacher HQ','New Game')),
  category text not null check (category in ('Gameplay feature','Bug fix','Visual quality','New game prototype','Testing and QA')),
  description text not null check (char_length(description) between 12 and 5000),
  status text not null default 'draft' check (status in ('draft','archived')),
  mode text not null default 'plus' check (mode = 'plus'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists devhq_tasks_owner_created_idx on public.devhq_tasks(owner_id, created_at desc);
alter table public.devhq_tasks enable row level security;
revoke all on public.devhq_tasks from anon;
grant select,insert,update on public.devhq_tasks to authenticated;
create policy "Admin reads own development tasks" on public.devhq_tasks for select to authenticated
using ((select auth.uid()) = owner_id and (select auth.jwt()->'app_metadata'->>'devhq_admin') = 'true');
create policy "Admin creates own development tasks" on public.devhq_tasks for insert to authenticated
with check ((select auth.uid()) = owner_id and (select auth.jwt()->'app_metadata'->>'devhq_admin') = 'true');
create policy "Admin archives own development tasks" on public.devhq_tasks for update to authenticated
using ((select auth.uid()) = owner_id and (select auth.jwt()->'app_metadata'->>'devhq_admin') = 'true')
with check ((select auth.uid()) = owner_id and (select auth.jwt()->'app_metadata'->>'devhq_admin') = 'true');
-- Server additionally enforces DEVHQ_ADMIN_USER_ID. Set app_metadata via trusted admin API or console only.
