begin;
select set_config('test.a',gen_random_uuid()::text,true),set_config('test.b',gen_random_uuid()::text,true),set_config('test.old',gen_random_uuid()::text,true),set_config('test.fresh',gen_random_uuid()::text,true),set_config('test.other',gen_random_uuid()::text,true);
insert into auth.users(id,email) values(current_setting('test.a')::uuid,'delete-a@example.invalid'),(current_setting('test.b')::uuid,'delete-b@example.invalid');
insert into auth.sessions(id,user_id,created_at) values(current_setting('test.old')::uuid,current_setting('test.a')::uuid,now()-interval '1 hour'),(current_setting('test.fresh')::uuid,current_setting('test.a')::uuid,now()),(current_setting('test.other')::uuid,current_setting('test.b')::uuid,now());
insert into public.teacher_question_sets(owner_id,title,subject) values(current_setting('test.a')::uuid,'Delete original','Science'),(current_setting('test.b')::uuid,'Keep independent copy','Science');
insert into public.teacher_cabinet_items(teacher_id,resource_type,resource_id) values(current_setting('test.a')::uuid,'tool','timer');
set local role authenticated;
select set_config('request.jwt.claim.sub',current_setting('test.a'),true),set_config('request.jwt.claims',json_build_object('sub',current_setting('test.a'),'session_id',current_setting('test.old'))::text,true);
do $$ begin begin perform public.delete_teacher_account();raise exception 'old session allowed';exception when insufficient_privilege then null;end;end $$;
select set_config('request.jwt.claims',json_build_object('sub',current_setting('test.a'),'session_id',current_setting('test.other'))::text,true);
do $$ begin begin perform public.delete_teacher_account();raise exception 'other teacher session allowed';exception when insufficient_privilege then null;end;end $$;
select set_config('request.jwt.claims',json_build_object('sub',current_setting('test.a'),'session_id',current_setting('test.fresh'))::text,true);
select public.delete_teacher_account();
-- A repeated/stolen JWT cannot repeat deletion after its session is removed.
do $$ begin begin perform public.delete_teacher_account();raise exception 'deleted session allowed';exception when insufficient_privilege then null;end;end $$;
reset role;
do $$ begin
 if exists(select 1 from auth.users where id=current_setting('test.a')::uuid) or exists(select 1 from auth.sessions where user_id=current_setting('test.a')::uuid) or exists(select 1 from public.teachers where id=current_setting('test.a')::uuid) or exists(select 1 from public.teacher_question_sets where owner_id=current_setting('test.a')::uuid) or exists(select 1 from public.teacher_cabinet_items where teacher_id=current_setting('test.a')::uuid) then raise exception 'account cleanup failed';end if;
 if not exists(select 1 from auth.users where id=current_setting('test.b')::uuid) or not exists(select 1 from public.teacher_question_sets where owner_id=current_setting('test.b')::uuid) then raise exception 'another teacher affected';end if;
end $$;
set local role anon;
do $$ begin begin perform public.delete_teacher_account();raise exception 'anon deletion allowed';exception when insufficient_privilege then null;end;end $$;
reset role;
rollback;
select 'Deletion checks passed; temporary accounts and content rolled back.' as result;
