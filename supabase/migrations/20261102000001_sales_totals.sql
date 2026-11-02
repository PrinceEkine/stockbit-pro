-- =============================================================================
-- StockBit Pro — sales totals backfill (2026-11-02)
--
-- Some live databases predate the total columns on `sales`, so every sale
-- fails (the `record_sale` function and the client fallback both write
-- total_price / total_cost / tax_amount). This backfills every column a sale
-- insert touches. Idempotent: safe to re-run.
-- (supabase/sql/schema.sql already declares all of these; this migration only
-- repairs databases created from an older schema.)
-- =============================================================================

alter table public.sales add column if not exists items          jsonb      not null default '[]'::jsonb;
alter table public.sales add column if not exists total_price    numeric    not null default 0;
alter table public.sales add column if not exists total_cost     numeric    not null default 0;
alter table public.sales add column if not exists tax_amount     numeric    not null default 0;
alter table public.sales add column if not exists customer_name  text       not null default 'Walk-in';
alter table public.sales add column if not exists location       text       not null default 'Main Terminal';
alter table public.sales add column if not exists payment_method text       not null default 'cash';
alter table public.sales add column if not exists is_checked     boolean    not null default true;
alter table public.sales add column if not exists is_archived    boolean    not null default false;
alter table public.sales add column if not exists date           timestamptz not null default now();
