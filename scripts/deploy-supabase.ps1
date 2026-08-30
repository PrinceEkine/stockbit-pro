# One-shot Supabase deployment for StockBit Pro (Windows PowerShell).
#
#   1) npx supabase login            (once — opens the browser)
#   2) npm run deploy:supabase
#
# Applies the SQL migrations (schema, RLS/security, staff invites) and deploys
# both Edge Functions to project knrpqdehivlprvzjkcgx. Secrets are set only if
# the matching environment variables are present in this shell.

$ErrorActionPreference = "Stop"
$ref = "knrpqdehivlprvzjkcgx"

Write-Host "==> Linking project $ref"
npx supabase link --project-ref $ref
if ($LASTEXITCODE -ne 0) { throw "link failed (run 'npx supabase login' first)" }

Write-Host "==> Applying SQL migrations (schema, security/RLS, staff invites)"
npx supabase db push --include-all
if ($LASTEXITCODE -ne 0) { throw "db push failed" }

Write-Host "==> Deploying Edge Functions"
npx supabase functions deploy ai-gateway --no-verify-jwt
if ($LASTEXITCODE -ne 0) { throw "ai-gateway deploy failed" }
npx supabase functions deploy verify-payment --no-verify-jwt
if ($LASTEXITCODE -ne 0) { throw "verify-payment deploy failed" }
npx supabase functions deploy admin-users --no-verify-jwt
if ($LASTEXITCODE -ne 0) { throw "admin-users deploy failed" }

$secrets = @()
if ($env:GEMINI_API_KEY)      { $secrets += "GEMINI_API_KEY=$env:GEMINI_API_KEY" }
if ($env:QWEN_API_KEY)        { $secrets += "QWEN_API_KEY=$env:QWEN_API_KEY" }
if ($env:PAYSTACK_SECRET_KEY) { $secrets += "PAYSTACK_SECRET_KEY=$env:PAYSTACK_SECRET_KEY" }
if ($secrets.Count -gt 0) {
  Write-Host "==> Setting function secrets: $($secrets -replace '=.*','=***')"
  npx supabase secrets set @secrets
} else {
  Write-Host "==> No secrets in this shell. Set them once with:"
  Write-Host '    npx supabase secrets set GEMINI_API_KEY=... QWEN_API_KEY=... PAYSTACK_SECRET_KEY=sk_live_...'
}

Write-Host ""
Write-Host "Done. Remaining dashboard-only steps: Auth -> Providers -> Email (min length 10, leaked-password protection),"
Write-Host "Auth -> URL Configuration (Site URL + redirect allow-list), Auth -> Email Templates (supabase/templates/*)."
