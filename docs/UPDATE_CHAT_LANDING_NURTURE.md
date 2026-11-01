# Update: Chat Fix, Landing Redesign, Trial Nurture

Date: 2026-11-01
Status: Implemented, typechecked, tested (19/19), production build passes.
Needs: frontend deploy + `supabase functions deploy ai-gateway --no-verify-jwt`
(the gateway fix only takes effect after redeploy; see Deploy notes).

## 1. Chat fix (StockBot was stuck on "local help")

Root causes found:

- **Server bug:** the anonymous message cap counted the whole payload —
  system prompt + JSON overhead — against a 2,000-char limit, so normal
  visitor questions failed with `MESSAGE_TOO_LONG` and silently fell back
  to the offline FAQ. The cap now counts only the visitor's own words
  (4,000 chars).
- **Wrong secret location (most likely on your project):** keys placed under
  Project Settings → Environment Variables never reach Edge Functions, and
  secrets only inject at deploy time — so "secret added but chat still
  broken" also means "not redeployed". The gateway README was stale
  (it named Gemini/Qwen keys the code never reads); rewritten.
- **Stale chat prompt:** the landing bot quoted wrong plan names/prices
  (Beta/Mega). Now matches billing: Entry ₦5,000, Business ₦7,999,
  Enterprise ₦12,999.

| File | Change |
|------|--------|
| `supabase/functions/ai-gateway/index.ts` | `userChars()` cap for anonymous chat (4,000), shared `NOT_CONFIGURED_HINT` pointing at Edge Functions → Secrets + redeploy. |
| `supabase/functions/ai-gateway/README.md` | Rewritten: setup, dashboard path, troubleshooting table per error code, no-budget `curl` health probe. |
| `services/aiClient.ts` | New `probeAiGateway()` — free health check (no AI spend). |
| `pages/LandingPage.tsx` (chat) | Shorter accurate system prompt, per-code visitor notices (`chatNoticeFor`), probe-on-open so the badge reads Online/Local/··· honestly. |

## 2. Landing + UI redesign ($20k feel)

| File | Change |
|------|--------|
| `pages/LandingPage.tsx` | Editorial hero (Fraunces serif, star-rating proof pill, ink primary CTA), CSS app-window mockup replacing the stock photo, mouse-tracked 3D tilt (`preserve-3d`, receipt card floats at `translateZ`), live Lagos clock, animated week bars, cycling terminal feed, count-up proof band, numbered feature cards, new Testimonials / Pricing (monthly-annual toggle, 2-months-free annual, driven by `PLAN_PRICING`) / FAQ accordion sections, dark-panel CTA, Pricing nav + footer links, dynamic footer year. Reduced-motion users get a static tilt and instant counters. |
| `constants/plans.ts` | New `PLAN_PRICING` (5000/7999/12999 monthly, 50000/80000/128000 annual) + `formatNaira`. Keep in sync with Settings billing. |
| `constants/translations.ts` (en only) | Sentence-case headlines + sharper hero sub; other languages untouched (non-English hero keeps the legacy sans style). |
| `index.html` | Fraunces display font added. |
| `tailwind.config.js` | `font-editorial` family. |
| `src/index.css` | Thin quiet scrollbars for the app shell. |
| `components/Sidebar.tsx` | Softer active item (tint + inset indicator bar instead of solid block). |

Deliberate placeholder: the three testimonials are sample quotes marked
`/* Placeholder quotes — replace with real customer testimonials */`.
Swap in real names/shops/cities before scaling traffic.

## 3. Trial-nurture loop (60-day trial kept)

| File | Change |
|------|--------|
| `lib/trialNurture.ts` (**new**) | `getTrialStage` ladder (15→notice, 7→warning, 2→urgent days left; silent for subscribed/expired), `trialStageCopy`, `getSetupChecklist` (first product / first sale / first teammate), per-user + per-stage localStorage dismissal flags. |
| `components/TrialNurture.tsx` (**new**) | `TrialBanner` (owners only, stage-toned amber→rose, CTA to Settings, dismiss re-arms on next escalation) and `SetupChecklist` (Dashboard card with progress bar, deep-links to Inventory/Sales/Settings, vanishes when complete). |
| `App.tsx` | Renders `TrialBanner` above content on every app view. |
| `pages/Dashboard.tsx` | Renders `SetupChecklist` above the header. |
| `lib/__tests__/trialNurture.test.ts` (**new**) | 8 tests: stage boundaries incl. subscribed/expired silence, copy wording ("ends tomorrow"), checklist progression, dismissal scoping. Written failing first. |

## Deploy notes

1. `supabase functions deploy ai-gateway --no-verify-jwt` (required for §1).
2. If chat still shows Local: Dashboard → Edge Functions → Secrets must
   contain `MODEL_API_KEY`, then redeploy again. Verify free with the probe:
   open StockBot (badge reads Online) or the README's curl.
3. Deploy the frontend as usual (`npm run build` output in `dist/`).

## Verification this session

- `npx tsc --noEmit` — clean.
- `npx vitest run` — 19/19 pass (11 existing + 8 new).
- `npm run build` — succeeds (pre-existing >500 kB chunk warning only).
