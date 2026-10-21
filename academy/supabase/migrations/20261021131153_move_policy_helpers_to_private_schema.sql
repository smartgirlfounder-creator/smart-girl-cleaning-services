-- Policy helpers don't need to be callable through the API.
create schema if not exists private;
grant usage on schema private to authenticated;

alter function public.is_platform_admin() set schema private;
alter function public.my_org_id() set schema private;
alter function public.is_org_owner(uuid) set schema private;
alter function public.owns_member(uuid) set schema private;

create or replace function private.is_org_owner(org uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.memberships m where m.user_id = (select auth.uid()) and m.org_id = org and m.role = 'owner');
$$;

create or replace function public.am_i_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select private.is_platform_admin();
$$;

create or replace function public.regenerate_join_code(org uuid) returns text
language plpgsql security definer set search_path = '' as $$
declare
  code text;
begin
  if not private.is_org_owner(org) then raise exception 'Only the business owner can do this.'; end if;
  code := public.new_join_code();
  update public.organizations set join_code = code where id = org;
  return code;
end;
$$;

create or replace function public.admin_overview()
returns table (
  user_id uuid, full_name text, email text, org_name text, role text,
  signed_up timestamptz, last_sign_in timestamptz, last_seen timestamptz,
  attempts bigint, missions_passed bigint
)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not private.is_platform_admin() then raise exception 'Admins only.'; end if;
  return query
    select u.id, coalesce(p.full_name, ''), u.email::text, o.name, m.role,
           u.created_at, u.last_sign_in_at, p.last_seen_at,
           (select count(*) from public.attempts a where a.user_id = u.id),
           (select count(distinct a.mission_id) from public.attempts a where a.user_id = u.id and a.passed)
    from auth.users u
    left join public.profiles p on p.id = u.id
    left join public.memberships m on m.user_id = u.id
    left join public.organizations o on o.id = m.org_id
    order by u.last_sign_in_at desc nulls last;
end;
$$;
