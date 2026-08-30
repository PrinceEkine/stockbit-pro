-- =============================================================================
-- StockBit Pro — staff invitations
-- Run AFTER security.sql. Idempotent.
--
--  • Owner mints a short code (SB-XXXX-XXXX), optionally locked to one email,
--    valid for 7 days, revocable at any time.
--  • The joiner signs up normally; on first login the client calls
--    accept_staff_invite(code). Validation (status, expiry, email match, plan
--    staff limit) happens HERE, server-side, so it cannot be bypassed.
--  • Profile linkage is granted only through that RPC — clients can no longer
--    insert a `staff` row or a `parent_id` directly.
-- =============================================================================

create table if not exists public.staff_invites (
  id           uuid primary key default gen_random_uuid(),
  owner_id     uuid not null references public.profiles(id) on delete cascade,
  code         text not null unique,
  email        text,
  status       text not null default 'pending' check (status in ('pending', 'accepted', 'revoked')),
  created_at   timestamptz not null default now(),
  expires_at   timestamptz not null default now() + interval '7 days',
  accepted_by  uuid references public.profiles(id) on delete set null,
  accepted_at  timestamptz
);
create index if not exists staff_invites_owner_idx on public.staff_invites(owner_id, status);

alter table public.staff_invites enable row level security;
revoke all on public.staff_invites from anon;

drop policy if exists "invites_owner_select" on public.staff_invites;
create policy "invites_owner_select" on public.staff_invites
  for select to authenticated using (owner_id = auth.uid());

drop policy if exists "invites_owner_revoke" on public.staff_invites;
create policy "invites_owner_revoke" on public.staff_invites
  for update to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid() and status in ('pending', 'revoked'));

-- Plan limits — keep in sync with constants/plans.ts.
create or replace function public.staff_limit_for(p_owner uuid)
returns int
language sql
stable
security definer
set search_path = public
as $$
  select case
    when p.is_subscribed and (p.subscription_expiry is null or p.subscription_expiry > now()) and p.plan = 'mega_pro' then 999999
    when p.is_subscribed and (p.subscription_expiry is null or p.subscription_expiry > now()) and p.plan = 'mega'     then 8
    else 3
  end
  from public.profiles p where p.id = p_owner;
$$;

-- Owner: mint a new invite code (no ambiguous characters: 0/O, 1/I excluded).
create or replace function public.create_staff_invite(p_email text default null)
returns public.staff_invites
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner  public.profiles%rowtype;
  v_code   text;
  v_row    public.staff_invites;
  v_alpha  text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_staff  int;
  v_limit  int;
  i        int;
begin
  select * into v_owner from public.profiles where id = auth.uid();
  if not found or v_owner.role = 'staff' then
    raise exception 'Only a business owner can invite staff.' using errcode = 'insufficient_privilege';
  end if;

  select count(*) into v_staff from public.profiles where parent_id = v_owner.id and role = 'staff';
  v_limit := public.staff_limit_for(v_owner.id);
  if v_staff >= v_limit then
    raise exception 'Team limit of % reached on your current plan. Upgrade to invite more staff.', v_limit;
  end if;

  if p_email is not null and length(trim(p_email)) > 0 then
    p_email := lower(trim(p_email));
    if p_email !~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]{2,}$' then
      raise exception 'Enter a valid email address.';
    end if;
    -- One live invite per email per business.
    update public.staff_invites set status = 'revoked'
      where owner_id = v_owner.id and status = 'pending' and email = p_email;
  else
    p_email := null;
  end if;

  loop
    v_code := 'SB-';
    for i in 1..8 loop
      v_code := v_code || substr(v_alpha, 1 + floor(random() * length(v_alpha))::int, 1);
      if i = 4 then v_code := v_code || '-'; end if;
    end loop;
    exit when not exists (select 1 from public.staff_invites where code = v_code);
  end loop;

  insert into public.staff_invites (owner_id, code, email)
    values (v_owner.id, v_code, p_email)
    returning * into v_row;
  return v_row;
end;
$$;

-- Anyone (the sign-up page is signed out): minimal preview so the joiner can see
-- which business they are about to join. Reveals only the company name and
-- whether the code is usable — never the owner id.
create or replace function public.preview_staff_invite(p_code text)
returns table (valid boolean, company_name text, reason text)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_inv public.staff_invites;
  v_company text;
begin
  select * into v_inv from public.staff_invites where code = upper(trim(p_code));
  if not found then
    return query select false, null::text, 'Invite code not found.'::text; return;
  end if;
  select p.company_name into v_company from public.profiles p where p.id = v_inv.owner_id;
  if v_inv.status = 'revoked' then
    return query select false, v_company, 'This invite was revoked by the business owner.'::text; return;
  end if;
  if v_inv.status = 'accepted' then
    return query select false, v_company, 'This invite has already been used.'::text; return;
  end if;
  if v_inv.expires_at < now() then
    return query select false, v_company, 'This invite has expired. Ask the owner for a new one.'::text; return;
  end if;
  return query select true, v_company, null::text;
end;
$$;

-- Signed-in user: redeem a code and become staff of that business.
create or replace function public.accept_staff_invite(p_code text)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inv     public.staff_invites;
  v_me      public.profiles%rowtype;
  v_staff   int;
  v_limit   int;
  v_email   text;
