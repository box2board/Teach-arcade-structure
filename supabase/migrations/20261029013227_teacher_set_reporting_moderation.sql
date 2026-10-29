alter table public.teacher_question_sets add column moderation_hidden boolean not null default false;
create policy teacher_sets_moderation on public.teacher_question_sets as restrictive for select to anon,authenticated using (not moderation_hidden or owner_id=(select auth.uid()));
create table public.teacher_set_reports(
 id uuid primary key default gen_random_uuid(),
 reporter_id uuid not null default auth.uid() references public.teachers(id) on delete cascade,
 set_id uuid not null references public.teacher_question_sets(id) on delete cascade,
 reason text not null check(reason in ('incorrect','inappropriate','copyright','personal-data','other')),
 created_at timestamptz not null default now(),
 status text not null default 'open' check(status in ('open','resolved','dismissed')),
 unique(reporter_id,set_id)
);
create index teacher_reports_set on public.teacher_set_reports(set_id);
alter table public.teacher_set_reports enable row level security;
revoke all on public.teacher_set_reports from anon,authenticated;
grant select on public.teacher_set_reports to authenticated;
grant insert(set_id,reason) on public.teacher_set_reports to authenticated;
create policy teacher_reports_read on public.teacher_set_reports for select to authenticated using(reporter_id=(select auth.uid()));
create policy teacher_reports_add on public.teacher_set_reports for insert to authenticated with check(
 reporter_id=(select auth.uid()) and exists(select 1 from public.teacher_question_sets s where s.id=set_id and s.visibility='public' and s.owner_id<>(select auth.uid()) and not s.moderation_hidden)
 and (select count(*) from public.teacher_set_reports where reporter_id=(select auth.uid()) and created_at>now()-interval '1 day')<20
);
