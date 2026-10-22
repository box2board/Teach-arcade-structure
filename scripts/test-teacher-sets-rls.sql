-- Run only in the development project. Every test identity and row is rolled back.
begin;
select set_config('test.teacher_a',gen_random_uuid()::text,true),set_config('test.teacher_b',gen_random_uuid()::text,true);
insert into auth.users(id,email) values(current_setting('test.teacher_a')::uuid,'cabinet-test-a@example.invalid'),(current_setting('test.teacher_b')::uuid,'cabinet-test-b@example.invalid');
set local role authenticated;
select set_config('request.jwt.claim.sub',current_setting('test.teacher_a'),true);
with inserted as(insert into public.teacher_question_sets(title,subject) values('Ownership test','Science') returning id)
select set_config('test.set_id',id::text,true) from inserted;
do $$ begin
 if not exists(select 1 from public.teacher_question_sets where id=current_setting('test.set_id')::uuid and visibility='private' and owner_id=auth.uid()) then raise exception 'default private/owner failed';end if;
 begin update public.teacher_question_sets set visibility='public' where id=current_setting('test.set_id')::uuid;raise exception 'incomplete publish allowed';exception when check_violation then null;end;
 begin update public.teacher_question_sets set owner_id=current_setting('test.teacher_b')::uuid where id=current_setting('test.set_id')::uuid;raise exception 'ownership transfer allowed';exception when insufficient_privilege then null;end;
end $$;
select set_config('request.jwt.claim.sub',current_setting('test.teacher_b'),true);
do $$ declare affected integer; begin
 if exists(select 1 from public.teacher_question_sets where id=current_setting('test.set_id')::uuid) then raise exception 'private leaked to teacher B';end if;
 update public.teacher_question_sets set title='Stolen' where id=current_setting('test.set_id')::uuid;get diagnostics affected=row_count;if affected<>0 then raise exception 'cross-owner update allowed';end if;
 begin insert into public.teacher_set_saves(set_id) values(current_setting('test.set_id')::uuid);raise exception 'private bookmark allowed';exception when insufficient_privilege then null;end;
end $$;
reset role;
set local role anon;
do $$ begin if exists(select 1 from public.teacher_question_sets where id=current_setting('test.set_id')::uuid) then raise exception 'private leaked anonymously';end if;end $$;
reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub',current_setting('test.teacher_a'),true);
update public.teacher_question_sets set questions=(select jsonb_agg(jsonb_build_object('question','Question '||n,'choices',jsonb_build_array('A','B','C','D'),'answer',0,'explanation','')) from generate_series(1,12)n),visibility='public' where id=current_setting('test.set_id')::uuid;
do $$ begin if not exists(select 1 from public.teacher_question_sets where id=current_setting('test.set_id')::uuid and revision=2) then raise exception 'revision did not increment';end if;end $$;
select set_config('request.jwt.claim.sub',current_setting('test.teacher_b'),true);
insert into public.teacher_set_saves(set_id) values(current_setting('test.set_id')::uuid);
with copied as(insert into public.teacher_question_sets(title,subject,questions) select 'Independent copy',subject,questions from public.teacher_question_sets where id=current_setting('test.set_id')::uuid returning id)
select set_config('test.copy_id',id::text,true) from copied;
do $$ declare affected integer; begin
 update public.teacher_question_sets set title='Stolen public set' where id=current_setting('test.set_id')::uuid;get diagnostics affected=row_count;if affected<>0 then raise exception 'public edit allowed';end if;
 if not exists(select 1 from public.teacher_set_saves where set_id=current_setting('test.set_id')::uuid) then raise exception 'bookmark missing';end if;
end $$;
reset role;
set local role anon;
do $$ begin if not exists(select 1 from public.teacher_question_sets where id=current_setting('test.set_id')::uuid) then raise exception 'public read failed';end if;end $$;
reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub',current_setting('test.teacher_a'),true);
do $$ begin if exists(select 1 from public.teacher_set_saves where set_id=current_setting('test.set_id')::uuid) then raise exception 'another teachers bookmarks leaked';end if;end $$;
update public.teacher_question_sets set visibility='private' where id=current_setting('test.set_id')::uuid;
select set_config('request.jwt.claim.sub',current_setting('test.teacher_b'),true);
do $$ begin
 if exists(select 1 from public.teacher_set_saves b join public.teacher_question_sets s on s.id=b.set_id where b.set_id=current_setting('test.set_id')::uuid) then raise exception 'withdrawn set leaked through saved join';end if;
 if not exists(select 1 from public.teacher_question_sets where id=current_setting('test.copy_id')::uuid and visibility='private') then raise exception 'copy did not survive withdrawal';end if;
end $$;
reset role;
rollback;
select 'All teacher-set RLS tests passed; no test records retained.' as result;
