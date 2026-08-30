-- =============================================================================
-- StockBit Pro — platform administration
-- Run AFTER security.sql and staff_invites.sql. Idempotent.
--
--  • Fixes the profile-protection triggers so changes made in the Supabase SQL
--    editor (no auth context) are allowed — otherwise you cannot even promote
--    an admin by hand.
--  • Adds an append-only admin audit table used by the admin-users function.
--  • Makes the platform owner an admin (edit the email below if needed).
-- =============================================================================

-- ----------------------------------------------------------------------------
-- 1) Triggers: bypass for service role, the SQL editor (auth.uid() is null) and
--    the accept_staff_invite RPC flag.
-- ----------------------------------------------------------------------------
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
  if auth.role() = 'service_role' or auth.uid() is null or via_rpc then
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

-- ----------------------------------------------------------------------------
-- 2) Audit log of admin actions (append-only; readable by admins only).
-- ----------------------------------------------------------------------------
create table if not exists public.admin_audit (
  id         uuid primary key default gen_random_uuid(),
  admin_id   uuid references public.profiles(id) on delete set null,
  action     text not null,
  target_id  uuid,
  detail     jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.admin_audit enable row level security;
revoke all on public.admin_audit from anon;
drop policy if exists "audit_admin_read" on public.admin_audit;
create policy "audit_admin_read" on public.admin_audit
  for select to authenticated using (public.is_admin());
-- No insert/update/delete policies: only the service role (Edge Function) writes.

-- ----------------------------------------------------------------------------
-- 3) Platform owner. Change the email if needed, then re-run.
-- ----------------------------------------------------------------------------
update public.profiles
   set role = 'admin', parent_id = null
 where lower(email) = lower('princedagogoekine@gmail.com');

-- Optional: demote every other admin to a normal owner account.
-- update public.profiles set role = 'user'
--  where role = 'admin' and lower(email) <> lower('princedagogoekine@gmail.com');
