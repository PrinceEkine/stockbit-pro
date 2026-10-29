-- StockBit Pro — purchase orders
--
-- Raise orders to suppliers, receive stock against them (partial receipts
-- allowed), reconcile. Receiving runs through
-- `receive_purchase_order_items()`, which validates, increments product
-- quantities, and flips the order to partial/received atomically.

create table if not exists public.purchase_orders (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  supplier_id uuid references public.suppliers(id) on delete set null,
  status      text not null default 'draft'
              check (status in ('draft', 'sent', 'partial', 'received', 'cancelled')),
  notes       text default '',
  created_at  timestamptz not null default now()
);
create index if not exists purchase_orders_user_idx on public.purchase_orders(user_id, created_at desc);

create table if not exists public.purchase_order_items (
  id                uuid primary key default gen_random_uuid(),
  order_id          uuid not null references public.purchase_orders(id) on delete cascade,
  product_id        uuid references public.products(id) on delete set null,
  product_name      text not null default '',
  quantity_ordered  integer not null default 0 check (quantity_ordered >= 0),
  quantity_received integer not null default 0 check (quantity_received >= 0),
  unit_cost         numeric not null default 0 check (unit_cost >= 0)
);
create index if not exists purchase_order_items_order_idx on public.purchase_order_items(order_id);

alter table public.purchase_orders enable row level security;
alter table public.purchase_order_items enable row level security;
revoke all on public.purchase_orders, public.purchase_order_items from anon;

drop policy if exists "purchase_orders_select_member" on public.purchase_orders;
create policy "purchase_orders_select_member" on public.purchase_orders
  for select to authenticated using (user_id = public.business_owner_id());
drop policy if exists "purchase_orders_insert_member" on public.purchase_orders;
create policy "purchase_orders_insert_member" on public.purchase_orders
  for insert to authenticated with check (user_id = public.business_owner_id());
drop policy if exists "purchase_orders_update_member" on public.purchase_orders;
create policy "purchase_orders_update_member" on public.purchase_orders
  for update to authenticated
  using (user_id = public.business_owner_id()) with check (user_id = public.business_owner_id());
drop policy if exists "purchase_orders_delete_owner" on public.purchase_orders;
create policy "purchase_orders_delete_owner" on public.purchase_orders
  for delete to authenticated using (user_id = auth.uid());

-- Order lines inherit tenancy from their parent order.
drop policy if exists "purchase_order_items_member" on public.purchase_order_items;
create policy "purchase_order_items_member" on public.purchase_order_items
  for all to authenticated
  using (exists (
    select 1 from public.purchase_orders o
    where o.id = order_id and o.user_id = public.business_owner_id()
  ))
  with check (exists (
    select 1 from public.purchase_orders o
    where o.id = order_id and o.user_id = public.business_owner_id()
  ));
drop policy if exists "purchase_order_items_delete_owner" on public.purchase_order_items;
create policy "purchase_order_items_delete_owner" on public.purchase_order_items
  for delete to authenticated
  using (exists (
    select 1 from public.purchase_orders o
    where o.id = order_id and o.user_id = auth.uid()
  ));

-- Receive stock against an order. p_items: [{id, quantity}] (line ids + newly
-- arrived quantities). Refuses over-receipts, closed orders, and drafts.
create or replace function public.receive_purchase_order_items(p_order_id uuid, p_items jsonb)
returns public.purchase_orders
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_owner uuid := public.business_owner_id();
  v_order public.purchase_orders%rowtype;
  v_item jsonb;
  v_line public.purchase_order_items%rowtype;
  v_qty int;
  v_total_ordered int;
  v_total_received int;
begin
  if v_owner is null then
    raise exception 'Not a member of any business.' using errcode = 'insufficient_privilege';
  end if;
  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'Nothing to receive.';
  end if;

  select * into v_order from public.purchase_orders
    where id = p_order_id and user_id = v_owner for update;
  if not found then
    raise exception 'Order not found.';
  end if;
  if v_order.status in ('received', 'cancelled') then
    raise exception 'This order is already closed.';
  end if;
  if v_order.status = 'draft' then
    raise exception 'Send this order before receiving stock.';
  end if;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_qty := (v_item->>'quantity')::int;
    if v_qty is null or v_qty <= 0 then
      raise exception 'Invalid quantity.';
    end if;

    select * into v_line from public.purchase_order_items
      where id = (v_item->>'id')::uuid and order_id = v_order.id for update;
    if not found then
      raise exception 'Order line not found.';
    end if;
    if v_line.quantity_received + v_qty > v_line.quantity_ordered then
      raise exception 'Cannot receive more than ordered for "%".', v_line.product_name;
    end if;

    update public.purchase_order_items
      set quantity_received = quantity_received + v_qty
      where id = v_line.id;

    if v_line.product_id is not null then
      update public.products
        set quantity = quantity + v_qty, last_updated = now()
        where id = v_line.product_id and user_id = v_owner;
    end if;
  end loop;

  select coalesce(sum(quantity_ordered), 0), coalesce(sum(quantity_received), 0)
    into v_total_ordered, v_total_received
    from public.purchase_order_items where order_id = v_order.id;

  update public.purchase_orders
    set status = case
      when v_total_ordered > 0 and v_total_received >= v_total_ordered then 'received'
      else 'partial'
    end
    where id = v_order.id
    returning * into v_order;

  return v_order;
end;
$$;

revoke all on function public.receive_purchase_order_items(uuid, jsonb) from public, anon;
grant execute on function public.receive_purchase_order_items(uuid, jsonb) to authenticated;
