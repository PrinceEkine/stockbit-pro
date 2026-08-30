import { supabase } from '../supabase';

export interface AiResponse {
  text: string;
  sources: { title: string; uri: string }[];
}

export type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };

/**
 * Calls the `ai-gateway` Edge Function. The user's Supabase session (if any) is
 * attached automatically, so the server can decide what the caller may do.
 * Provider API keys never reach the browser.
 */
export const invokeAi = async (body: Record<string, unknown>): Promise<AiResponse> => {
  const { data, error } = await supabase.functions.invoke('ai-gateway', { body });
  if (error) {
    // Surface the server's friendly message when there is one.
    let message = error.message || 'AI request failed';
    try {
      const ctx = (error as any).context;
      if (ctx && typeof ctx.json === 'function') {
        const parsed = await ctx.json();
        if (parsed?.error) message = parsed.error;
      }
    } catch { /* ignore */ }
    throw new Error(message);
  }
  if (data?.error) throw new Error(data.error);
  return { text: data?.text || '', sources: Array.isArray(data?.sources) ? data.sources : [] };
};
