# Feature: Purchase Orders

Date: 2026-10-29
Status: Implemented, typechecked. Needs `db push` (new migration) + frontend deploy.
Scope: owner-picked from Phase 4 ("Shopify for inventory") candidates.

## Flow

Draft → Send → Receive (partial receipts allowed) → Received, or Cancel.
Only drafts and cancelled orders can be deleted, so received history is safe.

## What changed

| File | Change |
|------|--------|
| `supabase/migrations/20261029000003_purchase_orders.sql` (**new**) | `purchase_orders` + `purchase_order_items` tables, member/owner RLS (lines inherit tenancy from the parent order), `receive_purchase_order_items()` RPC. |
| `supabase/sql/schema.sql`, `supabase/sql/security.sql` | Canonical mirrors (tables, RLS loop + item policies, RPC). |
| `types.ts` | `PurchaseOrder(Status|Item)`, `AppState.purchaseOrders`, `View.PurchaseOrders`. |
| `store.ts` | Order state, loading with line join, `createPurchaseOrder`, `updatePurchaseOrderStatus`, `receivePurchaseOrder` (RPC + product refresh), `deletePurchaseOrder`, `refreshOrders`, session cleanup. |
| `pages/PurchaseOrders.tsx` (**new**) | Order list with status filter/search/stats, expandable line tables with receipt progress, create modal (supplier + dynamic lines, unit cost prefilled from product), receive modal (per-line arriving quantities). |
| `App.tsx`, `components/Sidebar.tsx` | Route + Tools-section nav (owner-only, like Suppliers). |

## Server guarantees (in the RPC)

- Only `sent`/`partial` orders receive; drafts must be sent first, closed orders reject.
- No line can receive more than ordered; empty receipts reject.
- Product quantities increment in the same transaction as the receipt.
- Status flips to `received` exactly when all lines are fully received.

Deliberate limits: receiving does not rewrite product `cost_price` (kept as a
future landed-cost decision); staff cannot open the page in v1 (owner-only,
matching Suppliers); no supplier email integration (send = status change).

## Owner actions to go live

1. Apply `supabase/migrations/20261029000003_purchase_orders.sql` (SQL Editor
   paste or `db push`).
2. Deploy the frontend as usual.
3. Retest: create a draft → send → receive partially → receive fully; confirm
   product quantities move and the order reads `received`.

## Verification (this machine)

- `npm run lint` (`tsc --noEmit`): PASS, exit 0, 2026-10-29.
- `npm run build`: PASS, exit 0, 2026-10-29 (only the pre-existing
  chunk-size warning).
- Live DB behaviors (RLS, receive RPC): NOT run here (no database on this
  machine); the RPC mirrors the reviewed `record_sale`/`notify_low_stock` patterns.
