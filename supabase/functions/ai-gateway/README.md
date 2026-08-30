# ai-gateway

Server-side proxy for every AI call the app makes. Keeps the Gemini / Qwen API
keys out of the browser bundle.

```bash
supabase functions deploy ai-gateway
supabase secrets set GEMINI_API_KEY=your_gemini_key QWEN_API_KEY=your_dashscope_key
```

- Signed-in users: full access (rate-limited to 60 req/min per user).
- Anonymous visitors: landing-page support chat only (12 req/min per IP, 2 KB per request).

Remove `GEMINI_API_KEY`, `API_KEY`, `ALIBABA_API_KEY` and `QWEN_API_KEY` from your
hosting provider's build environment — they are no longer read by the client.