begin
  if auth.uid() is null then
    raise exception 'Sign in first.' using errcode = 'insufficient_privilege';
  end if;
  select * into v_me from public.profiles where id = auth.uid();
  if not found then
    raise exception 'Profile not found.';
  end if;
  if v_me.role = 'admin' then
    raise exception 'Administrators cannot join a business as staff.';
  end if;
  if v_me.role = 'staff' and v_me.parent_id is not null then
    raise exception 'You are already a member of a business.';
  end if;
  -- An account that already runs a shop (has data) cannot be absorbed into another business.
  if exists (select 1 from public.products where user_id = v_me.id)
     or exists (select 1 from public.sales where user_id = v_me.id) then
    raise exception 'This account already owns a shop and cannot join another business.';
  end if;

  select * into v_inv from public.staff_invites where code = upper(trim(p_code)) for update;
  if not found then
    raise exception 'Invite code not found.';
  end if;
  if v_inv.status <> 'pending' then
    raise exception 'This invite is no longer valid.';
  end if;
  if v_inv.expires_at < now() then
    raise exception 'This invite has expired. Ask the owner for a new one.';
  end if;
  v_email := lower(coalesce((select u.email from auth.users u where u.id = auth.uid()), v_me.email));
  if v_inv.email is not null and v_inv.email <> v_email then
    raise exception 'This invite was issued to a different email address.';
  end if;
  if v_inv.owner_id = v_me.id then
    raise exception 'You cannot join your own business.';
  end if;

  select count(*) into v_staff from public.profiles where parent_id = v_inv.owner_id and role = 'staff';
  v_limit := public.staff_limit_for(v_inv.owner_id);
  if v_staff >= v_limit then
    raise exception 'This business has reached its team limit (%). Ask the owner to upgrade.', v_limit;
  end if;

  -- Let the protected-column trigger accept this specific, server-validated change.
  perform set_config('stockbit.privileged', '1', true);
  update public.profiles
    set role = 'staff', parent_id = v_inv.owner_id, company_name = ''
    where id = v_me.id
    returning * into v_me;
  perform set_config('stockbit.privileged', '0', true);

  update public.staff_invites
    set status = 'accepted', accepted_by = v_me.id, accepted_at = now()
    where id = v_inv.id;

  return v_me;
end;
$$;

revoke all on function public.create_staff_invite(text) from public, anon;
grant execute on function public.create_staff_invite(text) to authenticated;
revoke all on function public.accept_staff_invite(text) from public, anon;
grant execute on function public.accept_staff_invite(text) to authenticated;
grant execute on function public.preview_staff_invite(text) to anon, authenticated;
revoke all on function public.staff_limit_for(uuid) from public, anon;
grant execute on function public.staff_limit_for(uuid) to authenticated;

-- -----------------------------------------------------------------------------
-- Profile triggers: honour the RPC flag, and stop clients creating staff rows.
-- -----------------------------------------------------------------------------
create or replace function public.protect_profile_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  is_owner_detaching boolean;
  via_rpc boolean := coalesce(current_setting('stockbit.privileged', true), '0') = '1';
begin
  if auth.role() = 'service_role' or via_rpc then
    return NEW;
  end if;

  if NEW.is_subscribed        is distinct from OLD.is_subscribed
     or NEW.plan              is distinct from OLD.plan
     or NEW.subscription_expiry is distinct from OLD.subscription_expiry then
    raise exception 'Billing fields can only be changed by the server.' using errcode = 'insufficient_privilege';
  end if;
  if NEW.trial_start_date is distinct from OLD.trial_start_date then
    raise exception 'Trial start date is immutable.' using errcode = 'insufficient_privilege';
  end if;
  if NEW.email is distinct from OLD.email then
    raise exception 'Email is managed by the authentication service.' using errcode = 'insufficient_privilege';
  end if;
  if NEW.id is distinct from OLD.id then
    raise exception 'Profile id is immutable.' using errcode = 'insufficient_privilege';
  end if;

  if NEW.role is distinct from OLD.role or NEW.parent_id is distinct from OLD.parent_id then
    is_owner_detaching :=
      OLD.role = 'staff' and OLD.parent_id = auth.uid() and NEW.parent_id is null and NEW.role = 'user';
    if not is_owner_detaching and not public.is_admin() then
      raise exception 'Role and business linkage cannot be changed from the client.' using errcode = 'insufficient_privilege';
    end if;
  end if;
  return NEW;
end;
$$;

create or replace function public.guard_profile_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() = 'service_role' or auth.uid() is null then
    return NEW;
  end if;
  if NEW.id <> auth.uid() then
    raise exception 'You can only create your own profile.' using errcode = 'insufficient_privilege';
  end if;
  if NEW.is_subscribed is true or NEW.plan is not null or NEW.subscription_expiry is not null then
    raise exception 'Billing fields can only be set by the server.' using errcode = 'insufficient_privilege';
  end if;
  -- Staff linkage is granted only through accept_staff_invite().
  NEW.role := 'user';
  NEW.parent_id := null;
  NEW.trial_start_date := coalesce(NEW.trial_start_date, now());
  return NEW;
end;
$$;
