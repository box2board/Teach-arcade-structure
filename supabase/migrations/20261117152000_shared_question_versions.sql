begin;
alter table public.teacher_question_sets rename column questions to legacy_questions;
alter table public.teacher_question_sets drop constraint teacher_questions_valid;
alter table public.teacher_question_sets drop column question_count;
alter table public.teacher_question_sets add column question_count integer not null default 0;
alter table public.teacher_question_sets add column topic text not null default '' check(length(topic)<=100);
alter table public.teacher_question_sets add column primary_grade text not null default '' check(length(primary_grade)<=16);
alter table public.teacher_question_sets add column grade_band text not null default '' check(length(grade_band)<=24);
alter table public.teacher_question_sets add column difficulty text not null default '' check(length(difficulty)<=32);
create table public.question_content_versions(
 id uuid primary key default gen_random_uuid(), source_key text not null, version_number integer not null default 1 check(version_number>0),
 question jsonb not null check(jsonb_typeof(question)='object'), content_hash text not null check(content_hash ~ '^[0-9a-f]{32}$'),
 source_type text not null check(source_type in ('official','teacher')), creator_id uuid references public.teachers(id) on delete set null,
 source_set_id uuid references public.teacher_question_sets(id) on delete set null, source_parent_version_id uuid references public.question_content_versions(id) on delete set null,
 source_title text not null default '', created_at timestamptz not null default now(), unique(source_key,version_number));
create index question_versions_hash on public.question_content_versions(content_hash);
create index question_versions_source_set on public.question_content_versions(source_set_id);
create table public.teacher_question_set_items(
 set_id uuid not null references public.teacher_question_sets(id) on delete cascade,
 position integer not null check(position between 0 and 99),
 question_version_id uuid not null references public.question_content_versions(id) on delete restrict,
 source_attribution jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), primary key(set_id,position));
create index teacher_question_items_version on public.teacher_question_set_items(question_version_id);
alter table public.question_content_versions enable row level security;
alter table public.teacher_question_set_items enable row level security;
revoke all on public.question_content_versions,public.teacher_question_set_items from anon,authenticated;
grant select on public.question_content_versions,public.teacher_question_set_items to anon,authenticated;
create policy question_versions_official_read on public.question_content_versions for select to anon,authenticated using(source_type='official');
create policy question_versions_creator_read on public.question_content_versions for select to authenticated using(creator_id=(select auth.uid()));
create policy question_versions_set_read on public.question_content_versions for select to anon,authenticated using(exists(select 1 from public.teacher_question_set_items i join public.teacher_question_sets s on s.id=i.set_id where i.question_version_id=id and (s.owner_id=(select auth.uid()) or (s.visibility='public' and not s.moderation_hidden))));
create policy teacher_question_items_set_read on public.teacher_question_set_items for select to anon,authenticated using(exists(select 1 from public.teacher_question_sets s where s.id=set_id and (s.owner_id=(select auth.uid()) or (s.visibility='public' and not s.moderation_hidden))));
insert into public.question_content_versions(source_key,version_number,question,content_hash,source_type,creator_id,source_set_id,source_title)
select 'legacy:'||s.id::text||':'||(q.ordinality-1)::text,1,q.value,md5(q.value::text),'teacher',s.owner_id,s.id,s.title from public.teacher_question_sets s cross join lateral jsonb_array_elements(s.legacy_questions) with ordinality q(value,ordinality) on conflict do nothing;
insert into public.teacher_question_set_items(set_id,position,question_version_id,source_attribution)
select s.id,(q.ordinality-1)::integer,v.id,jsonb_build_object('source_type','teacher','source_set_id',s.id,'source_title',s.title,'creator_id',s.owner_id)
from public.teacher_question_sets s cross join lateral jsonb_array_elements(s.legacy_questions) with ordinality q(value,ordinality)
join public.question_content_versions v on v.source_key='legacy:'||s.id::text||':'||(q.ordinality-1)::text and v.version_number=1 on conflict do nothing;
update public.teacher_question_sets s set question_count=(select count(*)::integer from public.teacher_question_set_items i where i.set_id=s.id);
create or replace function private.teacher_set_revision() returns trigger language plpgsql security invoker set search_path='' as $$ begin
 if new.title is distinct from old.title or new.description is distinct from old.description or new.subject is distinct from old.subject or new.visibility is distinct from old.visibility or new.topic is distinct from old.topic or new.primary_grade is distinct from old.primary_grade or new.grade_band is distinct from old.grade_band or new.difficulty is distinct from old.difficulty or new.revision is distinct from old.revision then new.revision=old.revision+1;new.updated_at=clock_timestamp(); else new.revision=old.revision;new.updated_at=old.updated_at;end if;return new;end $$;
