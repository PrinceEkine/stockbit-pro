-- =============================================================================
-- StockBit Pro — server-side security, tenancy & plan enforcement
--
-- Run this whole file in the Supabase SQL editor (or `supabase db push`).
-- It is idempotent: safe to re-run after every change.
--
-- Model
--   • Every login (email/password AND Google) now produces a Supabase session,
--     so Row Level Security (RLS) is the single enforcement point.
--   • A "business" is the owner profile (role = 'user' | 'admin'). Staff rows
--     point at their owner through `parent_id`. All shop data (products, sales,
--     returns, suppliers, settings) is keyed by the OWNER's id in `user_id`.
--   • Privileged profile columns (billing, role, parent_id, trial start, email)
--     can only be changed by the service role — i.e. by Edge Functions.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 0) Role constraint must permit every role the app uses.
-- -----------------------------------------------------------------------------
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles
  add constraint profiles_role_check check (role in ('admin', 'user', 'staff'));

-- -----------------------------------------------------------------------------
-- 1) Helper functions (SECURITY DEFINER so they can read `profiles` without
--    recursing into the profiles RLS policies).
-- -----------------------------------------------------------------------------
create or replace function public.business_owner_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select case when p.role = 'staff' then p.parent_id else p.id end
  from public.profiles p
  where p.id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select p.role = 'admin' from public.profiles p where p.id = auth.uid()), false);
$$;

revoke all on function public.business_owner_id() from public, anon;
revoke all on function public.is_admin() from public, anon;
grant execute on function public.business_owner_id() to authenticated, service_role;
grant execute on function public.is_admin() to authenticated, service_role;

-- -----------------------------------------------------------------------------
-- 2) Protect privileged profile columns.
--    Only the service role (Edge Functions such as verify-payment) may change
--    billing, role, parent linkage, trial start or email. One exception: an
--    owner may DETACH their own staff (parent_id -> null, role -> 'user'),
--    which is how "remove staff" works without deleting an auth user.
-- -----------------------------------------------------------------------------
create or replace function public.protect_profile_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  is_owner_detaching boolean;
begin
  if auth.role() = 'service_role' then
    return NEW;
  end if;

  -- Billing is server-only, always.
  if NEW.is_subscribed        is distinct from OLD.is_subscribed
     or NEW.plan              is distinct from OLD.plan
     or NEW.subscription_expiry is distinct from OLD.subscription_expiry then
    raise exception 'Billing fields can only be changed by the server.'
      using errcode = 'insufficient_privilege';
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
      OLD.role = 'staff'
      and OLD.parent_id = auth.uid()
      and NEW.parent_id is null
      and NEW.role = 'user';

    if not is_owner_detaching and not public.is_admin() then
      raise exception 'Role and business linkage cannot be changed from the client.'
        using errcode = 'insufficient_privilege';
    end if;
  end if;

  return NEW;
end;
$$;

drop trigger if exists trg_protect_billing_columns on public.profiles;
drop trigger if exists trg_protect_profile_columns on public.profiles;
create trigger trg_protect_profile_columns
  before update on public.profiles
  for each row execute function public.protect_profile_columns();

-- New profiles inserted from the client must belong to the caller and may not
-- self-assign admin. (The `handle_new_user` auth trigger, if present, runs as
-- the service role and is unaffected.)
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
  if NEW.role = 'admin' then
    raise exception 'Admin accounts are provisioned by the server.' using errcode = 'insufficient_privilege';
  end if;
  if NEW.is_subscribed is true or NEW.plan is not null or NEW.subscription_expiry is not null then
    raise exception 'Billing fields can only be set by the server.' using errcode = 'insufficient_privilege';
  end if;
  -- A staff row must point at a real owner.
  if NEW.role = 'staff' then
    if NEW.parent_id is null or not exists (
      select 1 from public.profiles o where o.id = NEW.parent_id and o.role in ('user', 'admin')
    ) then
      raise exception 'Invalid business invite.' using errcode = 'insufficient_privilege';
    end if;
  else
    NEW.parent_id := null;
  end if;
  NEW.trial_start_date := coalesce(NEW.trial_start_date, now());
  return NEW;
end;
$$;

drop trigger if exists trg_guard_profile_insert on public.profiles;
create trigger trg_guard_profile_insert
  before insert on public.profiles
  for each row execute function public.guard_profile_insert();

-- -----------------------------------------------------------------------------
-- 3) Row Level Security — profiles
-- -----------------------------------------------------------------------------
alter table public.profiles enable row level security;

drop policy if exists "profiles_select_related" on public.profiles;
create policy "profiles_select_related" on public.profiles
  for select to authenticated
  using (
    id = auth.uid()
    or id = public.business_owner_id()          -- staff can see their owner
    or parent_id = auth.uid()                   -- owner can see their staff
    or public.is_admin()
  );

drop policy if exists "profiles_insert_self" on public.profiles;
create policy "profiles_insert_self" on public.profiles
  for insert to authenticated
  with check (id = auth.uid());

drop policy if exists "profiles_update_self_or_staff" on public.profiles;
create policy "profiles_update_self_or_staff" on public.profiles
  for update to authenticated
  using (id = auth.uid() or parent_id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or parent_id is null or parent_id = auth.uid() or public.is_admin());

