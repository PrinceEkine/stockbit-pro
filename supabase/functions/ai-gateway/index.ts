// Supabase Edge Function: ai-gateway
//
// The ONLY place that holds AI provider secrets. The browser never sees the
// Gemini or Qwen API keys any more; it calls this function with its Supabase
// session and the function forwards the request.
//
//   • Signed-in users: all capabilities (vision SKU scan, product extraction,
//     inventory insights, support chat).
//   • Anonymous visitors: ONLY the landing-page support chat, with a short
//     message cap and a per-IP rate limit, so the public bot cannot be used to
//     burn the API budget.
//
// Deploy:  supabase functions deploy ai-gateway
// Secrets: supabase secrets set GEMINI_API_KEY=... QWEN_API_KEY=...
//          (SUPABASE_URL / SUPABASE_ANON_KEY are injected automatically)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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

interface GeminiRequest {
  provider: 'gemini';
  model?: string;
  contents: unknown;
  generationConfig?: Record<string, unknown>;
  systemInstruction?: string;
  tools?: unknown[];
}
interface QwenRequest {
  provider: 'qwen';
  purpose?: 'support' | 'insights';
  messages: ChatMessage[];
}
type GatewayRequest = GeminiRequest | QwenRequest;

const MAX_ANON_CHARS = 2000;
const MAX_AUTH_CHARS = 60_000; // inventory snapshots can be sizeable

const totalChars = (v: unknown): number => JSON.stringify(v ?? '').length;

async function callGemini(req: GeminiRequest, apiKey: string) {
  const model = (req.model || 'gemini-2.5-flash').replace(/[^a-z0-9.\-]/gi, '');
  const body: Record<string, unknown> = { contents: req.contents };
  if (req.generationConfig) body.generationConfig = req.generationConfig;
  if (req.systemInstruction) body.systemInstruction = { parts: [{ text: req.systemInstruction }] };
  if (req.tools) body.tools = req.tools;

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify(body),
    },
  );
  const data = await res.json();
  if (!res.ok) {
    console.error('Gemini error', res.status, data?.error?.message);
    throw new Error('AI provider error');
  }
  const candidate = data?.candidates?.[0];
  const text = (candidate?.content?.parts || [])
    .map((p: { text?: string }) => p.text || '')
    .join('')
    .trim();
  const sources = (candidate?.groundingMetadata?.groundingChunks || [])
    .filter((c: { web?: { title?: string; uri?: string } }) => c.web?.uri)
    .map((c: { web: { title?: string; uri: string } }) => ({ title: c.web.title || c.web.uri, uri: c.web.uri }));
  return { text, sources };
}

async function callQwen(messages: ChatMessage[], apiKey: string) {
  const res = await fetch('https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'qwen-plus', messages, temperature: 0.7 }),
  });
  const data = await res.json();
  if (!res.ok) {
    console.error('Qwen error', res.status);
    throw new Error('AI provider error');
  }
  return { text: (data?.choices?.[0]?.message?.content || '').trim(), sources: [] as never[] };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed.' }, 405);

  const geminiKey = Deno.env.get('GEMINI_API_KEY') || '';
  const qwenKey = Deno.env.get('QWEN_API_KEY') || Deno.env.get('ALIBABA_API_KEY') || '';
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';

  if (!geminiKey && !qwenKey) return json({ error: 'AI is not configured on the server.' }, 503);

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
  if (!body || (body.provider !== 'gemini' && body.provider !== 'qwen')) {
    return json({ error: 'Invalid request.' }, 400);
  }

  try {
    if (!userId) {
      // Anonymous: support chat only.
      if (body.provider !== 'qwen' || body.purpose !== 'support') {
        return json({ error: 'Sign in to use this feature.' }, 401);
      }
      if (!allow(`anon:${ip}`, 12, 60_000)) return json({ error: 'Too many requests. Please slow down.' }, 429);
      if (totalChars(body.messages) > MAX_ANON_CHARS) return json({ error: 'Message too long.' }, 413);
    } else {
      if (!allow(`user:${userId}`, 60, 60_000)) return json({ error: 'Too many requests. Please slow down.' }, 429);
      if (totalChars(body) > MAX_AUTH_CHARS * 4) return json({ error: 'Request too large.' }, 413);
    }

    if (body.provider === 'gemini') {
      if (!geminiKey) return json({ error: 'Gemini is not configured.' }, 503);
      return json(await callGemini(body, geminiKey));
    }

    // Qwen with automatic Gemini fallback.
    const messages = (body.messages || []).filter(
      (m) => m && typeof m.content === 'string' && ['system', 'user', 'assistant'].includes(m.role),
    );
    if (messages.length === 0) return json({ error: 'No messages.' }, 400);

    if (qwenKey) {
      try {
        return json(await callQwen(messages, qwenKey));
      } catch (err) {
        if (!geminiKey) throw err;
      }
    }
    const system = messages.filter((m) => m.role === 'system').map((m) => m.content).join('\n');
    const contents = messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }));
    return json(await callGemini({ provider: 'gemini', contents, systemInstruction: system || undefined }, geminiKey));
  } catch (err) {
    console.error('ai-gateway error:', err);
    return json({ error: 'The AI service is temporarily unavailable.' }, 502);
  }
});
