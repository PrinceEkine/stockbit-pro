# ai-gateway

Server-side proxy for every AI call the app makes. Keeps the Meta Muse API
key out of the browser bundle — the browser calls this function with its
Supabase session and the function forwards to Meta.

- Signed-in users: full access — support chat, inventory insights, vision
  SKU scan and product extraction (60 req/min per user).
- Anonymous visitors: landing-page support chat only (12 req/min per IP,
  4,000 chars of their own message per request).

Model is pinned server-side (`muse-spark-1.3`); clients cannot change it.

## Setup

```bash
# 1. Point the CLI at your project (once)
supabase link --project-ref <your-project-ref>

# 2. Store the provider key as an Edge Function secret
supabase secrets set MODEL_API_KEY=MO...

# 3. Deploy (secrets are injected at deploy time, so always redeploy
#    after setting or changing a secret)
supabase functions deploy ai-gateway --no-verify-jwt
```

Get a key at https://dev.meta.ai.

## Dashboard alternative (no CLI)

1. Open Supabase Dashboard → **Edge Functions** → **Secrets**.
2. Add secret `MODEL_API_KEY` with your Meta key as the value.
3. Redeploy the `ai-gateway` function (CLI deploy above, or Dashboard →
   Edge Functions → ai-gateway → Redeploy).

> Do NOT put the key under Project Settings → Environment Variables or the
> Vault — those never reach Edge Functions. This is the #1 reason the chat
> widget answers "from local help" after a key was "already added".

Accepted secret names (first match wins): `MODEL_API_KEY` (canonical),
`META_MUSE_API_KEY`, `MUSE_API_KEY`, `META_API_KEY`.

## Troubleshooting

| Chat shows… | Meaning | Fix |
|---|---|---|
| Answers + "Live AI is being set up" | `NOT_CONFIGURED` — no key visible to the function | Secret in wrong place, wrong name, or not redeployed — see Setup |
| Answers + "Live AI rejected the server key" | `PROVIDER_AUTH` — Meta refused the key | Key is wrong/expired/revoked; set a fresh one and redeploy |
| Answers + "AI service is not deployed yet" | `FUNCTION_NOT_DEPLOYED` | Deploy step was never run on this project |
| "Message too long" | `MESSAGE_TOO_LONG` | Visitor message over 4,000 chars |
| "Too many messages" | `RATE_LIMITED` | 12 req/min/IP (anon) or 60 req/min/user |

Check the function's server logs: `supabase functions logs ai-gateway`
(or Dashboard → Edge Functions → ai-gateway → Logs). Provider errors log
the Meta status code and message there.

Verify without spending AI budget:

```bash
curl -X POST "$SUPABASE_URL/functions/v1/ai-gateway" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "x-ai-probe: health" \
  -H "Content-Type: application/json" -d '{}'
```

`{"ok":true,...}` means the key is visible; `NOT_CONFIGURED` means it is not.