create function private.reject_question_version_mutation() returns trigger language plpgsql security invoker set search_path='' as $$ begin raise exception 'Question versions are immutable.' using errcode='55000';end $$;
revoke all on function private.reject_question_version_mutation() from public,anon,authenticated;
create trigger question_versions_immutable before update or delete on public.question_content_versions for each row execute function private.reject_question_version_mutation();
create function private.teacher_can_use_question_version(p_version uuid,p_teacher uuid) returns boolean language sql stable security definer set search_path='' as $$ select exists(select 1 from public.question_content_versions v where v.id=p_version and (v.source_type='official' or v.creator_id=p_teacher or exists(select 1 from public.teacher_question_set_items i join public.teacher_question_sets s on s.id=i.set_id where i.question_version_id=v.id and (s.owner_id=p_teacher or (s.visibility='public' and not s.moderation_hidden))))) $$;
revoke all on function private.teacher_can_use_question_version(uuid,uuid) from public,anon,authenticated;
create function private.write_teacher_question_items(p_set uuid,p_questions jsonb,p_versions uuid[],p_sources text[],p_attrs jsonb) returns integer language plpgsql security definer set search_path='' as $$
declare n integer; i integer; q jsonb; v uuid; src text; parent uuid; ver integer; attr jsonb; old public.question_content_versions%rowtype; setrow public.teacher_question_sets%rowtype;
begin
 if jsonb_typeof(p_questions) is distinct from 'array' then raise exception 'Questions must be an array.' using errcode='22023';end if;n:=jsonb_array_length(p_questions);
 select * into setrow from public.teacher_question_sets where id=p_set and owner_id=(select auth.uid()) for update;if not found then raise exception 'Question set not found.' using errcode='42501';end if;
 if n>100 or (p_versions is not null and cardinality(p_versions)<>n) or (p_sources is not null and cardinality(p_sources)<>n) then raise exception 'Question references do not match.' using errcode='22023';end if;
 delete from public.teacher_question_set_items where set_id=p_set;
 if n>0 then for i in 0..n-1 loop q:=p_questions->i;parent:=null;v:=case when p_versions is null then null else p_versions[i+1] end;src:=case when p_sources is null then null else p_sources[i+1] end;attr:=case when jsonb_typeof(p_attrs)='array' then p_attrs->i else '{}'::jsonb end;
  if v is null and src is not null then select id into v from public.question_content_versions where source_key=src and source_type='official' order by version_number desc limit 1;if v is null then raise exception 'Official question is unavailable.' using errcode='22023';end if;end if;
  if v is not null then if not private.teacher_can_use_question_version(v,(select auth.uid())) then raise exception 'Question is private or unavailable.' using errcode='42501';end if;select * into old from public.question_content_versions where id=v;
   if old.question is distinct from q then parent:=v;if old.source_type='official' or old.creator_id is distinct from (select auth.uid()) then src:='teacher:'||p_set::text||':'||md5(old.source_key||':'||old.id::text);end if;v:=null;
   elsif coalesce(attr,'{}'::jsonb)='{}'::jsonb then attr:=jsonb_build_object('source_type',old.source_type,'source_set_id',old.source_set_id,'source_title',old.source_title,'creator_id',old.creator_id);end if;
  end if;
  if v is null then if src is null then src:='teacher:'||p_set::text||':'||gen_random_uuid()::text;end if;select coalesce(max(version_number),0)+1 into ver from public.question_content_versions where source_key=src;
   insert into public.question_content_versions(source_key,version_number,question,content_hash,source_type,creator_id,source_set_id,source_parent_version_id,source_title) values(src,ver,q,md5(q::text),'teacher',(select auth.uid()),p_set,parent,setrow.title) returning id into v;
   if parent is not null and not(attr ? 'source_type') then select jsonb_build_object('source_type',source_type,'source_set_id',source_set_id,'source_title',source_title,'creator_id',creator_id) into attr from public.question_content_versions where id=parent;end if;
  end if;
  insert into public.teacher_question_set_items(set_id,position,question_version_id,source_attribution) values(p_set,i,v,coalesce(attr,'{}'::jsonb));
 end loop;end if;
 update public.teacher_question_sets set question_count=n,legacy_questions='[]'::jsonb where id=p_set;return n;
