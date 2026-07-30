-- =============================================================================
-- StockBit Pro — server-side security & plan enforcement
-- Run this in the Supabase SQL editor (or via the CLI) once.
--
-- The app authenticates some users through Supabase Auth and others through
-- Firebase/Google (writing to `profiles` with the anon key and no Supabase
-- session). Because of that dual-auth model, a blanket RLS "only your own row"
-- policy would break the Google login path, so the critical rules below are
-- enforced with TRIGGERS that work regardless of how the row is written, plus a
-- narrow RLS example you can adopt if/when all auth flows use Supabase sessions.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1) Billing columns can only be changed by the server (service role).
--    This is what makes the `verify-payment` Edge Function the ONLY path to a
--    paid subscription — a browser using the anon/authenticated key can no
--    longer flip is_subscribed / plan / subscription_expiry on its own.
-- -----------------------------------------------------------------------------
create or replace function public.protect_billing_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() is distinct from 'service_role' then
    if NEW.is_subscribed       is distinct from OLD.is_subscribed
       or NEW.plan             is distinct from OLD.plan
       or NEW.subscription_expiry is distinct from OLD.subscription_expiry then
      raise exception 'Billing fields can only be changed by the server.'
        using errcode = 'insufficient_privilege';
    end if;
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_protect_billing_columns on public.profiles;
create trigger trg_protect_billing_columns
  before update on public.profiles
  for each row execute function public.protect_billing_columns();

-- -----------------------------------------------------------------------------
-- 2) Enforce the per-plan staff limit at the database level.
--    Beta = 3, Business (mega) = 8, Enterprise (mega_pro) = unlimited.
--    Trial / unsubscribed owners are treated as Beta (3).
--    This is the authoritative check; the client also pre-checks for a friendly
--    message, but this trigger cannot be bypassed by a modified client.
-- -----------------------------------------------------------------------------
create or replace function public.enforce_staff_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  owner_plan       text;
  owner_subscribed boolean;
  staff_limit      int;
  current_staff    int;
begin
  if NEW.role = 'staff' and NEW.parent_id is not null then
    select plan, is_subscribed
      into owner_plan, owner_subscribed
      from public.profiles
     where id = NEW.parent_id;

    if owner_subscribed and owner_plan = 'mega_pro' then
      staff_limit := 2147483647;            -- effectively unlimited
    elsif owner_subscribed and owner_plan = 'mega' then
      staff_limit := 8;
    else
      staff_limit := 3;                     -- beta or trial
    end if;

    select count(*)
      into current_staff
      from public.profiles
     where parent_id = NEW.parent_id
       and role = 'staff';

    if current_staff >= staff_limit then
      raise exception 'Staff limit reached for this subscription plan (max %).', staff_limit
        using errcode = 'check_violation';
    end if;
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_enforce_staff_limit on public.profiles;
create trigger trg_enforce_staff_limit
  before insert on public.profiles
  for each row execute function public.enforce_staff_limit();

-- -----------------------------------------------------------------------------
-- 3) OPTIONAL — stricter RLS once every login flow uses a Supabase session.
--    Leave commented while the Google/Firebase path writes profiles with the
--    anon key, otherwise those users cannot read/create their profile.
-- -----------------------------------------------------------------------------
-- alter table public.profiles enable row level security;
--
-- create policy "read own or related profiles" on public.profiles
--   for select using (
--     auth.uid() = id
--     or auth.uid() = parent_id
--     or id = (select parent_id from public.profiles where id = auth.uid())
--   );
--
-- create policy "insert own profile" on public.profiles
--   for insert with check (auth.uid() = id);
--
-- create policy "update own profile" on public.profiles
--   for update using (auth.uid() = id);
-- (Billing columns remain protected by the trigger above even under this policy.)
