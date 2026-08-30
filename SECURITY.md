# StockBit Pro — Security model & deployment checklist

This document describes how authentication, tenancy and secrets are protected,
and the one-time steps required to activate each control in production.

## 1. Identity: one session model

| Login method       | What happens                                                                 |
|--------------------|-------------------------------------------------------------------------------|
| Email + password   | `supabase.auth.signInWithPassword` → Supabase session (PKCE).                |
| Google             | `supabase.auth.signInWithOAuth({ provider: 'google' })` (PKCE redirect) → Supabase session. |

Every path ends with a Supabase JWT, so **Postgres Row Level Security is the
single enforcement point**. The previous design trusted an email stored in
`localStorage` for Google users — anyone could set that key and impersonate an
account. That path has been removed and the key is scrubbed on startup.

Other client-side controls (defence in depth, not a substitute for the server):

- Password policy: ≥ 10 chars, upper + lower case, number, not common, not
  containing the user's name/email (`lib/security.ts`). Applied on sign-up,
  password reset, and Settings → Security.
- Login throttling: 5 failures → exponential cooldown (30 s → 15 min).
- Idle lock: 15 min without interaction (or tab hidden that long) blurs the app
  and requires the password (or Google re-auth).
- Changing the password signs out **every other device** (`scope: 'others'`);
  Settings → Security also offers "Sign out everywhere" (`scope: 'global'`).
- Neutral messages on sign-in / reset / duplicate sign-up so accounts cannot be
  enumerated.

## 2. Database

**Fastest path:** `npx supabase login` once, then `npm run deploy:supabase` — it applies
the migrations below and deploys both Edge Functions. Manual alternative: run these
in the Supabase SQL editor, in order (all idempotent):

1. `supabase/sql/schema.sql` — tables, indexes, the `handle_new_user` auth trigger, realtime publication.
2. `supabase/sql/security.sql` — RLS, protective triggers, `record_sale` RPC.
3. `supabase/sql/staff_invites.sql` — staff invitations.
4. `supabase/sql/admin.sql` — admin audit table, trigger fix for SQL-editor edits, and promotes the platform owner.

Platform admins manage every account (grant/revoke plans, link staff, add admins) from the
"Admin · Accounts" page, which calls the `admin-users` Edge Function; it verifies the caller's
role server-side and writes with the service role, so nothing privileged happens in the browser.

`security.sql` installs:

- RLS on `profiles`, `products`, `sales`, `returns`, `suppliers`, `settings`,
  `notifications` — members (owner + staff) see only their business; only the
  owner can delete; `anon` has no access at all.
- `protect_profile_columns` trigger — billing, role, `parent_id`, trial start
  and email can only be changed by the service role (Edge Functions). A user
  can no longer extend their own trial or promote themselves to admin.
- `guard_profile_insert` trigger — a client can only create its own profile,
  never as admin, never pre-subscribed, and never as staff (staff linkage is
  granted only by `accept_staff_invite`, see §5).
- `record_sale(...)` RPC — atomic checkout: locks product rows, refuses
  overselling, recomputes totals from **database** prices (clients can't send
  fabricated prices). The app falls back to the legacy client flow only if the
  function isn't installed yet.
- "Remove staff" now *detaches* the profile (`parent_id → null`) instead of
  deleting it, so a removed member can't silently re-join.

## 3. Secrets: nothing sensitive in the browser

| Secret                | Where it lives                                | Used by                          |
|-----------------------|-----------------------------------------------|----------------------------------|
| `PAYSTACK_SECRET_KEY` | `supabase secrets set`                        | `verify-payment` Edge Function   |
| `GEMINI_API_KEY`      | `supabase secrets set`                        | `ai-gateway` Edge Function       |
| `QWEN_API_KEY`        | `supabase secrets set` (optional)             | `ai-gateway` Edge Function       |
| Supabase anon key     | `VITE_SUPABASE_ANON_KEY` (public by design)   | browser                          |
| Paystack public key   | `VITE_PAYSTACK_PUBLIC_KEY` (public by design) | browser                          |

```bash
supabase functions deploy verify-payment
supabase functions deploy ai-gateway
supabase functions deploy admin-users
supabase secrets set PAYSTACK_SECRET_KEY=sk_live_... GEMINI_API_KEY=... QWEN_API_KEY=...
```

Then **remove** `GEMINI_API_KEY`, `API_KEY`, `ALIBABA_API_KEY`, `QWEN_API_KEY`
from Netlify/Vercel build environment variables — the client no longer reads
them and `vite.config.ts` no longer inlines them.

## 4. Supabase Auth dashboard settings

- Providers → Email: minimum password length **10**, enable **Leaked password
  protection** (HaveIBeenPwned).
- Providers → Google: enable it with a Google Cloud OAuth client ID/secret and
  register `https://<project-ref>.supabase.co/auth/v1/callback` as the redirect
  URI in Google Cloud Console.
- URL configuration: add your production origin(s) to the redirect allow-list.
- Rate limits: defaults are fine; tighten "sign-in attempts" if you see abuse.

## 5. Staff invitations — `supabase/sql/staff_invites.sql` (run after security.sql)

Owners mint short codes (`SB-XXXX-XXXX`) from Settings → Workforce; codes
expire in 7 days, can be locked to one email, and can be revoked. The joiner
signs up with the code (or opens `/#join=CODE`), and on first login the client
calls `accept_staff_invite(code)`, which validates status, expiry, email match
and the plan's seat limit **server-side** before linking the profile. Clients
can no longer create a `staff` row or set `parent_id` directly.

## 6. HTTP security headers

Declared in `public/_headers` (Netlify), `netlify.toml`, and `vercel.json`:
HSTS (preload), strict CSP (no inline scripts; only Paystack/Supabase
origins), `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`,
`Permissions-Policy`, COOP. Tailwind is now compiled at build time instead of
loaded from a CDN, which is what makes the strict `script-src` possible.

If you add a new third-party script or API, add its origin to the CSP in all
three files.

## 7. Service worker

`public/sw.js` is network-first for HTML (deploys reach users immediately),
cache-first for hashed `/assets/*`, and never caches API calls or non-GET
requests.
