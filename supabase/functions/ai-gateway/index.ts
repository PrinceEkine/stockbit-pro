// Supabase Edge Function: ai-gateway
//
// The ONLY place that holds the AI provider secret. The browser never sees the
// Meta Model API key; it calls this function with its Supabase session and the
// function forwards the request to Meta Muse.
//
//   • Signed-in users: all capabilities (vision SKU scan, product extraction,
//     inventory insights, support chat).
//   • Anonymous visitors: ONLY the landing-page support chat, with a short
//     message cap and a per-IP rate limit, so the public bot cannot be used to
//     burn the API budget.
//
// The model is pinned server-side so clients cannot switch to a costlier one.
//
// Deploy:  supabase functions deploy ai-gateway --no-verify-jwt
// Secrets: supabase secrets set MODEL_API_KEY=MO...
//          (or Dashboard → Edge Functions → Secrets → New secret).
//          Project-level env vars do NOT reach Edge Functions — the secret
//          must be an Edge Function secret, then redeploy the function.
//          SUPABASE_URL / SUPABASE_ANON_KEY are injected automatically.
// Docs:    https://dev.meta.ai/docs/overview

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const META_BASE_URL = 'https://api.meta.ai/v1';
const META_MODEL = 'muse-spark-1.3';

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

/** Every error carries a stable machine-readable code so the client can react. */
const fail = (code: string, error: string, status: number, extra?: Record<string, unknown>) =>
  json({ error, code, ...extra }, status);

/**
 * The provider key is read from several names because the Supabase dashboard
 * labels the field differently across project setups. MODEL_API_KEY is
 * canonical (matches Meta's docs and `supabase secrets set`); the rest are
 * accepted so a differently-named secret still works.
 */
const readProviderKey = (): string =>
  Deno.env.get('MODEL_API_KEY')
  || Deno.env.get('META_MUSE_API_KEY')
  || Deno.env.get('MUSE_API_KEY')
  || Deno.env.get('META_API_KEY')
  || '';

// Best-effort in-memory limiter (per isolate). Good enough to blunt abuse;
// Supabase's own function rate limits sit in front of it.
const buckets = new Map<string, { count: number; reset: number }>();
const allow = (key: string, limit: number, windowMs: number) => {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.reset < now) {
    buckets.set(key, { count: 1, reset: now + windowMs });
    return true;
  }
  b.count += 1;
  return b.count <= limit;
};

type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };

interface MuseTextRequest {
  provider: 'muse';
  purpose: 'support' | 'insights';
  messages: ChatMessage[];
}
interface MuseVisionRequest {
  provider: 'muse';
  purpose: 'scan';
  /** Raw base64 bytes (as captured) or a full `data:` URL. */
  image: string;
  mimeType?: string;
  /** What to do with the image (identify a code vs extract details as JSON). */
  prompt: string;
}
type GatewayRequest = MuseTextRequest | MuseVisionRequest;

const MAX_ANON_CHARS = 4000;
const MAX_AUTH_CHARS = 60_000; // inventory snapshots can be sizeable
const MAX_IMAGE_CHARS = 8_000_000; // ~6 MB of base64

const totalChars = (v: unknown): number => JSON.stringify(v ?? '').length;

/**
 * Anonymous visitors share one system prompt written by us — only THEIR words
 * count against the message cap. Counting the whole payload (system prompt +
 * JSON overhead) made normal questions fail with MESSAGE_TOO_LONG.
 */
const userChars = (messages: unknown): number =>
  Array.isArray(messages)
    ? (messages as { role?: string; content?: unknown }[])
      .filter((m) => m?.role === 'user' && typeof m.content === 'string')
      .reduce((n, m) => n + (m.content as string).length, 0)
    : 0;

const NOT_CONFIGURED_HINT =
  'Add MODEL_API_KEY under Supabase Dashboard → Edge Functions → Secrets (NOT Project Settings → Environment Variables — those never reach Edge Functions), then redeploy: supabase functions deploy ai-gateway --no-verify-jwt. CLI alternative: supabase secrets set MODEL_API_KEY=... then redeploy.';

const VISION_MIME_ALLOWLIST = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

