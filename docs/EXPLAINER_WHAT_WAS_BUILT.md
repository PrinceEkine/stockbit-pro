# StockBit Pro — Plain-English Explainer (Mon Oct 26 → Sun Nov 1)

> Coverage note: nothing was committed Mon Oct 26 – Wed Oct 28. All of last
> week's work landed Thu Oct 29 – Sun Nov 1 (5 commits), which is what this
> note describes.

How to use this: each section gives you a one-line explanation you can say
out loud, then the technical detail behind it in case someone asks "how?".

---

## 1. What StockBit Pro is (the 30-second version)

"StockBit Pro is an inventory and point-of-sale app for Nigerian retailers.
It tracks your stock, records every sale, manages staff, and backs everything
up to the cloud — starting with a free 60-day trial."

## 2. The core technology, in plain English

| Say this | The technical name | What it actually does |
|---|---|---|
| The app runs in the browser and on phones | React + TypeScript + Vite | React builds the screens; TypeScript is JavaScript with type safety (catches bugs before users do); Vite bundles it fast for production. |
| The design system | Tailwind CSS | Utility styling — every button, card and page layout. |
| The database and logins | Supabase (Postgres + Auth) | Postgres stores products, sales, customers, staff. Supabase Auth handles email/Google sign-in, password reset, sessions. |
| The security rules inside the database | Row Level Security (RLS, written in SQL) | Rules like "a shop owner only sees their own shop's data; staff see only their boss's shop". Enforced by the database itself, not just the app. |
| The AI brain | Meta Muse (`muse-spark-1.3`), via an Edge Function called `ai-gateway` | One AI model powers the chatbot, the AI Insights page, and photo/barcode scanning. The browser never holds the API key — it asks our server, our server asks Meta. |
| The server code for AI | Supabase Edge Function (Deno + TypeScript) | A small server program (`supabase/functions/ai-gateway`) that checks who you are, enforces limits, then forwards to Meta. |
| Payments | Paystack | Subscription payments for Entry ₦5,000 / Business ₦7,999 / Enterprise ₦12,999. |
| Installable on phones | PWA (Progressive Web App) | "Add to Home Screen" — opens like a normal app, works with install prompts. |
| Automated checks | Vitest + TypeScript compiler | Unit tests (19 passing) plus a type check that must pass before anything ships. |

How the pieces talk: Browser (React) → Supabase (data + login) for shop data;
Browser → ai-gateway → Meta Muse for anything AI. The secret key
(`MODEL_API_KEY`) lives only on the server, never in the app.

---

## 3. What was built, day by day

### Oct 29 (morning) — One AI, customers, CSV, and real low-stock alerts

1. **All AI moved to Meta Muse.** Before, the app used two different AI
   providers (Gemini and Qwen) depending on the feature. Now one Meta model
   does the chatbot, the inventory insights, and reading barcodes/product
   photos. Say: "We consolidated to a single AI provider, which is simpler,
   cheaper to control, and one key to manage."
   - Technical: deleted `geminiService.ts`/`qwenService.ts`, added
     `services/museService.ts`; gateway rewritten to a single
     `{ provider: 'muse', purpose }` contract; model pinned server-side so the
     browser can't request a different (expensive) model; output caps
     (chat 800 tokens, insights 3000) and rate limits (visitors 12/min,
     signed-in 60/min).
2. **Customer records.** A real Customers page: add/edit customers, see total
   customers, repeat buyers, revenue per customer, and each customer's purchase
   history. The sales screen autocompletes the customer name as the cashier
   types. Say: "Every sale can now be tied to a customer, and you can see who
   your repeat buyers are."
   - Technical: new `customers` table + RLS migration; history matched on
     `sales.customer_name` (case-insensitive); walk-in names are NOT
     auto-created, to avoid typo spam.
3. **CSV import/export.** Bulk-add products or customers from a spreadsheet,
   download a template, map columns, get per-row error reports; export lists
   back out. Also fixed a bug where sales exports broke on commas/quotes.
   Say: "A shop with 500 products can onboard in minutes from Excel instead of
   typing everything."
   - Technical: dependency-free RFC-4180 parser/writer (`lib/csv.ts`) +
     reusable `CsvImportModal`; sales are export-only (never import financial
     history); product import is insert-only (never overwrites by SKU).
4. **Low-stock alerts that actually fire.** The bell icon and setting existed,
   but nothing ever created an alert. Now, when a sale pushes a product to or
   below its threshold, the owner gets a notification. Say: "You now get told
   the moment something needs restocking — only once per crossing, so no
   spam." (Email delivery is still future work; in-app bell works now.)
   - Technical: `notify_low_stock()` runs inside `record_sale()`, security
     definer so staff sales alert the owner; client refreshes notifications
     after each sale.
5. **Staff + auth hardening.** Invite-code preview checks team limits, staff
   linking edge cases fixed, supplier edit/delete wired to real functions,
   branded email templates, signup abuse hardening.
   - Technical: `preview_staff_invite`, `accept_staff_invite`, RLS + trigger
     guards, branded Supabase email templates.

