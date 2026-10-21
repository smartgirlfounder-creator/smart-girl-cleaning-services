-- Smart Cleaners Academy: accounts, businesses, staff, assignments and training records.

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '' check (char_length(full_name) <= 80),
  email text not null default '',
  created_at timestamptz not null default now(),
  last_seen_at timestamptz
);

create table public.platform_admins (
  email text primary key,
  user_id uuid unique references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 80),
  owner_id uuid not null references auth.users(id) on delete cascade,
  join_code text not null unique,
  created_at timestamptz not null default now()
);

-- One business per person in this version.
create table public.memberships (
  user_id uuid primary key references auth.users(id) on delete cascade,
  org_id uuid not null references public.organizations(id) on delete cascade,
  role text not null check (role in ('owner', 'staff')),
  joined_at timestamptz not null default now()
);
create index memberships_org_idx on public.memberships(org_id);

create table public.assignments (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  mission_id text not null check (char_length(mission_id) <= 60),
  assigned_to uuid references auth.users(id) on delete cascade,
  due_date date,
  created_by uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
create index assignments_org_idx on public.assignments(org_id);
create index assignments_assigned_to_idx on public.assignments(assigned_to);
create index assignments_created_by_idx on public.assignments(created_by);

create table public.attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  org_id uuid references public.organizations(id) on delete set null,
  mission_id text not null check (char_length(mission_id) <= 60),
  score int not null check (score between 0 and 100),
  stars int not null check (stars between 0 and 3),
  passed boolean not null,
  critical_errors int not null default 0 check (critical_errors >= 0),
  mistakes jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);
create index attempts_user_idx on public.attempts(user_id, created_at desc);
create index attempts_org_idx on public.attempts(org_id);
create index organizations_owner_idx on public.organizations(owner_id);

insert into public.platform_admins (email) values ('smartgirlfounder@gmail.com');

-- ---------- Helper functions ----------

create function public.is_platform_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.platform_admins pa
    where pa.user_id = (select auth.uid())
       or (pa.user_id is null and lower(pa.email) = lower((select auth.jwt()) ->> 'email'))
  );
$$;

create function public.my_org_id() returns uuid
language sql stable security definer set search_path = '' as $$
  select m.org_id from public.memberships m where m.user_id = (select auth.uid());
$$;

create function public.is_org_owner(org uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.memberships m where m.user_id = (select auth.uid()) and m.org_id = org and m.role = 'owner');
$$;

-- True when the caller owns the business the target person belongs to.
create function public.owns_member(target uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.memberships me join public.memberships them on them.org_id = me.org_id
    where me.user_id = (select auth.uid()) and me.role = 'owner' and them.user_id = target
  );
$$;

