-- StockBit Pro — customer records + low-stock alerts that actually fire
--
-- 1) New `customers` table (one row per shop customer) with the same
--    member/owner RLS shape as the other business tables.
-- 2) `notify_low_stock()` helper (security definer) + a threshold-crossing
--    check inside `record_sale()`: the sale that pushes a product to or below
--    its min_threshold inserts a `low_stock` notification for the business
--    owner — but only when the owner's low-stock setting is on. Crossing-only
--    (not every sale below threshold) so it cannot spam.

-- -----------------------------------------------------------------------------
-- customers
-- -----------------------------------------------------------------------------
create table if not exists public.customers (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  name       text not null,
  phone      text default '',
  email      text default '',
  notes      text default '',
  created_at timestamptz not null default now()
);
create index if not exists customers_user_idx on public.customers(user_id);
create index if not exists customers_name_idx on public.customers(user_id, name);

alter table public.customers enable row level security;
revoke all on public.customers from anon;

drop policy if exists "customers_select_member" on public.customers;
create policy "customers_select_member" on public.customers
  for select to authenticated using (user_id = public.business_owner_id());
drop policy if exists "customers_insert_member" on public.customers;
create policy "customers_insert_member" on public.customers
  for insert to authenticated with check (user_id = public.business_owner_id());
drop policy if exists "customers_update_member" on public.customers;
create policy "customers_update_member" on public.customers
  for update to authenticated
  using (user_id = public.business_owner_id()) with check (user_id = public.business_owner_id());
drop policy if exists "customers_delete_owner" on public.customers;
create policy "customers_delete_owner" on public.customers
  for delete to authenticated using (user_id = auth.uid());

-- -----------------------------------------------------------------------------
-- low-stock alerts
-- -----------------------------------------------------------------------------
create or replace function public.notify_low_stock(p_product_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_product public.products%rowtype;
  v_alerts_on boolean;
begin
  select * into v_product from public.products where id = p_product_id;
  if not found then return; end if;
  -- The owner's setting gates the alert; missing settings row means default ON.
  select s.low_stock_email_alerts into v_alerts_on
    from public.settings s where s.user_id = v_product.user_id;
  if coalesce(v_alerts_on, true) is false then return; end if;
  insert into public.notifications (user_id, title, message, type)
  values (v_product.user_id,
          'Low stock: ' || v_product.name,
          v_product.name || ' is down to ' || v_product.quantity
            || ' units (threshold ' || coalesce(v_product.min_threshold, 0) || ').',
          'low_stock');
end;
$$;

revoke all on function public.notify_low_stock(uuid) from public, anon;
grant execute on function public.notify_low_stock(uuid) to authenticated;

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

    -- Fire a low-stock alert the moment this sale crosses the threshold
    -- (v_product still holds the pre-update quantity). Crossing-only, so a
    -- product sitting below threshold does not alert on every sale.
    if v_product.quantity > coalesce(v_product.min_threshold, 0)
       and (v_product.quantity - v_qty) <= coalesce(v_product.min_threshold, 0) then
      perform public.notify_low_stock(v_product.id);
    end if;

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
