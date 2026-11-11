-- Mystery Pick: teacher-owned reusable lists. No student accounts required.
create table if not exists public.teacher_mystery_lists (
 id uuid primary key default gen_random_uuid(),
 teacher_id uuid not null references auth.users(id) on delete cascade,
 title text not null check (char_length(title) between 1 and 100),
 entries jsonb not null check (jsonb_typeof(entries)='array' and jsonb_array_length(entries) between 1 and 200),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index if not exists teacher_mystery_lists_owner_idx on public.teacher_mystery_lists (teacher_id,updated_at desc);
alter table public.teacher_mystery_lists enable row level security;
create policy "teacher reads own mystery lists" on public.teacher_mystery_lists for select to authenticated using ((select auth.uid())=teacher_id);
create policy "teacher inserts own mystery lists" on public.teacher_mystery_lists for insert to authenticated with check ((select auth.uid())=teacher_id);
create policy "teacher updates own mystery lists" on public.teacher_mystery_lists for update to authenticated using ((select auth.uid())=teacher_id) with check ((select auth.uid())=teacher_id);
create policy "teacher deletes own mystery lists" on public.teacher_mystery_lists for delete to authenticated using ((select auth.uid())=teacher_id);
grant select,insert,update,delete on public.teacher_mystery_lists to authenticated;