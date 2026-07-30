// Supabase Edge Function: verify-payment
//
// Verifies a Paystack transaction server-side using the SECRET key (never exposed
// to the browser), confirms the amount matches the requested plan, and only then
// activates the subscription using the service-role key. This prevents a client
// from marking itself "subscribed" without a real, correctly-priced payment.
//
// The account activated is the one whose email matches the *verified* Paystack
// transaction (tx.customer.email) — not a value supplied by the client — so it is
// secure and works for both Supabase-auth and Google/Firebase-auth users.
//
// Deploy:  supabase functions deploy verify-payment
// Secrets: supabase secrets set PAYSTACK_SECRET_KEY=sk_live_xxx
//          (SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are injected automatically)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

type Plan = 'beta' | 'mega' | 'mega_pro';
type Cycle = 'monthly' | 'annual';

// Server-side source of truth for pricing (in Naira). Must match the client cards.
const PRICES: Record<Plan, Record<Cycle, number>> = {
  beta: { monthly: 5000, annual: 50000 },
  mega: { monthly: 7999, annual: 80000 },
  mega_pro: { monthly: 12999, annual: 128000 },
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return json({ success: false, error: 'Method not allowed.' }, 405);
  }

  try {
    const paystackSecret = Deno.env.get('PAYSTACK_SECRET_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!paystackSecret || !supabaseUrl || !serviceRoleKey) {
      return json({ success: false, error: 'Payment verification is not configured on the server.' }, 500);
    }

    // Parse and validate the request body.
    const body = await req.json().catch(() => null);
    const reference: string | undefined = body?.reference;
    const plan: Plan | undefined = body?.plan;
    const cycle: Cycle | undefined = body?.cycle;

    if (!reference || typeof reference !== 'string') {
      return json({ success: false, error: 'Missing payment reference.' }, 400);
    }
    if (!plan || !(plan in PRICES)) {
      return json({ success: false, error: 'Unknown subscription plan.' }, 400);
    }
    if (cycle !== 'monthly' && cycle !== 'annual') {
      return json({ success: false, error: 'Invalid billing cycle.' }, 400);
    }

    // Verify the transaction directly with Paystack.
    const verifyRes = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      { headers: { Authorization: `Bearer ${paystackSecret}` } },
    );
    const verifyData = await verifyRes.json();

    if (!verifyRes.ok || !verifyData?.status || verifyData?.data?.status !== 'success') {
      return json({ success: false, error: 'Payment could not be verified as successful.' }, 402);
    }

    const tx = verifyData.data;
    const expectedKobo = PRICES[plan][cycle] * 100;

    // The amount actually paid must cover the requested plan, in the right currency.
    if (typeof tx.amount !== 'number' || tx.amount < expectedKobo) {
      return json({ success: false, error: 'Amount paid does not match the selected plan.' }, 402);
    }
    if (tx.currency && tx.currency !== 'NGN') {
      return json({ success: false, error: 'Unexpected payment currency.' }, 402);
    }

    // Identify the account from the VERIFIED transaction's email (trusted, from Paystack).
    const payerEmail: string | undefined = tx.customer?.email;
    if (!payerEmail) {
      return json({ success: false, error: 'Payment record is missing a customer email.' }, 402);
    }

    // Service-role client for the privileged lookup + update.
    const admin = createClient(supabaseUrl, serviceRoleKey);

    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('id, role, parent_id')
      .ilike('email', payerEmail)
      .maybeSingle();

    if (profileError) {
      return json({ success: false, error: 'Could not look up the paying account.' }, 500);
    }
    if (!profile) {
      return json({ success: false, error: 'No account matches the paying email address.' }, 404);
    }

    // Subscriptions belong to the business owner; staff activate their parent account.
    const targetUserId = profile.role === 'staff' ? profile.parent_id : profile.id;
    if (!targetUserId) {
      return json({ success: false, error: 'No billable account is linked to this user.' }, 400);
    }

    const expiry = new Date();
    if (cycle === 'monthly') expiry.setMonth(expiry.getMonth() + 1);
    else expiry.setFullYear(expiry.getFullYear() + 1);

    const { error: updateError } = await admin
      .from('profiles')
      .update({
        is_subscribed: true,
        plan,
        subscription_expiry: expiry.toISOString(),
      })
      .eq('id', targetUserId);

    if (updateError) {
      return json({ success: false, error: 'Could not activate the subscription. Please contact support.' }, 500);
    }

    return json({
      success: true,
      subscription: { plan, isSubscribed: true, subscriptionExpiry: expiry.toISOString() },
    });
  } catch (err) {
    console.error('verify-payment error:', err);
    return json({ success: false, error: 'Unexpected error while verifying payment.' }, 500);
  }
});
