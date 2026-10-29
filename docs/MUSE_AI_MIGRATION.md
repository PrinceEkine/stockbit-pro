# AI Migration: Gemini/Qwen → Meta Muse

Date: 2026-10-29
Status: Implemented, typechecked, builds. Needs `MODEL_API_KEY` + gateway redeploy (owner action, below).

## Why

Owner decision: one Meta Muse model powers the chatbot, the AI analyses, and
product scanning, replacing Gemini (vision + unused insights path) and Qwen
(chat + insights).

## Verified API facts (from https://dev.meta.ai/docs)

- Base URL `https://api.meta.ai/v1`, auth `Authorization: Bearer $MODEL_API_KEY`
  (keys start with `MO...`).
- Model pinned server-side: `muse-spark-1.3` (latest Spark; text + vision).
- Text (chatbot, insights) → `POST /v1/chat/completions` (OpenAI-compatible).
- Vision (barcode scan, product-details extraction) → `POST /v1/responses`
  with `input_image` blocks (base64 data URL inline).

## What changed

| File | Change |
|------|--------|
| `supabase/functions/ai-gateway/index.ts` | Rewritten: single `provider: 'muse'` contract. Text purposes (`support`, `insights`) go to Chat Completions; `scan` goes to Responses with image validation (type allowlist, size cap). Model pinned server-side; clients can no longer pick a model. Auth/anon gating and rate limits unchanged. |
| `services/museService.ts` | **New.** `chatWithMuse`, `getInventoryInsightsMuse`, `identifyProductFromImage`, `extractProductDetailsFromImage`, `sanitizeAiText` (moved verbatim). Same function signatures as the old services, so call sites barely changed. |
| `services/geminiService.ts` | **Deleted.** |
| `services/qwenService.ts` | **Deleted.** Its `getInventoryInsights` (Gemini) had zero call sites. |
| `components/ScannerModal.tsx` | Import switched to `museService`. No logic change. |
| `pages/AIInsights.tsx` | Import + call + "Powered by" copy → Muse. |
| `pages/LandingPage.tsx` | StockBot import + call + system-prompt copy → Muse. |
| `pages/LaunchCenter.tsx` | Health-check ping + copy → Muse contract. |
| `pages/PrivacyPolicy.tsx`, `components/OnboardingModal.tsx` | Provider name copy → Muse. |
| `.env.example`, `SECURITY.md`, `scripts/deploy-supabase.ps1` | `GEMINI_API_KEY`/`QWEN_API_KEY` → `MODEL_API_KEY` (Supabase secret, never `VITE_*`). |

## New gateway contract (frontend → Edge Function)

```ts
// Text: StockBot chat + AI Insights
{ provider: 'muse', purpose: 'support' | 'insights',
  messages: [{ role: 'system' | 'user' | 'assistant', content: string }] }

// Vision: barcode read + product-details extraction (signed-in only)
{ provider: 'muse', purpose: 'scan', image: string /* raw base64 or data: URL */,
  mimeType?: string, prompt: string }
```

Response shape unchanged: `{ text, sources }`, so all existing UI keeps working.

## Cost guards (server-side)

- Fixed model (`muse-spark-1.3`); no client override (the old contract let the
  browser name any Gemini model).
- Output caps: chat 800 tokens, insights 3000.
- Rate limits unchanged: anon 12/min (support chat only), signed-in 60/min.

## Owner actions to go live

1. Get a key at https://dev.meta.ai and set it (Supabase Dashboard →
   Project Settings → Edge Functions → Secrets, or CLI):
   `npx supabase secrets set MODEL_API_KEY=MO...`
2. Deploy the gateway: `npx supabase functions deploy ai-gateway --no-verify-jwt`
   (or `npm run deploy:supabase` after `npx supabase login`).
3. Verify in-app: Launch Center (admin) → API Health → run AI Diagnostics.
4. Remove any old `GEMINI_API_KEY` / `QWEN_API_KEY` from Supabase secrets and
   from Netlify/Vercel env vars. Never store `MODEL_API_KEY` as `VITE_*`.

## Verification (this machine)

- `npm run lint` (`tsc --noEmit`): PASS, exit 0, 2026-10-29.
- `npm run build`: PASS, exit 0, 2026-10-29 (only pre-existing
  Tailwind-ambiguity and chunk-size warnings).
- Live Muse call: NOT run (no key on this machine; needs owner secret + deploy).
