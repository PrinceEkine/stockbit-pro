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
5. `supabase/sql/signup_hardening.sql` — makes profile creation non-fatal for Auth signup
   (a trigger exception used to surface as "Database error saving new user"), keeps
   `profiles.email` in sync on email change, and adds realtime tables idempotently.

To diagnose a signup problem on the live project, run the read-only queries in
`supabase/sql/diagnostics.sql` in the SQL editor; the file also lists the Logs
Explorer queries that show the real error behind a signup 500.

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
| `MODEL_API_KEY`       | `supabase secrets set`                        | `ai-gateway` Edge Function       |
| Meta key format       | starts with `MO...` (https://dev.meta.ai)       | —                                |
| Supabase anon key     | `VITE_SUPABASE_ANON_KEY` (public by design)   | browser                          |
| Paystack public key   | `VITE_PAYSTACK_PUBLIC_KEY` (public by design) | browser                          |

```bash
supabase functions deploy verify-payment
supabase functions deploy ai-gateway
supabase functions deploy admin-users
supabase secrets set PAYSTACK_SECRET_KEY=sk_live_... MODEL_API_KEY=MO...
```

Then **remove** `MODEL_API_KEY`, `GEMINI_API_KEY`, `API_KEY`, `ALIBABA_API_KEY`, `QWEN_API_KEY`
from Netlify/Vercel build environment variables — the client no longer reads
them and `vite.config.ts` no longer inlines them.

## 4. Supabase Auth dashboard settings

- Providers → Email: **Confirm email ON**, minimum password length **10**, enable
  **Leaked password protection** (HaveIBeenPwned). Leave "Secure email change" on.
- Providers → Google: enable it with a Google Cloud OAuth client ID/secret and
  register `https://<project-ref>.supabase.co/auth/v1/callback` as the redirect
  URI in Google Cloud Console.
- URL configuration: Site URL = production origin; Redirect URLs must include
  `https://<production-origin>/**` (and `http://localhost:3000/**` for dev). The
  app passes `<origin>/` as `emailRedirectTo`; if it is not allow-listed the
  email link silently falls back to the Site URL.
- Email Templates: paste `supabase/templates/*.html` (see that folder's README —
  the confirm-signup template uses a code + token-hash link so verification
  works on any device, not only the browser that signed up).
- **SMTP: configure a custom sender.** Supabase's built-in sender is limited to
  a handful of emails per hour and only delivers to the project's own team
  members, so real customers never receive the confirmation email. This is the
  single most common reason "sign-up fails". Resend/Postmark/SES need a verified
  domain; without one, use Gmail SMTP (app password) or Brevo's free tier for
  now. Details in `supabase/templates/README.md`.
- Rate limits: defaults are fine; tighten "sign-in attempts" if you see abuse.

### Email verification flow (how sign-up completes)

1. `signUp()` creates the auth user; the `on_auth_user_created` trigger creates
   the profile (non-fatal — the client recreates it on first login if missing).
2. The user either types the 6-digit code (`verifyOtp` with `type: 'email'`) or
   opens the `?token_hash=` link, which the app exchanges on load. Neither path
   depends on the PKCE verifier, so they work from any device.
3. Failed links (`#error=...&error_code=otp_expired`) are parsed on load and
   shown on the sign-in screen with a "resend" path instead of being ignored.
4. Signing in with an unverified account routes to the code screen rather than
   counting as a failed password attempt.
5. Password reset works the same way: the reset email carries a 6-digit code
   (`verifyOtp` with `type: 'recovery'`) and a `?token_hash=...&type=recovery`
   link. Both produce a recovery session, after which the "Set a new password"
   dialog runs `updateUser({ password })` and signs out every other device.

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
