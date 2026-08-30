#!/usr/bin/env bash
# One-shot Supabase deployment for StockBit Pro (macOS/Linux/Git Bash).
#   1) npx supabase login   (once)
#   2) bash scripts/deploy-supabase.sh
set -euo pipefail
REF="knrpqdehivlprvzjkcgx"

echo "==> Linking project $REF"
npx supabase link --project-ref "$REF"

echo "==> Applying SQL migrations (schema, security/RLS, staff invites)"
npx supabase db push --include-all

echo "==> Deploying Edge Functions"
npx supabase functions deploy ai-gateway --no-verify-jwt
npx supabase functions deploy verify-payment --no-verify-jwt

SECRETS=()
[ -n "${GEMINI_API_KEY:-}" ]      && SECRETS+=("GEMINI_API_KEY=$GEMINI_API_KEY")
[ -n "${QWEN_API_KEY:-}" ]        && SECRETS+=("QWEN_API_KEY=$QWEN_API_KEY")
[ -n "${PAYSTACK_SECRET_KEY:-}" ] && SECRETS+=("PAYSTACK_SECRET_KEY=$PAYSTACK_SECRET_KEY")
if [ ${#SECRETS[@]} -gt 0 ]; then
  echo "==> Setting function secrets"
  npx supabase secrets set "${SECRETS[@]}"
else
  echo "==> No secrets in this shell. Set them once with:"
  echo "    npx supabase secrets set GEMINI_API_KEY=... QWEN_API_KEY=... PAYSTACK_SECRET_KEY=sk_live_..."
fi
echo "Done."