drop policy if exists "profiles_delete_admin" on public.profiles;
create policy "profiles_delete_admin" on public.profiles
  for delete to authenticated
  using (public.is_admin());

-- -----------------------------------------------------------------------------
-- 4) Row Level Security — business data
--    Members (owner + staff) can read and write their business's rows.
--    Destructive deletes are reserved for the owner.
-- -----------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array['products', 'sales', 'returns', 'suppliers', 'settings'] loop
    execute format('alter table public.%I enable row level security', t);

    execute format('drop policy if exists "%s_select_member" on public.%I', t, t);
    execute format(
      'create policy "%s_select_member" on public.%I for select to authenticated using (user_id = public.business_owner_id())', t, t);

    execute format('drop policy if exists "%s_insert_member" on public.%I', t, t);
    execute format(
      'create policy "%s_insert_member" on public.%I for insert to authenticated with check (user_id = public.business_owner_id())', t, t);

    execute format('drop policy if exists "%s_update_member" on public.%I', t, t);
    execute format(
      'create policy "%s_update_member" on public.%I for update to authenticated using (user_id = public.business_owner_id()) with check (user_id = public.business_owner_id())', t, t);

    execute format('drop policy if exists "%s_delete_owner" on public.%I', t, t);
    execute format(
      'create policy "%s_delete_owner" on public.%I for delete to authenticated using (user_id = auth.uid())', t, t);
  end loop;
end $$;

-- Notifications are personal.
alter table public.notifications enable row level security;
drop policy if exists "notifications_own" on public.notifications;
create policy "notifications_own" on public.notifications
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Nothing is readable anonymously.
revoke all on public.profiles, public.products, public.sales, public.returns,
           public.suppliers, public.settings, public.notifications from anon;

-- -----------------------------------------------------------------------------
-- 5) Sales integrity: stock is decremented atomically on the server so two
--    terminals cannot oversell the same unit, and clients cannot fabricate
--    prices — the sale total is recomputed from the products table.
-- -----------------------------------------------------------------------------
create or replace function public.record_sale(
  p_items jsonb,
  p_customer_name text default 'Walk-in',
  p_location text default 'Main Terminal',
  p_payment_method text default 'cash'
)
returns public.sales
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_owner uuid := public.business_owner_id();
  v_item jsonb;
  v_product public.products%rowtype;
  v_qty int;
  v_total numeric := 0;
  v_cost numeric := 0;
  v_tax_rate numeric := 0;
  v_items jsonb := '[]'::jsonb;
  v_sale public.sales;
begin
  if v_owner is null then
    raise exception 'Not a member of any business.' using errcode = 'insufficient_privilege';
  end if;
  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'Cart is empty.';
  end if;

  select coalesce(s.tax_rate, 0) into v_tax_rate from public.settings s where s.user_id = v_owner;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_qty := (v_item->>'quantity')::int;
    if v_qty is null or v_qty <= 0 then
      raise exception 'Invalid quantity.';
    end if;

    select * into v_product from public.products
      where id = (v_item->>'productId')::uuid and user_id = v_owner
      for update;
    if not found then
      raise exception 'Product not found.';
    end if;
    if v_product.quantity < v_qty then
      raise exception 'Not enough stock for "%". Only % left.', v_product.name, v_product.quantity;
    end if;

    update public.products
      set quantity = quantity - v_qty, last_updated = now()
      where id = v_product.id;

    v_total := v_total + v_product.price * v_qty;
    v_cost  := v_cost + coalesce(v_product.cost_price, 0) * v_qty;
    v_items := v_items || jsonb_build_object(
      'productId', v_product.id,
      'productName', v_product.name,
      'quantity', v_qty,
      'price', v_product.price,
      'costPrice', coalesce(v_product.cost_price, 0)
    );
  end loop;

  insert into public.sales (user_id, items, total_price, total_cost, tax_amount, customer_name, location, payment_method, is_checked, is_archived, date)
  values (v_owner, v_items, v_total + v_total * v_tax_rate / 100, v_cost, v_total * v_tax_rate / 100,
          coalesce(nullif(p_customer_name, ''), 'Walk-in'), coalesce(nullif(p_location, ''), 'Main Terminal'),
          coalesce(nullif(p_payment_method, ''), 'cash'), true, false, now())
  returning * into v_sale;

  return v_sale;
end;
$$;

revoke all on function public.record_sale(jsonb, text, text, text) from public, anon;
grant execute on function public.record_sale(jsonb, text, text, text) to authenticated;

-- -----------------------------------------------------------------------------
-- 6) Recommended Auth dashboard settings (cannot be set from SQL):
--    • Authentication → Providers → Email: minimum password length 10,
--      "Leaked password protection" ON.
--    • Authentication → Providers → Google: enable, using the SAME OAuth client
--      ID as your Firebase project (so Firebase's Google ID token can be
--      exchanged for a Supabase session via signInWithIdToken).
--    • Authentication → Rate limits: keep defaults or tighten sign-in attempts.
--    • Authentication → URL configuration: add your production origin(s) to the
--      redirect allow-list.
-- -----------------------------------------------------------------------------
