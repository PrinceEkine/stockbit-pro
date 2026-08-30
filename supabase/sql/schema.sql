-- =============================================================================
-- StockBit Pro — base schema
-- Run this FIRST in the Supabase SQL editor, then security.sql, then
-- staff_invites.sql. Idempotent (safe to re-run).
-- =============================================================================

create extension if not exists pgcrypto;

-- -----------------------------------------------------------------------------
-- profiles: one row per auth user. Owners have role 'user' (or 'admin');
-- staff have role 'staff' and point at their owner via parent_id.
-- -----------------------------------------------------------------------------
create table if not exists public.profiles (
  id                  uuid primary key references auth.users(id) on delete cascade,
  email               text,
  name                text not null default '',
  company_name        text not null default '',
  role                text not null default 'user' check (role in ('admin', 'user', 'staff')),
  parent_id           uuid references public.profiles(id) on delete set null,
  trial_start_date    timestamptz not null default now(),
  is_subscribed       boolean not null default false,
  plan                text check (plan in ('beta', 'mega', 'mega_pro')),
  subscription_expiry timestamptz,
  is_verified         boolean not null default false,
  created_at          timestamptz not null default now()
);
create index if not exists profiles_parent_idx on public.profiles(parent_id);
create index if not exists profiles_email_idx on public.profiles(lower(email));

-- Auto-create the profile when a user signs up (runs as the auth service, so it
-- is unaffected by RLS/triggers aimed at clients). The app also self-heals if
-- this row is missing. Role is always 'user' here; staff linkage happens only
-- through accept_staff_invite().
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text := coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(coalesce(new.email, ''), '@', 1));
begin
  insert into public.profiles (id, email, name, company_name, role, parent_id, trial_start_date)
  values (
    new.id,
    new.email,
    v_name,
    case when coalesce(new.raw_user_meta_data->>'invite_code', '') <> '' then '' else coalesce(nullif(new.raw_user_meta_data->>'company_name', ''), v_name || ' Shop') end,
    'user',
    null,
    now()
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- -----------------------------------------------------------------------------
-- settings: one row per business (keyed by the OWNER's id).
-- -----------------------------------------------------------------------------
create table if not exists public.settings (
  user_id                uuid primary key references public.profiles(id) on delete cascade,
  company_name           text,
  currency               text default '₦',
  categories             jsonb default '[]'::jsonb,
  low_stock_email_alerts boolean default true,
  notification_email     text,
  language               text default 'en',
  theme                  text default 'light',
  tax_rate               numeric default 7.5,
  updated_at             timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- suppliers
-- -----------------------------------------------------------------------------
create table if not exists public.suppliers (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  name          text not null,
  "contactName" text default '',
  email         text default '',
  phone         text default '',
  category      text default '',
  created_at    timestamptz not null default now()
);
create index if not exists suppliers_user_idx on public.suppliers(user_id);

-- -----------------------------------------------------------------------------
-- products
-- -----------------------------------------------------------------------------
create table if not exists public.products (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null references public.profiles(id) on delete cascade,
  name                 text not null,
  sku                  text default '',
  category             text default '',
  price                numeric not null default 0 check (price >= 0),
  cost_price           numeric not null default 0 check (cost_price >= 0),
  quantity             integer not null default 0 check (quantity >= 0),
  min_threshold        integer not null default 5,
  supplier_id          uuid references public.suppliers(id) on delete set null,
  batch_number         text default '',
  expiry_date          date,
  location             text default 'Main Store',
  sustainability_score integer default 0,
  last_updated         timestamptz not null default now(),
  created_at           timestamptz not null default now()
);
create index if not exists products_user_idx on public.products(user_id);
create index if not exists products_user_sku_idx on public.products(user_id, sku);

-- -----------------------------------------------------------------------------
-- sales (items is a JSON array of {productId, productName, quantity, price, costPrice})
-- -----------------------------------------------------------------------------
create table if not exists public.sales (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.profiles(id) on delete cascade,
  items          jsonb not null default '[]'::jsonb,
  total_price    numeric not null default 0,
  total_cost     numeric not null default 0,
  tax_amount     numeric not null default 0,
  customer_name  text default 'Walk-in',
  location       text default 'Main Terminal',
  payment_method text default 'cash',
  is_checked     boolean not null default true,
  is_archived    boolean not null default false,
  date           timestamptz not null default now()
);
create index if not exists sales_user_date_idx on public.sales(user_id, date desc);

-- -----------------------------------------------------------------------------
-- returns
-- -----------------------------------------------------------------------------
create table if not exists public.returns (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  sale_id      uuid references public.sales(id) on delete set null,
  product_id   uuid references public.products(id) on delete set null,
  product_name text not null default '',
  quantity     integer not null default 1 check (quantity > 0),
  reason       text default '',
  refunded     boolean not null default false,
  location     text default 'Main Terminal',
  date         timestamptz not null default now()
);
create index if not exists returns_user_date_idx on public.returns(user_id, date desc);

-- -----------------------------------------------------------------------------
-- notifications (personal, keyed by the signed-in user)
-- -----------------------------------------------------------------------------
create table if not exists public.notifications (
  id      uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title   text not null,
  message text not null default '',
  type    text not null default 'system' check (type in ('low_stock', 'sale', 'system', 'return')),
  read    boolean not null default false,
  date    timestamptz not null default now()
);
create index if not exists notifications_user_idx on public.notifications(user_id, date desc);

-- -----------------------------------------------------------------------------
-- Realtime: the app subscribes to products, sales and profiles changes.
-- -----------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
end $$;
alter publication supabase_realtime add table public.products;
alter publication supabase_realtime add table public.sales;
alter publication supabase_realtime add table public.profiles;
