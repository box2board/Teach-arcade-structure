-- Apply once to an isolated Supabase development project. Not automatically executed.
begin;
create table public.teachers (
 id uuid primary key references auth.users(id) on delete cascade,
 plan text not null default 'free' check (plan in ('free','pro','school')),
 created_at timestamptz not null default now()
);
create table public.teacher_favorites (
 teacher_id uuid not null references public.teachers(id) on delete cascade,
 public_set_id text not null check (length(public_set_id) between 1 and 200),
 created_at timestamptz not null default now(),
 primary key (teacher_id,public_set_id)
);
alter table public.teachers enable row level security;
alter table public.teacher_favorites enable row level security;
revoke all on public.teachers,public.teacher_favorites from anon,authenticated;
grant select on public.teachers to authenticated;
grant select,insert,delete on public.teacher_favorites to authenticated;
create policy teacher_read on public.teachers for select to authenticated using ((select auth.uid())=id);
create policy favorites_read on public.teacher_favorites for select to authenticated using ((select auth.uid())=teacher_id);
create policy favorites_add on public.teacher_favorites for insert to authenticated with check ((select auth.uid())=teacher_id);
create policy favorites_remove on public.teacher_favorites for delete to authenticated using ((select auth.uid())=teacher_id);
-- Plans are never writable by teachers, including via the direct database API.
create function public.create_teacher_profile() returns trigger language plpgsql security definer set search_path='' as $$
begin insert into public.teachers(id) values(new.id); return new; end;
$$;
revoke all on function public.create_teacher_profile() from public,anon,authenticated;
create trigger teacher_profile_created after insert on auth.users for each row execute function public.create_teacher_profile();
insert into public.teachers(id) select id from auth.users on conflict do nothing;
commit;