end $$;
revoke all on function private.write_teacher_question_items(uuid,jsonb,uuid[],text[],jsonb) from public,anon,authenticated;
create function public.create_teacher_question_set_v2(p_metadata jsonb,p_questions jsonb,p_versions uuid[],p_sources text[],p_attrs jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare new_id uuid;vis text:=coalesce(p_metadata->>'visibility','private');n integer;
begin if (select auth.uid()) is null then raise exception 'Sign in required.' using errcode='42501';end if;
 if not private.valid_teacher_questions(p_questions,vis='public') or vis not in ('private','public') then raise exception 'Question set is incomplete or invalid.' using errcode='22023';end if;
 insert into public.teacher_question_sets(owner_id,title,description,subject,visibility,legacy_questions,topic,primary_grade,grade_band,difficulty,question_count) values((select auth.uid()),btrim(p_metadata->>'title'),coalesce(btrim(p_metadata->>'description'),''),p_metadata->>'subject','private','[]',coalesce(btrim(p_metadata->>'topic'),''),coalesce(btrim(p_metadata->>'primary_grade'),''),coalesce(btrim(p_metadata->>'grade_band'),''),coalesce(btrim(p_metadata->>'difficulty'),''),0) returning id into new_id;
 n:=private.write_teacher_question_items(new_id,p_questions,p_versions,p_sources,p_attrs);if vis='public' then update public.teacher_question_sets set visibility='public' where id=new_id;end if;return jsonb_build_object('id',new_id,'question_count',n);
end $$;
revoke all on function public.create_teacher_question_set_v2(jsonb,jsonb,uuid[],text[],jsonb) from public,anon;grant execute on function public.create_teacher_question_set_v2(jsonb,jsonb,uuid[],text[],jsonb) to authenticated;
create function public.update_teacher_question_set_v2(p_id uuid,p_revision integer,p_metadata jsonb,p_questions jsonb,p_versions uuid[],p_sources text[],p_attrs jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare s public.teacher_question_sets%rowtype;vis text:=coalesce(p_metadata->>'visibility','private');n integer;r integer;
begin if (select auth.uid()) is null then raise exception 'Sign in required.' using errcode='42501';end if;select * into s from public.teacher_question_sets where id=p_id and owner_id=(select auth.uid()) for update;if not found then raise exception 'Question set not found.' using errcode='42501';end if;if s.revision<>p_revision then return jsonb_build_object('conflict',true);end if;
 if not private.valid_teacher_questions(p_questions,vis='public') or vis not in ('private','public') then raise exception 'Question set is incomplete or invalid.' using errcode='22023';end if;
 update public.teacher_question_sets set title=btrim(p_metadata->>'title'),description=coalesce(btrim(p_metadata->>'description'),''),subject=p_metadata->>'subject',topic=coalesce(btrim(p_metadata->>'topic'),''),primary_grade=coalesce(btrim(p_metadata->>'primary_grade'),''),grade_band=coalesce(btrim(p_metadata->>'grade_band'),''),difficulty=coalesce(btrim(p_metadata->>'difficulty'),''),visibility=vis,legacy_questions='[]' where id=p_id;
 n:=private.write_teacher_question_items(p_id,p_questions,p_versions,p_sources,p_attrs);select revision into r from public.teacher_question_sets where id=p_id;if r=s.revision then update public.teacher_question_sets set revision=revision+1 where id=p_id returning revision into r;end if;return jsonb_build_object('id',p_id,'revision',r,'question_count',n);
end $$;
revoke all on function public.update_teacher_question_set_v2(uuid,integer,jsonb,jsonb,uuid[],text[],jsonb) from public,anon;grant execute on function public.update_teacher_question_set_v2(uuid,integer,jsonb,jsonb,uuid[],text[],jsonb) to authenticated;
create function public.copy_teacher_question_set_v2(p_source uuid,p_title text) returns jsonb language plpgsql security definer set search_path='' as $$
declare s public.teacher_question_sets%rowtype;new_id uuid;n integer;
begin if (select auth.uid()) is null then raise exception 'Sign in required.' using errcode='42501';end if;select * into s from public.teacher_question_sets where id=p_source and visibility='public' and not moderation_hidden for share;if not found then raise exception 'Set unavailable.' using errcode='42501';end if;
 insert into public.teacher_question_sets(owner_id,title,description,subject,visibility,legacy_questions,topic,primary_grade,grade_band,difficulty,question_count) values((select auth.uid()),left(coalesce(nullif(btrim(p_title),''),s.title||' (copy)'),120),s.description,s.subject,'private','[]',s.topic,s.primary_grade,s.grade_band,s.difficulty,s.question_count) returning id into new_id;
 insert into public.teacher_question_set_items(set_id,position,question_version_id,source_attribution) select new_id,i.position,i.question_version_id,coalesce(i.source_attribution,'{}'::jsonb)||jsonb_build_object('selected_from_set_id',s.id,'selected_from_title',s.title,'selected_from_creator_id',s.owner_id) from public.teacher_question_set_items i where i.set_id=s.id order by i.position;get diagnostics n=row_count;return jsonb_build_object('id',new_id,'question_count',n);
end $$;
revoke all on function public.copy_teacher_question_set_v2(uuid,text) from public,anon;grant execute on function public.copy_teacher_question_set_v2(uuid,text) to authenticated;
revoke insert,update,delete on public.teacher_question_sets from anon,authenticated;
revoke insert(title,description,subject,legacy_questions,visibility,owner_id,question_count,revision) on public.teacher_question_sets from anon,authenticated;
revoke update(title,description,subject,legacy_questions,visibility,owner_id,question_count,revision) on public.teacher_question_sets from anon,authenticated;
grant select on public.teacher_question_sets to anon,authenticated;
commit;