async function callMuseChat(messages: ChatMessage[], purpose: 'support' | 'insights', apiKey: string) {
  const res = await fetch(`${META_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: META_MODEL,
      messages,
      temperature: 0.7,
      max_completion_tokens: purpose === 'insights' ? 3000 : 800,
    }),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const detail = typeof data?.error?.message === 'string' ? data.error.message.slice(0, 200) : '';
    console.error('Muse chat error', res.status, detail || '(no message)');
    const err = new Error(detail ? `AI provider error (${res.status}): ${detail}` : `AI provider error (${res.status})`) as Error & { code?: string; status?: number };
    err.code = res.status === 401 || res.status === 403 ? 'PROVIDER_AUTH' : 'PROVIDER_ERROR';
    err.status = res.status;
    throw err;
  }
  const content = data?.choices?.[0]?.message?.content;
  const text = Array.isArray(content)
    ? content.map((p: { text?: string }) => (typeof p?.text === 'string' ? p.text : '')).join('')
    : (typeof content === 'string' ? content : '');
  return { text: text.trim(), sources: [] as never[] };
}

async function callMuseVision(req: MuseVisionRequest, apiKey: string) {
  const raw = (req.image || '').trim();
  if (!raw) throw new Error('No image.');
  if (raw.length > MAX_IMAGE_CHARS) throw new Error('Image too large.');

  // The Responses API takes a public URL, a base64 data URL, or a file_id.
  // The app sends camera bytes, so normalise raw base64 into a data URL.
  let imageUrl = raw;
  if (!/^data:/i.test(raw) && !/^https?:\/\//i.test(raw)) {
    const mime = (req.mimeType || 'image/jpeg').toLowerCase();
    if (!VISION_MIME_ALLOWLIST.includes(mime)) throw new Error('Unsupported image type.');
    if (!/^[a-z0-9+/=\s]+$/i.test(raw)) throw new Error('Invalid image data.');
    imageUrl = `data:${mime};base64,${raw.replace(/\s/g, '')}`;
  }

  const res = await fetch(`${META_BASE_URL}/responses`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: META_MODEL,
      input: [{
        role: 'user',
        content: [
          { type: 'input_text', text: req.prompt },
          { type: 'input_image', image_url: imageUrl },
        ],
      }],
    }),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const detail = typeof data?.error?.message === 'string' ? data.error.message.slice(0, 200) : '';
    console.error('Muse vision error', res.status, detail || '(no message)');
    const err = new Error(detail ? `AI provider error (${res.status}): ${detail}` : `AI provider error (${res.status})`) as Error & { code?: string; status?: number };
    err.code = res.status === 401 || res.status === 403 ? 'PROVIDER_AUTH' : 'PROVIDER_ERROR';
    err.status = res.status;
    throw err;
  }
  const text = (data?.output || [])
    .filter((item: { type?: string }) => item?.type === 'message')
    .flatMap((item: { content?: unknown[] }) => item?.content || [])
    .filter((block: { type?: string }) => block?.type === 'output_text')
    .map((block: { text?: string }) => block?.text || '')
    .join('')
    .trim();
  return { text, sources: [] as never[] };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return fail('METHOD_NOT_ALLOWED', 'Method not allowed.', 405);

  const museKey = readProviderKey();
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';

  // A lightweight health probe the client can call without spending AI budget.
  const probe = req.headers.get('x-ai-probe') === 'health';
  if (probe) {
    if (!museKey) {
      return fail('NOT_CONFIGURED', 'AI is not configured on the server.', 503, {
        hint: NOT_CONFIGURED_HINT,
      });
    }
    return json({ ok: true, authenticated: req.headers.get('Authorization')?.startsWith('Bearer ') ?? false });
  }

  if (!museKey) {
    return fail('NOT_CONFIGURED', 'AI is not configured on the server.', 503, {
      hint: NOT_CONFIGURED_HINT,
    });
  }

  // Resolve the caller. A valid Supabase JWT => authenticated; otherwise anonymous.
  let userId: string | null = null;
  const authHeader = req.headers.get('Authorization') || '';
  if (authHeader.startsWith('Bearer ') && supabaseUrl && anonKey) {
    const client = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data } = await client.auth.getUser();
    userId = data?.user?.id ?? null;
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const body = (await req.json().catch(() => null)) as GatewayRequest | null;
  if (!body || body.provider !== 'muse') {
    return fail('INVALID_REQUEST', 'Invalid request.', 400);
  }

  try {
    if (!userId) {
      // Anonymous: support chat only.
      if (body.purpose !== 'support') {
        return fail('UNAUTHORIZED', 'Sign in to use this feature.', 401);
      }
      if (!allow(`anon:${ip}`, 12, 60_000)) return fail('RATE_LIMITED', 'Too many requests. Please slow down.', 429);
      const messages = (body as MuseTextRequest).messages;
      if (userChars(messages) > MAX_ANON_CHARS) return fail('MESSAGE_TOO_LONG', 'Message too long. Please keep it under a few sentences.', 413);
    } else {
      if (!allow(`user:${userId}`, 60, 60_000)) return fail('RATE_LIMITED', 'Too many requests. Please slow down.', 429);
      if (totalChars(body) > MAX_AUTH_CHARS * 4) return fail('REQUEST_TOO_LARGE', 'Request too large.', 413);
    }

    if (body.purpose === 'scan') {
      const vision = body as MuseVisionRequest;
      if (typeof vision.prompt !== 'string' || !vision.prompt.trim()) {
        return fail('NO_PROMPT', 'No prompt.', 400);
      }
      return json(await callMuseVision(vision, museKey));
    }

    // Text chat (support bot + inventory insights).
    const messages = ((body as MuseTextRequest).messages || []).filter(
      (m) => m && typeof m.content === 'string' && ['system', 'user', 'assistant'].includes(m.role),
    );
    if (messages.length === 0) return fail('NO_MESSAGES', 'No messages.', 400);
    const purpose = (body as MuseTextRequest).purpose === 'insights' ? 'insights' : 'support';

    return json(await callMuseChat(messages, purpose, museKey));
  } catch (err) {
    console.error('ai-gateway error:', err);
    const code = (err as { code?: string })?.code;
    if (code === 'PROVIDER_AUTH') {
      return fail('PROVIDER_AUTH', 'The AI provider rejected the server key. Check MODEL_API_KEY and redeploy ai-gateway.', 502);
    }
    if (code === 'PROVIDER_ERROR') {
      return fail('PROVIDER_ERROR', (err as Error)?.message || 'The AI service is temporarily unavailable.', 502);
    }
    if (err instanceof Error && /^(No image|Image too large|Unsupported image|Invalid image)/.test(err.message)) {
      return fail('INVALID_IMAGE', err.message, 400);
    }
    return fail('GATEWAY_ERROR', 'The AI service is temporarily unavailable.', 502);
  }
});