### Oct 29 (midday) — Purchase orders (restocking workflow)

**What it is:** the full "order stock from suppliers" loop:
Draft → Send → Receive (partial deliveries allowed) → Received, or Cancel.
Say: "You can now raise an order to a supplier, record goods as they arrive —
even in batches — and your stock updates automatically."

- Technical: new `purchase_orders` + `purchase_order_items` tables with RLS;
  `receive_purchase_order_items()` database function guarantees: only
  sent/partial orders receive, no line receives more than ordered, stock and
  receipts update in one transaction (all-or-nothing, never half-applied),
  status flips to `received` exactly when everything arrives.
- Deliberate limits (good to know, not bugs): receiving doesn't rewrite
  product cost prices (landed-cost decision kept for later); page is
  owner-only like Suppliers; "Send" is a status change, not an email to the
  supplier.

### Oct 29 (evening) — Offline chatbot brain + tests

**What it is:** StockBot (the landing-page chat) now answers common questions
— trial, prices, scanning, staff invites, languages — even when the AI service
is down or not configured, and always gives the support phone numbers.
Say: "The chatbot never goes silent; if the AI is unreachable it falls back to
built-in answers instead of an error."

- Technical: `services/supportBot.ts` — pure FAQ-matching functions with unit
  tests; `aiClient.ts` gained typed error codes so the UI can tell "not
  configured" from "rate limited" from "no internet".

### Nov 1 — Chat fix, premium landing page, trial reminders

1. **Chat fix (StockBot was stuck on offline answers).** Two real causes
   found: (a) the server counted the whole message package — including the
   hidden system prompt — against the visitor size limit, so normal questions
   were rejected and silently fell back to offline mode; now only the
   visitor's own words count (4,000 chars). (b) The API key was likely saved
   in the wrong Supabase dashboard section (project env vars never reach Edge
   Functions) and/or the function wasn't redeployed after adding it. The chat
   now also probes the AI on open, so the Online/Local badge tells the truth,
   and shows a specific message per failure type. Say: "We found why chat
   looked online but answered from the offline script, fixed the counting bug,
   and made the status badge honest."
2. **Landing page redesign.** Editorial hero with serif headline, proof pill,
   live Lagos clock, animated sales bars, cycling terminal feed, 3D-tilting
   app mockup, count-up stats band, numbered features, testimonials, pricing
   with monthly/annual toggle (annual = 2 months free), FAQ accordion,
   dark call-to-action panel. Say: "The public homepage was rebuilt to look
   like a premium product — live mockup, social proof, clear pricing."
   - Note: the three testimonials are clearly-marked placeholder quotes —
     replace with real customers before heavy marketing.
3. **Trial-nurture loop.** The 60-day trial is unchanged, but owners now see an
   escalating banner (gentle at 15 days left, warning at 7, urgent at 2) plus
   a dashboard setup checklist (add first product → record first sale → invite
   first teammate) with a progress bar that disappears when done. Say: "New
   shops get guided to their first sale, and nobody is surprised when the
   trial ends."
   - Technical: `lib/trialNurture.ts` + `TrialNurture.tsx`, 8 unit tests.

### Nov 1 (later) — Deployment automation

**What it is:** pushing code now auto-deploys the AI server function; the
deploy script and Supabase config were corrected. Say: "AI fixes now ship
automatically with the code — no manual server step to forget."
- Technical: GitHub Actions workflow `deploy-functions.yml`, fixed
  `deploy-supabase.ps1`, `supabase/config.toml`.

---

## 4. Glossary for Q&A (say the left side, know the right side)

- **"The app"** = React frontend (`pages/`, `components/`), one codebase for
  web + installed phone app.
- **"The database"** = Supabase Postgres + migrations in `supabase/migrations/`.
- **"Who can see what"** = RLS policies: owners see their shop, staff see
  their boss's shop, admins manage accounts.
- **"The AI"** = Meta Muse via `ai-gateway`; key on server only; three jobs:
  chat (`support`), insights (`insights`), photo/barcode reading (`scan`).
- **"Trial"** = 60 days from signup (`trial_start_date`); staff inherit the
  owner's trial — they never get a fresh one.
- **"Plans"** = Entry ₦5,000 / Business ₦7,999 / Enterprise ₦12,999 monthly;
  annual saves ~2 months. Staff seats: 3 / 8 / unlimited.
- **"To go live after these changes"** = apply new DB migrations, set
  `MODEL_API_KEY` under Edge Functions → Secrets (not project env vars),
  redeploy `ai-gateway`, deploy the frontend.

## 5. Honest status notes (don't oversell)

- AI features need the owner's `MODEL_API_KEY` + gateway deploy; without them,
  chat answers from the offline script and insights/scanning fail gracefully.
- Testimonials on the landing page are placeholders.
- Low-stock email delivery doesn't exist yet (in-app bell only).
- Supplier "send order by email" doesn't exist (status change only).
- Live database behaviors were typechecked and reviewed but not all
  re-tested against a live DB from the dev machine.
