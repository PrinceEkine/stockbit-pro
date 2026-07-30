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
-- 0) The `role` column must permit every role the app uses: 'admin', 'user',
--    and 'staff'. If the check constraint omits 'staff', staff sign-ups fail
--    with the opaque "Database error saving new user" (the profile insert
--    violates profiles_role_check inside the auth signup transaction).
-- -----------------------------------------------------------------------------
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles
  add constraint profiles_role_check check (role in ('admin', 'user', 'staff'));

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
-- 2) Per-plan staff limit (Beta = 3, Business = 8, Enterprise = unlimited).
--
--    IMPORTANT: This is enforced in the APPLICATION (store.ts `register()`),
--    NOT with a database trigger. Many Supabase projects have a
--    `handle_new_user` trigger that creates the profile row inside the auth
--    signup transaction. A BEFORE INSERT trigger on `profiles` therefore runs
--    *during* signup, and if it raises for any reason Supabase Auth aborts the
--    whole signup with the opaque message "Database error saving new user".
--
--    If you previously ran an earlier version of this file that installed
--    `trg_enforce_staff_limit`, REMOVE it (it will otherwise block sign-ups):
--
--        drop trigger if exists trg_enforce_staff_limit on public.profiles;
--        drop function if exists public.enforce_staff_limit();
--
--    (The client-side check in `register()` remains the enforcement point and
--    gives users a friendly "team limit reached, ask the owner to upgrade"
--    message before any signup is attempted.)
-- -----------------------------------------------------------------------------

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
