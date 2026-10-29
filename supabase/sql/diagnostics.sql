-- =============================================================================
-- StockBit Pro — signup diagnostics (READ-ONLY)
-- Paste sections into Supabase Dashboard → SQL Editor on project
-- knrpqdehivlprvzjkcgx. Nothing here modifies data.
-- =============================================================================

-- 1) Which migrations has the CLI actually applied? If 20260830000002..4 are
--    missing, `db push` aborted early (usually on the non-idempotent
--    publication statements in 20260830000001) and RLS / invites / admin were
--    never installed.
select version, name
from supabase_migrations.schema_migrations
order by version;

-- 2) Triggers on auth.users and public.profiles. Expect:
--    on_auth_user_created, on_auth_user_email_changed,
--    trg_guard_profile_insert, trg_protect_profile_columns.
select n.nspname as schema, c.relname as table, t.tgname as trigger, p.proname as function,
       case t.tgenabled when 'O' then 'enabled' when 'D' then 'DISABLED' else t.tgenabled::text end as state
from pg_trigger t
join pg_class c on c.oid = t.tgrelid
join pg_namespace n on n.oid = c.relnamespace
join pg_proc p on p.oid = t.tgfoid
where not t.tgisinternal
  and ((n.nspname = 'auth' and c.relname = 'users') or (n.nspname = 'public' and c.relname = 'profiles'))
order by 1, 2, 3;

-- 3) Current source of the signup trigger (confirm it is the non-fatal version
--    from 20261015000001_signup_hardening.sql).
select pg_get_functiondef('public.handle_new_user()'::regprocedure);

-- 4) Account health: users without a profile are the signature of a failing
--    trigger; a high unconfirmed count means emails are not arriving.
select
  (select count(*) from auth.users)                                           as auth_users,
  (select count(*) from auth.users where email_confirmed_at is null)          as unconfirmed,
  (select count(*) from public.profiles)                                      as profiles,
  (select count(*) from auth.users u
     where not exists (select 1 from public.profiles p where p.id = u.id))    as users_without_profile,
  (select max(created_at) from auth.users)                                    as last_signup_at;

-- 5) Last 30 signups: confirmed or not, provider, and whether the profile exists.
select u.created_at, u.email, u.email_confirmed_at is not null as confirmed,
       u.raw_app_meta_data->>'provider' as provider,
       (p.id is not null) as has_profile, p.role, p.company_name
from auth.users u
left join public.profiles p on p.id = u.id
order by u.created_at desc
limit 30;

-- 6) Auth audit trail (what GoTrue recorded for recent signups / verifications).
select created_at, payload->>'action' as action, payload->>'actor_username' as actor,
       payload->'traits'->>'provider' as provider
from auth.audit_log_entries
order by created_at desc
limit 50;

-- 7) Realtime publication membership (products, sales, profiles expected).
select schemaname, tablename
from pg_publication_tables
where pubname = 'supabase_realtime'
order by 1, 2;

-- 8) RLS state and policy count for every app table (0 policies + RLS on = locked out).
select c.relname as table, c.relrowsecurity as rls_enabled,
       (select count(*) from pg_policies pp where pp.schemaname = 'public' and pp.tablename = c.relname) as policies
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r'
  and c.relname in ('profiles','products','sales','returns','suppliers','settings','notifications','staff_invites','admin_audit')
order by 1;

-- 9) The role constraint must allow 'staff' (stale constraint = signup 500).
select conname, pg_get_constraintdef(oid)
from pg_constraint
where conrelid = 'public.profiles'::regclass and conname = 'profiles_role_check';

-- =============================================================================
-- Logs Explorer (Dashboard → Logs → Auth / Postgres), not SQL Editor.
-- The actual error text behind "Database error saving new user" lives here.
-- =============================================================================
-- Auth logs, errors only:
--   select timestamp, event_message, metadata.level, metadata.msg, metadata.error
--   from auth_logs cross join unnest(metadata) as metadata
--   where metadata.level in ('error','fatal') or event_message ilike '%signup%'
--   order by timestamp desc limit 100;
--
-- Postgres logs, trigger failures (the warning raised by handle_new_user):
--   select timestamp, event_message
--   from postgres_logs
--   where event_message ilike '%handle_new_user%' or event_message ilike '%ERROR%'
--   order by timestamp desc limit 100;
