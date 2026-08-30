// Supabase Edge Function: admin-users
//
// Platform-admin operations that must bypass RLS (list every business, grant or
// revoke a subscription, link/unlink staff, promote/demote admins). The caller's
// JWT is verified and their profile MUST have role = 'admin'; everything else is
// rejected. Writes use the service-role key, which is the only way past the
// billing/role protection triggers.
//
// Deploy:  supabase functions deploy admin-users --no-verify-jwt
// (SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY are injected.)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

type Action =
  | { action: 'list' }
  | { action: 'set_plan'; userId: string; plan: 'beta' | 'mega' | 'mega_pro'; cycle: 'monthly' | 'annual' }
  | { action: 'revoke_plan'; userId: string }
  | { action: 'link_parent'; userId: string; parentId: string | null }
  | { action: 'set_role'; userId: string; role: 'admin' | 'user' };

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed.' }, 405);

  const url = Deno.env.get('SUPABASE_URL') || '';
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  if (!url || !anonKey || !serviceKey) return json({ error: 'Server not configured.' }, 500);

  // 1) Who is calling?
  const authHeader = req.headers.get('Authorization') || '';
  if (!authHeader.startsWith('Bearer ')) return json({ error: 'Sign in required.' }, 401);
  const caller = createClient(url, anonKey, { global: { headers: { Authorization: authHeader } } });
  const { data: { user }, error: userErr } = await caller.auth.getUser();
  if (userErr || !user) return json({ error: 'Invalid session.' }, 401);

  // 2) Are they a platform admin? (checked with the service role so RLS can't hide it)
  const admin = createClient(url, serviceKey);
  const { data: me } = await admin.from('profiles').select('id, role').eq('id', user.id).maybeSingle();
  if (!me || me.role !== 'admin') return json({ error: 'Administrator access required.' }, 403);

  const body = (await req.json().catch(() => null)) as Action | null;
  if (!body || typeof body.action !== 'string') return json({ error: 'Invalid request.' }, 400);

  try {
    switch (body.action) {
      case 'list': {
        const { data, error } = await admin
          .from('profiles')
          .select('id, email, name, company_name, role, parent_id, trial_start_date, is_subscribed, plan, subscription_expiry, is_verified, created_at')
          .order('created_at', { ascending: false });
        if (error) throw error;
        return json({ users: data });
      }

      case 'set_plan': {
        if (!body.userId || !['beta', 'mega', 'mega_pro'].includes(body.plan)) return json({ error: 'Invalid plan.' }, 400);
        const expiry = new Date();
        if (body.cycle === 'annual') expiry.setFullYear(expiry.getFullYear() + 1);
        else expiry.setMonth(expiry.getMonth() + 1);
        const { error } = await admin
          .from('profiles')
          .update({ is_subscribed: true, plan: body.plan, subscription_expiry: expiry.toISOString() })
          .eq('id', body.userId);
        if (error) throw error;
        await admin.from('admin_audit').insert({ admin_id: user.id, action: 'set_plan', target_id: body.userId, detail: { plan: body.plan, cycle: body.cycle } }).then(() => {}, () => {});
        return json({ ok: true, subscriptionExpiry: expiry.toISOString() });
      }

      case 'revoke_plan': {
        if (!body.userId) return json({ error: 'Missing user.' }, 400);
        const { error } = await admin
          .from('profiles')
          .update({ is_subscribed: false, plan: null, subscription_expiry: null })
          .eq('id', body.userId);
        if (error) throw error;
        await admin.from('admin_audit').insert({ admin_id: user.id, action: 'revoke_plan', target_id: body.userId, detail: {} }).then(() => {}, () => {});
        return json({ ok: true });
      }

      case 'link_parent': {
        if (!body.userId) return json({ error: 'Missing user.' }, 400);
        if (body.userId === body.parentId) return json({ error: 'A business cannot be its own parent.' }, 400);
        if (body.parentId) {
          const { data: parent } = await admin.from('profiles').select('id, role').eq('id', body.parentId).maybeSingle();
          if (!parent || parent.role === 'staff') return json({ error: 'Parent must be a business owner.' }, 400);
        }
        const { error } = await admin
          .from('profiles')
          .update(body.parentId ? { parent_id: body.parentId, role: 'staff', company_name: '' } : { parent_id: null, role: 'user' })
          .eq('id', body.userId);
        if (error) throw error;
        await admin.from('admin_audit').insert({ admin_id: user.id, action: 'link_parent', target_id: body.userId, detail: { parentId: body.parentId } }).then(() => {}, () => {});
        return json({ ok: true });
      }

      case 'set_role': {
        if (!body.userId || !['admin', 'user'].includes(body.role)) return json({ error: 'Invalid role.' }, 400);
        if (body.userId === user.id && body.role !== 'admin') return json({ error: 'You cannot remove your own admin access.' }, 400);
        const { error } = await admin.from('profiles').update({ role: body.role, parent_id: null }).eq('id', body.userId);
        if (error) throw error;
        await admin.from('admin_audit').insert({ admin_id: user.id, action: 'set_role', target_id: body.userId, detail: { role: body.role } }).then(() => {}, () => {});
        return json({ ok: true });
      }

      default:
        return json({ error: 'Unknown action.' }, 400);
    }
  } catch (err) {
    console.error('admin-users error:', err);
    return json({ error: 'Operation failed.' }, 500);
  }
});
