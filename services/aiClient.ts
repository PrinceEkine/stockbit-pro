import { supabase } from '../supabase';

export interface AiResponse {
  text: string;
  sources: { title: string; uri: string }[];
}

export type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };

/** Machine-readable codes returned by the ai-gateway Edge Function. */
export type AiGatewayCode =
  | 'NOT_CONFIGURED'
  | 'PROVIDER_AUTH'
  | 'PROVIDER_ERROR'
  | 'GATEWAY_ERROR'
  | 'RATE_LIMITED'
  | 'UNAUTHORIZED'
  | 'MESSAGE_TOO_LONG'
  | 'REQUEST_TOO_LARGE'
  | 'INVALID_REQUEST'
  | 'INVALID_IMAGE'
  | 'NO_MESSAGES'
  | 'NO_PROMPT'
  | 'METHOD_NOT_ALLOWED'
  | 'FUNCTION_NOT_DEPLOYED'
  | 'NETWORK_ERROR';

export class AiGatewayError extends Error {
  code: AiGatewayCode;
  status?: number;
  hint?: string;

  constructor(message: string, code: AiGatewayCode = 'GATEWAY_ERROR', status?: number, hint?: string) {
    super(message);
    this.name = 'AiGatewayError';
    this.code = code;
    this.status = status;
    this.hint = hint;
  }
}

/**
 * Calls the `ai-gateway` Edge Function. The user's Supabase session (if any) is
 * attached automatically, so the server can decide what the caller may do.
 * Provider API keys never reach the browser.
 *
 * Failures throw AiGatewayError with the server's code when available, so the
 * UI can distinguish "not configured" from "rate limited" from "offline".
 */
export const invokeAi = async (body: Record<string, unknown>): Promise<AiResponse> => {
  let data: any;
  let error: any;
  try {
    const res = await supabase.functions.invoke('ai-gateway', { body });
    data = res.data;
    error = res.error;
  } catch (networkErr: any) {
    throw new AiGatewayError(
      'Could not reach the AI service. Check your connection and try again.',
      'NETWORK_ERROR',
    );
  }

  if (error) {
    // Surface the server's friendly message + code when there is one.
    let message = error.message || 'AI request failed';
    let code: AiGatewayCode = 'GATEWAY_ERROR';
    let hint: string | undefined;
    let status: number | undefined = (error as any)?.status;
    try {
      const ctx = (error as any).context;
      if (ctx && typeof ctx.json === 'function') {
        const parsed = await ctx.json();
        if (parsed?.error) message = parsed.error;
        if (parsed?.code) code = parsed.code;
        if (parsed?.hint) hint = parsed.hint;
      } else if (typeof ctx === 'object' && ctx !== null) {
        if ((ctx as any).error) message = (ctx as any).error;
        if ((ctx as any).code) code = (ctx as any).code;
      }
    } catch { /* ignore parse failures */ }

    if (/not found|404|Failed to fetch|Load failed/i.test(String((error as any)?.message || '')) && !status) {
      status = 404;
      code = 'FUNCTION_NOT_DEPLOYED';
      message = 'The AI service is not deployed yet.';
      hint = 'Deploy it with: supabase functions deploy ai-gateway --no-verify-jwt';
    }
    throw new AiGatewayError(message, code, status, hint);
  }
  if (data?.error) {
    throw new AiGatewayError(
      data.error,
      (data.code as AiGatewayCode) || 'GATEWAY_ERROR',
      undefined,
      data.hint,
    );
  }
  return { text: data?.text || '', sources: Array.isArray(data?.sources) ? data.sources : [] };
};
