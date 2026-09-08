begin;
create table public.profile_handles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  handle text not null unique check (handle ~ '^[a-z0-9][a-z0-9_-]{2,29}$')
);
create table public.list_addresses (
  user_id uuid not null references auth.users(id) on delete cascade,
  list_id text not null,
  slug text not null,
  primary key(user_id,list_id), unique(user_id,slug)
);
alter table public.profile_handles enable row level security;
alter table public.list_addresses enable row level security;
revoke all on public.profile_handles, public.list_addresses from anon, authenticated;
grant select on public.profile_handles, public.list_addresses to authenticated;
create policy "Owner reads address" on public.profile_handles for select to authenticated using ((select auth.uid())=user_id);
create policy "Owner reads list addresses" on public.list_addresses for select to authenticated using ((select auth.uid())=user_id);
create function public.claim_profile_handle(chosen_handle text) returns text
language plpgsql security definer set search_path='' as $$
declare result text; clean text := lower(trim(chosen_handle));
begin
  if auth.uid() is null then raise exception 'Sign in required'; end if;
  if clean !~ '^[a-z0-9][a-z0-9_-]{2,29}$' then raise exception 'Use 3–30 lowercase letters, numbers, underscores or hyphens'; end if;
  select handle into result from public.profile_handles where user_id=auth.uid();
  if result is not null then
    if result <> clean then raise exception 'Your profile address is already set'; end if;
    return result;
  end if;
  insert into public.profile_handles values(auth.uid(),clean);
  return clean;
exception when unique_violation then raise exception 'This username is already taken';
end; $$;
create function public.sync_list_addresses() returns trigger
language plpgsql security definer set search_path='' as $$
begin
  insert into public.list_addresses(user_id,list_id,slug)
    select new.user_id, l->>'id',
      coalesce(nullif(trim(both '-' from left(regexp_replace(lower(l->>'title'),'[^a-z0-9]+','-','g'),60)),''),'list') || '-' || md5(l->>'id')
    from jsonb_array_elements(coalesce(new.payload->'lists','[]'::jsonb)) l
    where l->>'id' is not null
    on conflict(user_id,list_id) do nothing;
  return new;
end; $$;
create trigger account_list_addresses after insert or update of payload on public.account_libraries
for each row execute function public.sync_list_addresses();
-- Populate existing lists without changing library revisions.
insert into public.list_addresses(user_id,list_id,slug)
select a.user_id,l->>'id', coalesce(nullif(trim(both '-' from left(regexp_replace(lower(l->>'title'),'[^a-z0-9]+','-','g'),60)),''),'list') || '-' || md5(l->>'id')
from public.account_libraries a cross join lateral jsonb_array_elements(coalesce(a.payload->'lists','[]'::jsonb)) l
where l->>'id' is not null;
create function public.shared_game(game jsonb) returns jsonb
language sql immutable set search_path='' as $$
 select jsonb_strip_nulls(jsonb_build_object('id',game->>'id','title',game->>'title','catalogId',game->>'catalogId'));
$$;
create function public.shared_list_projection(list jsonb, address text) returns jsonb
language sql immutable set search_path='' as $$
 select jsonb_build_object('id',list->>'id','title',list->>'title','description',coalesce(list->>'description',''),
 'ranked',coalesce(list->'ranked','false'::jsonb),'visibility',list->>'visibility','slug',address,
 'entries',coalesce((select jsonb_agg(jsonb_build_object('game',public.shared_game(e->'game'),'note',coalesce(e->>'note','')) order by n)
 from jsonb_array_elements(coalesce(list->'entries','[]'::jsonb)) with ordinality as entries(e,n)),'[]'::jsonb));
$$;
create function public.read_shared_profile(profile_handle text) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare owner_id uuid; library jsonb; result jsonb;
begin
  select user_id into owner_id from public.profile_handles where handle=profile_handle;
  if owner_id is null then return null; end if;
  select payload into library from public.account_libraries where user_id=owner_id;
  return jsonb_build_object('handle',profile_handle,'name',coalesce(library->'profile'->>'name',profile_handle),
    'bio',coalesce(library->'profile'->>'bio',''),
    'topGames',coalesce((select jsonb_agg(public.shared_game(game) order by n)
      from jsonb_array_elements(coalesce(library->'profile'->'topGames','[]'::jsonb)) with ordinality as favorites(game,n) where n<=6),'[]'::jsonb),
    'lists',coalesce((select jsonb_agg(public.shared_list_projection(l,ad.slug))
      from jsonb_array_elements(coalesce(library->'lists','[]'::jsonb)) l
      join public.list_addresses ad on ad.user_id=owner_id and ad.list_id=l->>'id'
      where l->>'visibility'='Public'),'[]'::jsonb),
    'collection',case when library->>'collectionVisibility'='Public' then coalesce((select jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
      'id',i->>'id','title',i->>'title','kind',i->>'kind','owned',i->'owned','platform',i->>'platform','catalogId',i->>'catalogId')))
      from jsonb_array_elements(coalesce(library->'items','[]'::jsonb)) i),'[]'::jsonb) else null end);
end; $$;
create function public.read_shared_list(profile_handle text, list_slug text) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare owner_id uuid; list jsonb; library jsonb; list_key text;
begin
  select user_id into owner_id from public.profile_handles where handle=profile_handle;
  if owner_id is null then return null; end if;
  select list_id into list_key from public.list_addresses where user_id=owner_id and slug=list_slug;
  select payload into library from public.account_libraries where user_id=owner_id;
  select l into list from jsonb_array_elements(coalesce(library->'lists','[]'::jsonb)) l where l->>'id'=list_key;
  if list is null or ((list->>'visibility') not in ('Public','Unlisted') and auth.uid() is distinct from owner_id)
    or list->>'visibility' is null then return null; end if;
  return jsonb_build_object('handle',profile_handle,'name',coalesce(library->'profile'->>'name',profile_handle),
    'list',public.shared_list_projection(list,list_slug));
end; $$;
revoke all on function public.claim_profile_handle(text), public.sync_list_addresses(), public.shared_game(jsonb), public.shared_list_projection(jsonb,text), public.read_shared_profile(text), public.read_shared_list(text,text) from public,anon,authenticated;
grant execute on function public.claim_profile_handle(text) to authenticated;
grant execute on function public.read_shared_profile(text), public.read_shared_list(text,text) to anon,authenticated;
commit;
