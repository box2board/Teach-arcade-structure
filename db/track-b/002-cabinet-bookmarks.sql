-- Development only. Apply after 001. No student, editor, billing or quota tables.
begin;
create table public.teacher_cabinet_items (
 teacher_id uuid not null references public.teachers(id) on delete cascade,
 resource_type text not null check (resource_type in ('game','tool')),
 resource_id text not null check (length(resource_id) between 1 and 200),
 created_at timestamptz not null default now(),
 primary key (teacher_id,resource_type,resource_id)
);
alter table public.teacher_cabinet_items enable row level security;
revoke all on public.teacher_cabinet_items from anon,authenticated;
grant select,insert,delete on public.teacher_cabinet_items to authenticated;
create policy cabinet_read on public.teacher_cabinet_items for select to authenticated using ((select auth.uid())=teacher_id);
create policy cabinet_add on public.teacher_cabinet_items for insert to authenticated with check ((select auth.uid())=teacher_id);
create policy cabinet_remove on public.teacher_cabinet_items for delete to authenticated using ((select auth.uid())=teacher_id);
commit;
