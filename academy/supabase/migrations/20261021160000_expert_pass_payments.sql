-- Expert Pass: a yearly pass (Paystack) that unlocks Expert missions once payments are switched on.

-- Switches the server checks. Payments stay off until app_settings.payments_enabled is true.
create table public.app_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);
insert into public.app_settings (key, value) values
  ('payments_enabled', 'false'::jsonb),
  ('paid_missions', '["hotel-turnover", "professional-judgement"]'::jsonb),
  ('expert_pass_prices', '{"NGN": 1500000, "USD": 1200}'::jsonb);  -- smallest units: kobo and cents

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null default 'paystack',
  reference text not null unique,
  plan_id text not null,
  currency text not null check (currency in ('NGN', 'USD')),
  amount int not null check (amount > 0),
  paid_at timestamptz not null default now()
);
create index payments_user_idx on public.payments(user_id, paid_at desc);

create table public.entitlements (
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_id text not null,
  expires_at timestamptz not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, plan_id)
);

alter table public.app_settings enable row level security;
alter table public.payments enable row level security;
alter table public.entitlements enable row level security;

revoke all on public.app_settings, public.payments, public.entitlements from anon, authenticated;
grant select on public.app_settings to anon, authenticated;
grant select on public.payments, public.entitlements to authenticated;

create policy "app_settings: anyone reads" on public.app_settings for select to anon, authenticated using (true);
create policy "payments: read own or admin" on public.payments for select to authenticated
  using (user_id = (select auth.uid()) or private.is_platform_admin());
create policy "entitlements: read own, team owner or admin" on public.entitlements for select to authenticated
  using (user_id = (select auth.uid()) or private.owns_member(user_id) or private.is_platform_admin());

-- True when a mission may be played and recorded by the caller.
create function private.mission_allowed(mission text) returns boolean
language sql stable security definer set search_path = '' as $$
  select
    not coalesce((select (value)::text::boolean from public.app_settings where key = 'payments_enabled'), false)
    or not coalesce((select value ? mission from public.app_settings where key = 'paid_missions'), false)
    or exists (
      select 1 from public.entitlements e
      where e.user_id = (select auth.uid()) and e.plan_id = 'expert-pass' and e.expires_at > now()
    );
$$;
grant execute on function private.mission_allowed(text) to authenticated;

drop policy "attempts: insert own" on public.attempts;
create policy "attempts: insert own" on public.attempts for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and (org_id is null or org_id = private.my_org_id())
    and private.mission_allowed(mission_id)
  );

-- Records a verified payment and extends the pass by a year. Idempotent per Paystack reference.
-- Only the payment functions (service role) can call it.
create function public.grant_expert_pass(p_user uuid, p_reference text, p_currency text, p_amount int)
returns timestamptz
language plpgsql security definer set search_path = '' as $$
declare
  inserted int;
  until timestamptz;
begin
  insert into public.payments (user_id, reference, plan_id, currency, amount)
  values (p_user, p_reference, 'expert-pass', p_currency, p_amount)
  on conflict (reference) do nothing;
  get diagnostics inserted = row_count;
  if inserted = 1 then
    insert into public.entitlements as e (user_id, plan_id, expires_at)
    values (p_user, 'expert-pass', now() + interval '365 days')
    on conflict (user_id, plan_id) do update
      set expires_at = greatest(e.expires_at, now()) + interval '365 days', updated_at = now();
  end if;
  select expires_at into until from public.entitlements where user_id = p_user and plan_id = 'expert-pass';
  return until;
end;
$$;
revoke execute on function public.grant_expert_pass(uuid, text, text, int) from public, anon, authenticated;
grant execute on function public.grant_expert_pass(uuid, text, text, int) to service_role;
