# StockBit Pro — Mobile + Web Rebuild Audit

Date: 2026-10-27
Status: Audit complete. No code changed in this pass — this file is the record.

## Decisions (confirmed by owner)

- Mobile: PWA upgrade (offline mode, push, store packaging) — not React Native, not native.
- Web: refactor the current React + Vite + Supabase stack — not Next.js, not a rewrite.
- Scope: phased rebuild, working app at each step.

## What the app is today

- Inventory management + POS for Nigerian businesses (multi-branch, multi-staff).
- Stack: React 19 + Vite 5 + Tailwind 3 + Supabase (Postgres, Auth, Realtime,
  Edge Functions) + Recharts + Motion + lucide-react + Paystack + Meta Muse AI
  via the `ai-gateway` Edge Function.
- Features: landing page, email/Google auth with OTP, idle lock screen, dashboard,
  inventory (barcode labels, AI camera scanner), POS sales (multi-cart, receipts),
  returns, suppliers, stocktake, reports, AI insights, settings, user management,
  launch center, staff invites, subscriptions (Paystack + `verify-payment` fn),
  platform admin (`admin-users` fn), 4-language i18n, dark mode, PWA shell
  (manifest + service worker + install prompt), mobile bottom navigation.
- Deploy: Netlify (`netlify.toml` + `public/_headers` with CSP/HSTS), Supabase
  deploy via `scripts/deploy-supabase.ps1`.

## What's solid (keep)

- Auth hardening: neutral errors, throttling, password policy, PKCE + token-hash
  links, server-side staff-invite validation.
- Money safety: `record_sale` RPC recomputes totals server-side; `verify-payment`
  checks Paystack with the secret key; pricing mirrored server-side.
- Secrets: AI keys live only in the Edge Function, never the browser.
- PWA basics: install prompt, standalone meta, offline shell fallback, no-cache
  headers on `sw.js`/`index.html`.

## Required updates (phased plan)

### Phase 1 — Foundation (do first; unblocks everything else)
1. Add React Router (replace `useState` view switching + hash hacks) — fixes the
   mobile back button, deep links, shareable staff-invite URLs.
2. Split the ~857-line `store.ts` god-hook into feature slices
   (auth / products / sales / staff / settings); stop prop-drilling whole state.
3. Move to a `src/` feature-folder layout (root-level `App.tsx`, `store.ts`,
   `types.ts` do not scale).
4. Add baseline tests (Vitest for `lib/`, trial/entitlement logic, sale math;
   Playwright smoke: login → record sale → reconcile) + CI workflow. There are
   currently zero tests and no CI.
5. Add README, `.env.example`, and changelog discipline.
6. Remove hardcoded Supabase URL/anon-key fallbacks in `supabase.ts`; fail loud
   without env vars.
7. Paginate `loadData` (today it fetches ALL products/sales) and extend realtime
   to returns/suppliers/settings.

### Phase 2 — True mobile PWA
8. Offline-first data: IndexedDB cache + outbox queue + Background Sync so the
   POS keeps selling without network (critical for flaky networks); SW today
   caches the shell only.
9. Real PNG icons (192/512 + maskable) and local screenshots — SVG data-URIs
   and a remote Unsplash screenshot break installability/store listings.
10. Push notifications via Web Push (a `notifications` table exists but nothing
    pushes); add manifest `shortcuts` and `share_target`.
11. Client-side barcode decoding (BarcodeDetector/ZXing) with AI vision as
    fallback — today every scan costs a Gemini call and fails offline.
12. Mobile UX pass: touch targets, landscape/tablet POS, printer story beyond
    `window.print()` (Bluetooth receipts), safe-area audit.
13. Package with PWABuilder/Bubblewrap for Play Store (and re-check iOS gaps).

### Phase 3 — Hardening & polish
14. Remove the legacy non-RPC sale path in `recordSale` once the RPC is confirmed
    deployed everywhere (client-computed totals must not ship).
15. Confirm `security.sql`/RLS applied in production; re-check the in-memory edge
    rate limiter under real traffic.
16. Dependency upgrades: Vite 5 → current, Tailwind 3 → 4 (or pin deliberately),
    plus `npm audit` pass.
17. Type cleanup: kill `any` in `mapProfile`/`INITIAL_*`/edge-call error casts.
18. Centralized error reporting (Sentry) + basic analytics; rename `lint`
    script (it runs `tsc --noEmit`, not a linter) and add a real linter.
19. i18n: keep the constants file short-term; move to lazy-loaded i18next if
    catalog grows. Prerender the landing page if SEO starts to matter.

### Phase 4 — Platform direction: "Shopify for inventory" (owner vision, 2026-10-29)

Candidates, not commitments — each needs its own scope pass before building:

20. ~~Purchase orders (raise, receive, reconcile against suppliers).~~ DONE 2026-10-29 (docs/FEATURE_PURCHASE_ORDERS.md).
21. First-class locations/warehouses with stock transfers between them
    (today `location` is a free-text string).
22. Granular staff roles/permissions beyond owner/staff.
23. Audit log (who changed stock, prices, and settings, when).
24. Barcode label printing + shelf labels.
25. Public API + webhooks for integrations (accounting, logistics).
26. Demand forecasting beyond the current insights summary.

## Change log

- 2026-10-27: Audit recorded. Decisions: PWA upgrade / refactor current stack /
  phased rebuild. No source files modified.
- 2026-10-29: AI provider migrated Gemini/Qwen → Meta Muse (see
  docs/MUSE_AI_MIGRATION.md). Staff robustness fixes (see docs/STAFF_FIX.md).
  Router migration (Phase 1.1) paused by owner; react-router-dom + vitest
  installed but not yet wired.
- 2026-10-29: Customer records + CSV import/export + low-stock alerts shipped
  (see docs/FEATURES_CUSTOMERS_CSV.md). Owner set platform vision
  ("Shopify for inventory"); recorded as Phase 4 candidates. WhatsApp
  features explicitly deferred.
- 2026-10-29: Purchase orders shipped (Phase 4 item 20 — see
  docs/FEATURE_PURCHASE_ORDERS.md).
