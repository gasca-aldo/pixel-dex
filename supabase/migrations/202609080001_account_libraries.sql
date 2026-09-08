-- Run once in the Supabase SQL Editor. No existing browser data is changed.
begin;
create table public.account_libraries (
  user_id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null check (jsonb_typeof(payload) = 'object'),
  revision integer not null default 1 check (revision > 0),
  updated_at timestamptz not null default now()
);
alter table public.account_libraries enable row level security;
revoke all on public.account_libraries from anon, authenticated;
grant select on public.account_libraries to authenticated;
create policy "Owners read their library" on public.account_libraries
  for select to authenticated using ((select auth.uid()) = user_id);
-- Writes go through this atomic compare-and-swap operation. Never accept a caller's owner ID.
create function public.save_account_library(library jsonb, expected_revision integer, expected_owner uuid)
returns integer language plpgsql security definer set search_path = '' as $$
declare owner_id uuid := auth.uid(); next_revision integer;
begin
  if owner_id is null or owner_id is distinct from expected_owner then raise exception 'Sign in required'; end if;
  if library is null or jsonb_typeof(library) is distinct from 'object'
    or library->>'version' is distinct from '1'
    or jsonb_typeof(library->'items') is distinct from 'array'
    or octet_length(library::text) > 10000000
    then raise exception 'Invalid library'; end if;
  if expected_revision = 0 then
    insert into public.account_libraries(user_id,payload) values(owner_id,library)
      on conflict (user_id) do nothing returning revision into next_revision;
  else
    update public.account_libraries set payload=library, revision=revision+1, updated_at=now()
      where user_id=owner_id and revision=expected_revision returning revision into next_revision;
  end if;
  if next_revision is null then raise exception 'LIBRARY_CONFLICT'; end if;
  return next_revision;
end;
$$;
revoke all on function public.save_account_library(jsonb,integer,uuid) from public, anon;
grant execute on function public.save_account_library(jsonb,integer,uuid) to authenticated;
commit;
