begin;
create table public.cabinet_projects (
  id uuid primary key,
  owner_id uuid not null default auth.uid() references public.teachers(id) on delete cascade,
  tool text not null check (tool in ('block-builder','citycanvas','graphic-organizer','timeline','comic','flashcards','clash','graph','art','race')),
  title text not null check (length(trim(title)) between 1 and 120),
  revision integer not null default 1,
  operation uuid not null,
  content bytea not null check (octet_length(content) between 2 and 27262976),
  size integer generated always as (octet_length(content)) stored,
  updated_at timestamptz not null default now()
);
create index cabinet_projects_owner on public.cabinet_projects(owner_id,updated_at desc,id);
create table public.cabinet_parts (
  owner_id uuid not null default auth.uid() references public.teachers(id) on delete cascade,
  upload uuid not null,
  part integer not null check (part between 0 and 45),
  content bytea not null check (octet_length(content) between 1 and 600000),
  created_at timestamptz not null default now(),
  primary key(owner_id,upload,part)
);
alter table public.cabinet_projects enable row level security;
alter table public.cabinet_parts enable row level security;
revoke all on public.cabinet_projects, public.cabinet_parts from public,anon,authenticated;
grant select, insert, update, delete on public.cabinet_projects to authenticated;
grant select, insert, delete on public.cabinet_parts to authenticated;
create policy own_cabinet on public.cabinet_projects for all to authenticated
  using (owner_id=(select auth.uid())) with check (owner_id=(select auth.uid()));
create policy own_cabinet_parts on public.cabinet_parts for all to authenticated
  using (owner_id=(select auth.uid())) with check (owner_id=(select auth.uid()));

create function public.cabinet_stage(upload uuid, part integer, encoded text)
returns void language plpgsql security invoker set search_path='' as $$
begin
  if part=0 then
    delete from public.cabinet_parts where owner_id=auth.uid() and created_at<now()-interval '1 day';
  end if;
  insert into public.cabinet_parts(upload,part,content) values(upload,part,decode(encoded,'base64'))
    on conflict do nothing;
end;
$$;

create function public.cabinet_save(project_id uuid, upload uuid, project_tool text, project_title text, expected integer, parts integer)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare
  saved public.cabinet_projects%rowtype;
  payload bytea;
  received integer;
begin
  perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text||':'||project_id::text,0));
  select * into saved from public.cabinet_projects p where p.id=project_id and p.owner_id=auth.uid() for update;
  if saved.operation=cabinet_save.upload then
    delete from public.cabinet_parts p where p.owner_id=auth.uid() and p.upload=cabinet_save.upload;
    return to_jsonb(saved)-'content'-'owner_id'-'operation';
  end if;
  if (saved.id is null and expected<>0) or
     (saved.id is not null and (saved.revision<>expected or saved.tool<>project_tool)) then return null; end if;
  select count(*),string_agg(p.content,''::bytea order by p.part) into received,payload
    from public.cabinet_parts p where p.owner_id=auth.uid() and p.upload=cabinet_save.upload and p.part<parts;
  if received<>parts or jsonb_typeof(convert_from(payload,'UTF8')::jsonb) is distinct from 'object' then
    raise exception 'Incomplete project upload';
  end if;
  if expected=0 then
    insert into public.cabinet_projects(id,tool,title,operation,content)
      values(project_id,project_tool,project_title,upload,payload) returning * into saved;
  else
    update public.cabinet_projects p set title=project_title,operation=upload,content=payload,
      revision=p.revision+1,updated_at=now() where p.id=project_id returning * into saved;
  end if;
  delete from public.cabinet_parts p where p.owner_id=auth.uid() and p.upload=cabinet_save.upload;
  return to_jsonb(saved)-'content'-'owner_id'-'operation';
end;
$$;

create function public.cabinet_read(project_id uuid, expected integer, part integer)
returns text language sql security invoker set search_path='' as $$
  select encode(substring(content from (part*600000+1) for 600000),'base64')
    from public.cabinet_projects where id=project_id and revision=expected and owner_id=auth.uid()
      and part between 0 and 45;
$$;

create function public.cabinet_duplicate(project_id uuid, copy_id uuid, expected integer)
returns jsonb language sql security invoker set search_path='' as $$
  insert into public.cabinet_projects as p(id,tool,title,operation,content)
    select copy_id,tool,left(title,113)||' (copy)',copy_id,content
    from public.cabinet_projects where id=project_id and revision=expected and owner_id=auth.uid()
    returning to_jsonb(p)-'content'-'owner_id'-'operation';
$$;

revoke all on function public.cabinet_stage(uuid,integer,text), public.cabinet_save(uuid,uuid,text,text,integer,integer),
  public.cabinet_read(uuid,integer,integer), public.cabinet_duplicate(uuid,uuid,integer) from public,anon,authenticated;
grant execute on function public.cabinet_stage(uuid,integer,text), public.cabinet_save(uuid,uuid,text,text,integer,integer),
  public.cabinet_read(uuid,integer,integer), public.cabinet_duplicate(uuid,uuid,integer) to authenticated;
commit;
