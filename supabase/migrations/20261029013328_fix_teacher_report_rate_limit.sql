alter policy teacher_reports_add on public.teacher_set_reports with check(reporter_id=(select auth.uid()) and exists(select 1 from public.teacher_question_sets s where s.id=set_id and s.visibility='public' and s.owner_id<>(select auth.uid()) and not s.moderation_hidden));
create function private.limit_teacher_reports() returns trigger language plpgsql security invoker set search_path='' as $$
begin
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(auth.uid()::text,37));
 if (select count(*) from public.teacher_set_reports where reporter_id=auth.uid() and created_at>now()-interval '1 day')>=20 then raise exception 'Daily report limit reached' using errcode='23514';end if;
 return new;
end $$;
revoke all on function private.limit_teacher_reports() from public,anon,authenticated;
create trigger teacher_report_limit before insert on public.teacher_set_reports for each row execute function private.limit_teacher_reports();