create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, coalesce(left(new.raw_user_meta_data ->> 'full_name', 80), ''), coalesce(new.email, ''));
  update public.platform_admins set user_id = new.id
  where user_id is null and lower(email) = lower(new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create function public.new_join_code() returns text
language plpgsql volatile security definer set search_path = '' as $$
declare
  alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  code text;
begin
  loop
    code := '';
    for i in 1..6 loop
      code := code || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    end loop;
    exit when not exists (select 1 from public.organizations o where o.join_code = code);
  end loop;
  return code;
end;
$$;

create function public.create_organization(org_name text) returns public.organizations
language plpgsql security definer set search_path = '' as $$
declare
  me uuid := auth.uid();
  org public.organizations;
begin
  if me is null then raise exception 'Please sign in first.'; end if;
  if exists (select 1 from public.memberships where user_id = me) then
    raise exception 'You already belong to a business.';
  end if;
  insert into public.organizations (name, owner_id, join_code)
  values (trim(org_name), me, public.new_join_code())
  returning * into org;
  insert into public.memberships (user_id, org_id, role) values (me, org.id, 'owner');
  return org;
end;
$$;

create function public.join_organization(code text) returns public.organizations
language plpgsql security definer set search_path = '' as $$
declare
  me uuid := auth.uid();
  org public.organizations;
begin
  if me is null then raise exception 'Please sign in first.'; end if;
  if exists (select 1 from public.memberships where user_id = me) then
    raise exception 'You already belong to a business.';
  end if;
  select * into org from public.organizations where join_code = upper(trim(code));
  if org.id is null then raise exception 'That team code was not found. Check it with your manager.'; end if;
  insert into public.memberships (user_id, org_id, role) values (me, org.id, 'staff');
  return org;
end;
$$;

create function public.regenerate_join_code(org uuid) returns text
language plpgsql security definer set search_path = '' as $$
declare
  code text;
begin
  if not public.is_org_owner(org) then raise exception 'Only the business owner can do this.'; end if;
  code := public.new_join_code();
  update public.organizations set join_code = code where id = org;
  return code;
end;
$$;

create function public.am_i_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select public.is_platform_admin();
$$;

-- Platform admin view of every account, including sign-in times from auth.users.
create function public.admin_overview()
returns table (
  user_id uuid, full_name text, email text, org_name text, role text,
  signed_up timestamptz, last_sign_in timestamptz, last_seen timestamptz,
  attempts bigint, missions_passed bigint
)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_platform_admin() then raise exception 'Admins only.'; end if;
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

revoke execute on function public.is_platform_admin, public.my_org_id, public.is_org_owner, public.owns_member,
  public.new_join_code, public.handle_new_user from public, anon, authenticated;
revoke execute on function public.create_organization, public.join_organization, public.regenerate_join_code,
  public.am_i_admin, public.admin_overview from public, anon;
grant execute on function public.create_organization, public.join_organization, public.regenerate_join_code,
  public.am_i_admin, public.admin_overview to authenticated;
-- Policies call these helpers as the signed-in user.
grant execute on function public.is_platform_admin, public.my_org_id, public.is_org_owner, public.owns_member to authenticated;

-- ---------- Row level security ----------

alter table public.profiles enable row level security;
alter table public.platform_admins enable row level security;
alter table public.organizations enable row level security;
alter table public.memberships enable row level security;
alter table public.assignments enable row level security;
alter table public.attempts enable row level security;

revoke all on public.profiles, public.platform_admins, public.organizations, public.memberships,
  public.assignments, public.attempts from anon;
revoke all on public.platform_admins from authenticated;

-- Profiles: yourself, your team (if you own the business), or the platform admin.
revoke insert, update, delete on public.profiles from authenticated;
grant update (full_name, last_seen_at) on public.profiles to authenticated;
create policy "profiles: read own, team, admin" on public.profiles for select to authenticated
  using (id = (select auth.uid()) or public.owns_member(id) or public.is_platform_admin());
create policy "profiles: update own" on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- Businesses: members read their own; the owner can rename it.
revoke insert, update, delete on public.organizations from authenticated;
grant update (name) on public.organizations to authenticated;
create policy "organizations: read own or admin" on public.organizations for select to authenticated
  using (id = public.my_org_id() or public.is_platform_admin());
create policy "organizations: owner renames" on public.organizations for update to authenticated
  using (public.is_org_owner(id)) with check (public.is_org_owner(id));

-- Team members: you, your team if you're the owner, or the admin. Owners can remove staff; staff can leave.
revoke insert, update on public.memberships from authenticated;
create policy "memberships: read" on public.memberships for select to authenticated
  using (user_id = (select auth.uid()) or public.is_org_owner(org_id) or public.is_platform_admin());
create policy "memberships: remove staff or leave" on public.memberships for delete to authenticated
  using (role = 'staff' and (user_id = (select auth.uid()) or public.is_org_owner(org_id)));

-- Assigned missions.
revoke update on public.assignments from authenticated;
create policy "assignments: read" on public.assignments for select to authenticated
  using (
    public.is_platform_admin()
    or public.is_org_owner(org_id)
    or (org_id = public.my_org_id() and (assigned_to is null or assigned_to = (select auth.uid())))
  );
create policy "assignments: owner creates" on public.assignments for insert to authenticated
  with check (
    public.is_org_owner(org_id)
    and created_by = (select auth.uid())
    and (assigned_to is null or exists (select 1 from public.memberships m where m.user_id = assigned_to and m.org_id = assignments.org_id))
  );
create policy "assignments: owner deletes" on public.assignments for delete to authenticated
  using (public.is_org_owner(org_id));

-- Training records: written by the player, read by the player, their business owner, and the admin.
revoke update, delete on public.attempts from authenticated;
create policy "attempts: insert own" on public.attempts for insert to authenticated
  with check (user_id = (select auth.uid()) and (org_id is null or org_id = public.my_org_id()));
create policy "attempts: read" on public.attempts for select to authenticated
  using (user_id = (select auth.uid()) or public.owns_member(user_id) or public.is_platform_admin());
