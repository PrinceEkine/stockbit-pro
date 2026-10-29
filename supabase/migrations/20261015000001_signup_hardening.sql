-- =============================================================================
-- StockBit Pro — signup hardening
-- Run AFTER admin.sql. Idempotent.
--
-- Why this exists
--   1) Any exception raised inside the `on_auth_user_created` trigger makes
--      Supabase Auth reject the whole signup with "Database error saving new
--      user" (HTTP 500). The profile row is a side effect that the client can
--      recreate on first login (see hydrateFromSession in store.ts), so it must
--      never be allowed to block account creation. This version catches and
--      logs instead of raising.
--   2) `alter publication ... add table` is NOT idempotent: it fails with
--      "relation is already member of publication" when the table was added by
--      an earlier manual run of schema.sql. That aborts `supabase db push`
--      before the security / invites / admin migrations run. The guarded block
--      below is safe to re-run and is the form future migrations should use.
--   3) `profiles.email` is kept in sync when a user changes their email
--      through Supabase Auth (previously it went stale forever).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1) Profile creation can never block signup.
-- -----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text := coalesce(
    nullif(new.raw_user_meta_data->>'full_name', ''),
    nullif(new.raw_user_meta_data->>'name', ''),
    split_part(coalesce(new.email, ''), '@', 1)
  );
begin
  begin
    insert into public.profiles (id, email, name, company_name, role, parent_id, trial_start_date)
    values (
      new.id,
      new.email,
      v_name,
      case
        when coalesce(new.raw_user_meta_data->>'invite_code', '') <> '' then ''
        else coalesce(nullif(new.raw_user_meta_data->>'company_name', ''), v_name || ' Shop')
      end,
      'user',
      null,
      now()
    )
    on conflict (id) do nothing;
  exception when others then
    -- Logged to Postgres logs; the client self-heals the missing row on first login.
    raise warning 'handle_new_user: profile insert failed for % (%): %', new.id, sqlstate, sqlerrm;
  end;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- -----------------------------------------------------------------------------
-- 2) Keep profiles.email in sync with auth.users.email (email change flow).
--    Runs as the auth service, so protect_profile_columns lets it through
--    (auth.uid() is null in that context).
-- -----------------------------------------------------------------------------
create or replace function public.handle_user_email_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.email is distinct from old.email then
    begin
      update public.profiles set email = new.email where id = new.id;
    exception when others then
      raise warning 'handle_user_email_change: failed for % (%): %', new.id, sqlstate, sqlerrm;
    end;
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_email_changed on auth.users;
create trigger on_auth_user_email_changed
  after update of email on auth.users
  for each row execute function public.handle_user_email_change();

-- -----------------------------------------------------------------------------
-- 3) Realtime publication membership, idempotently.
-- -----------------------------------------------------------------------------
do $$
declare
  t text;
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
  foreach t in array array['products', 'sales', 'profiles'] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;

-- -----------------------------------------------------------------------------
-- 4) Sanity: the role constraint must accept every role the app uses
--    (a stale constraint here is the other classic cause of signup 500s).
-- -----------------------------------------------------------------------------
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles
  add constraint profiles_role_check check (role in ('admin', 'user', 'staff'));
