# Features: Customer Records + CSV Import/Export + Low-Stock Alerts

Date: 2026-10-29
Status: Implemented, typechecked. Needs `db push` (new migration) + `npm run build` deploy.
Owner scope: customers YES, CSV YES, WhatsApp explicitly left out, plus one
verified gap of my choosing (low-stock alerts that never fired).

## 1. Customer records

| File | Change |
|------|--------|
| `supabase/migrations/20261029000002_customers_and_alerts.sql` (**new**) | `customers` table (name/phone/email/notes) + member/owner RLS. |
| `supabase/sql/schema.sql`, `supabase/sql/security.sql` | Canonical mirrors (table + `customers` in the RLS loop and anon revoke). |
| `types.ts` | `Customer` interface, `AppState.customers`, `View.Customers`. |
| `store.ts` | `customers` state, loading in `loadData`, `addCustomer`/`updateCustomer`/`deleteCustomer`, `importCustomers`, session cleanup. |
| `pages/Customers.tsx` (**new**) | Search, stats (total / repeat buyers / recorded revenue), cards with purchase history, working add/edit modal, CSV import/export. |
| `pages/Sales.tsx` | POS customer field autocompletes from records (name/phone match). New walk-in names are NOT auto-created (avoids typo spam). |
| `App.tsx`, `components/Sidebar.tsx` | Route + Tools-section nav (staff-hidden, like Suppliers). |

Purchase history matches `sales.customer_name` to records (case-insensitive).

## 2. CSV import/export

| File | Change |
|------|--------|
| `lib/csv.ts` (**new**) | RFC-4180 writer (proper quoting, Excel BOM, no leaked object URLs) + quote-aware parser + number/date cell parsers. No new dependency. |
| `components/CsvImportModal.tsx` (**new**) | Reusable: template download, header mapping, per-row validation, skip reporting, result summary. |
| `pages/Inventory.tsx` | Import/export products. Validates numbers (non-negative, whole quantities), dates, supplier-name matching; skips existing SKUs with reasons. |
| `pages/Customers.tsx` | Import/export customers; skips name+phone duplicates. |
| `pages/Reports.tsx` | Sales export routed through the central writer (old code corrupted fields containing commas/quotes). |
| `store.ts` | `importProducts`/`importCustomers` bulk inserts. |

Deliberate limits: sales are export-only (importing sales would rewrite
financial history); product import is insert-only (no overwrite-by-SKU).

## 3. Low-stock alerts that actually fire (verified gap)

The setting, email field, and notification panel existed, but nothing ever
created a `low_stock` notification. Now `record_sale()` calls the new
`notify_low_stock()` helper (security definer, so staff sales alert the owner
too) exactly when a sale crosses a product's threshold — crossing-only, so no
spam. The owner's low-stock setting gates it. After each sale the client
refreshes notifications so the bell lights up without a reload. Actual email
delivery remains future work (no mail sender exists yet).

Adjacent fix: supplier update/delete were no-op stubs in `App.tsx`; real
`updateSupplier`/`deleteSupplier` are now wired (the Suppliers edit button
itself is still dead UI — tracked, not silently fixed by redesign).

## Owner actions to go live

1. `npx supabase login` once, then `npm run deploy:supabase` (applies the
   customers/alerts migration; also still required for the earlier staff
   migration if not yet applied).
2. Deploy the frontend as usual (`npm run build` → Netlify/Vercel).
3. Retest: Customers page CRUD + import template; POS autocomplete; sell an
   item to its threshold and confirm the bell notification.

## Verification (this machine)

- `npm run lint` (`tsc --noEmit`): PASS, exit 0, 2026-10-29.
- `npm run build`: PASS, exit 0, 2026-10-29 (only the pre-existing
  chunk-size warning).
- Serve smoke (`vite preview` on fresh `dist/`): HTTP 200, 2026-10-29.
- Live DB behaviors (RLS, alert RPC): NOT run here (no database on this
  machine); statements mirror the repo's existing reviewed patterns.
