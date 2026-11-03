create function private.delete_teacher_account() returns void language plpgsql security definer set search_path='' as $$
declare teacher uuid:=auth.uid();
begin
 if teacher is null or not exists(select 1 from auth.sessions where user_id=teacher and id::text=auth.jwt()->>'session_id' and created_at>now()-interval '15 minutes' and (not_after is null or not_after>now())) then
 raise exception 'Sign out and sign in again before deleting your account.' using errcode='42501';
 end if;
 delete from auth.sessions where user_id=teacher;
 delete from auth.users where id=teacher;
end $$;
revoke all on function private.delete_teacher_account() from public,anon,authenticated;
grant execute on function private.delete_teacher_account() to authenticated;
create function public.delete_teacher_account() returns void language sql security invoker set search_path='' as $$select private.delete_teacher_account()$$;
revoke all on function public.delete_teacher_account() from public,anon,authenticated;
grant execute on function public.delete_teacher_account() to authenticated;
