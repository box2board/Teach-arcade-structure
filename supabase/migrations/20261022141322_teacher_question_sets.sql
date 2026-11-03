begin;
create function private.valid_teacher_questions(items jsonb, complete boolean)
returns boolean language plpgsql immutable security invoker set search_path='' as $$
declare q jsonb; choice jsonb;
begin
 if jsonb_typeof(items) is distinct from 'array' then return false; end if;
 if jsonb_array_length(items)>100 or (complete and jsonb_array_length(items)<12) then return false; end if;
 for q in select value from jsonb_array_elements(items) loop
  if jsonb_typeof(q) is distinct from 'object'
   or jsonb_typeof(q->'question') is distinct from 'string' or length(q->>'question')>1000
   or jsonb_typeof(q->'choices') is distinct from 'array'
   or jsonb_typeof(q->'answer') is distinct from 'number'
   or (q->>'answer') not in ('-1','0','1','2','3')
   or jsonb_typeof(q->'explanation') is distinct from 'string' or length(q->>'explanation')>2000 then return false; end if;
  if jsonb_array_length(q->'choices')<>4 then return false; end if;
  for choice in select value from jsonb_array_elements(q->'choices') loop
   if jsonb_typeof(choice) is distinct from 'string' or length(choice #>> '{}')>500 then return false; end if;
   if complete and length(btrim(choice #>> '{}'))=0 then return false; end if;
  end loop;
  if complete and (length(btrim(q->>'question'))=0 or (q->>'answer')='-1'
   or (select count(distinct lower(normalize(btrim(value),NFKC))) from jsonb_array_elements_text(q->'choices'))<>4) then return false; end if;
 end loop;
 return true;
end $$;
revoke all on function private.valid_teacher_questions(jsonb,boolean) from public,anon,authenticated;
grant usage on schema private to authenticated;
grant execute on function private.valid_teacher_questions(jsonb,boolean) to authenticated;

create table public.teacher_question_sets(
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null default auth.uid() references public.teachers(id) on delete cascade,
 title text not null check(length(btrim(title)) between 1 and 120),
 description text not null default '' check(length(description)<=1000),
 subject text not null check(subject in ('Social Studies','Science','Math','ELA','Other')),
 visibility text not null default 'private' check(visibility in ('private','public')),
 questions jsonb not null default '[]',
 question_count integer generated always as (jsonb_array_length(questions)) stored,
 revision integer not null default 1,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 constraint teacher_questions_valid check(private.valid_teacher_questions(questions,visibility='public'))
);
create index teacher_sets_owner on public.teacher_question_sets(owner_id,updated_at desc,id);
create index teacher_sets_public on public.teacher_question_sets(updated_at desc,id) where visibility='public';
alter table public.teacher_question_sets enable row level security;
revoke all on public.teacher_question_sets from anon,authenticated;
grant select on public.teacher_question_sets to anon,authenticated;
grant insert(title,description,subject,questions) on public.teacher_question_sets to authenticated;
grant update(title,description,subject,questions,visibility) on public.teacher_question_sets to authenticated;
create policy teacher_sets_public_read on public.teacher_question_sets for select to anon using(visibility='public');
create policy teacher_sets_owner_read on public.teacher_question_sets for select to authenticated using(visibility='public' or (select auth.uid())=owner_id);
create policy teacher_sets_create on public.teacher_question_sets for insert to authenticated with check((select auth.uid())=owner_id and visibility='private');
create policy teacher_sets_edit on public.teacher_question_sets for update to authenticated using((select auth.uid())=owner_id) with check((select auth.uid())=owner_id);
create function private.teacher_set_revision() returns trigger language plpgsql security invoker set search_path='' as $$
begin new.revision=old.revision+1;new.updated_at=clock_timestamp();return new;end $$;
revoke all on function private.teacher_set_revision() from public,anon,authenticated;
create trigger teacher_set_revision before update on public.teacher_question_sets for each row execute function private.teacher_set_revision();

create table public.teacher_set_saves(
 teacher_id uuid not null default auth.uid() references public.teachers(id) on delete cascade,
 set_id uuid not null references public.teacher_question_sets(id) on delete cascade,
 created_at timestamptz not null default now(),
 primary key(teacher_id,set_id)
);
create index teacher_set_saves_set on public.teacher_set_saves(set_id);
alter table public.teacher_set_saves enable row level security;
revoke all on public.teacher_set_saves from anon,authenticated;
grant select,delete on public.teacher_set_saves to authenticated;
grant insert(set_id) on public.teacher_set_saves to authenticated;
create policy teacher_set_saves_read on public.teacher_set_saves for select to authenticated using((select auth.uid())=teacher_id);
create policy teacher_set_saves_remove on public.teacher_set_saves for delete to authenticated using((select auth.uid())=teacher_id);
create policy teacher_set_saves_add on public.teacher_set_saves for insert to authenticated with check((select auth.uid())=teacher_id and exists(select 1 from public.teacher_question_sets s where s.id=set_id));
commit;
