# verify-payment (Supabase Edge Function)

Server-side Paystack verification. The browser can no longer mark an account as
subscribed on its own — it sends only the payment `reference`, and this function
verifies it against Paystack with the **secret key** before activating the plan.

## How it works

1. Client opens Paystack checkout (public key) and, on success, receives a `reference`.
2. Client calls this function with `{ reference, plan, cycle }`.
3. Function calls `GET https://api.paystack.co/transaction/verify/:reference` using
   `PAYSTACK_SECRET_KEY` and checks that:
   - the transaction `status` is `success`,
   - the amount paid is **at least** the server-side price for the requested plan/cycle,
   - the currency is NGN.
4. It looks up the profile by the **verified** transaction email (`tx.customer.email`)
   and activates the subscription with the service-role key (staff activate their
   parent/owner account).

Because the account is derived from the verified Paystack email — not from client
input — this is safe for every sign-in method, and a
replayed reference can only ever re-activate the account that actually paid.

## Deploy

```bash
# One-time: set the Paystack secret key (never commit this)
supabase secrets set PAYSTACK_SECRET_KEY=sk_live_xxxxxxxx

# Deploy the function
supabase functions deploy verify-payment
```

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are injected automatically by the
Supabase runtime — do not set them manually.

## Recommended: lock down the profiles table

Add a Row Level Security policy so clients cannot self-update billing columns
(`is_subscribed`, `plan`, `subscription_expiry`). Only the service role (used by
this function) should be able to write them. This closes the loop so the Edge
Function is the single trusted path to a paid subscription.
