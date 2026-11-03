create or replace function private.valid_teacher_questions(items jsonb, complete boolean)
returns boolean language plpgsql immutable security invoker set search_path='' as $$
declare q jsonb; choice jsonb; a jsonb; answer_count integer;
begin
 if jsonb_typeof(items) is distinct from 'array' then return false; end if;
 if jsonb_array_length(items)>100 or (complete and jsonb_array_length(items)<12) then return false; end if;
 for q in select value from jsonb_array_elements(items) loop
  if jsonb_typeof(q) is distinct from 'object'
   or jsonb_typeof(q->'question') is distinct from 'string' or length(q->>'question')>1000
   or jsonb_typeof(q->'choices') is distinct from 'array'
   or jsonb_typeof(q->'explanation') is distinct from 'string' or length(q->>'explanation')>2000 then return false; end if;
  if jsonb_typeof(q->'answer')='array' then
   if jsonb_array_length(q->'answer')>4 then return false; end if;
   for a in select value from jsonb_array_elements(q->'answer') loop
    if jsonb_typeof(a) is distinct from 'number' or (a #>> '{}') not in ('0','1','2','3') then return false; end if;
   end loop;
   answer_count=jsonb_array_length(q->'answer');
   if (select count(distinct value) from jsonb_array_elements(q->'answer'))<>answer_count then return false; end if;
  elsif jsonb_typeof(q->'answer')='number' and (q->>'answer') in ('-1','0','1','2','3') then
   answer_count=case when (q->>'answer')='-1' then 0 else 1 end;
  else return false;
  end if;
  if jsonb_array_length(q->'choices')<>4 then return false; end if;
  for choice in select value from jsonb_array_elements(q->'choices') loop
   if jsonb_typeof(choice) is distinct from 'string' or length(choice #>> '{}')>500 then return false; end if;
   if complete and length(btrim(choice #>> '{}'))=0 then return false; end if;
  end loop;
  if complete and (length(btrim(q->>'question'))=0 or answer_count=0
   or (select count(distinct lower(normalize(btrim(value),NFKC))) from jsonb_array_elements_text(q->'choices'))<>4) then return false; end if;
 end loop;
 return true;
end $$;
