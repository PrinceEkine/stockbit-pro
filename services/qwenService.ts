import { Product, Sale } from "../types";
import { invokeAi, ChatMessage } from "./aiClient";

export interface InsightResult {
  text: string;
  sources: { title: string; uri: string }[];
}

/**
 * Converts raw markdown from the AI models into clean, readable plain text.
 * Removes asterisk emphasis (**bold**, *italic*), heading hashes and stray
 * backticks so the customer-care chat and analytics never show raw "*" markers.
 */
export const sanitizeAiText = (raw: string): string => {
  if (!raw) return raw;
  return raw
    .split('\n')
    .map((line) => {
      let l = line;
      l = l.replace(/^(\s*)[*\-+]\s+/, '$1• ');
      l = l.replace(/^\s*#{1,6}\s*/, '');
      l = l.replace(/\*\*(.+?)\*\*/g, '$1');
      l = l.replace(/__(.+?)__/g, '$1');
      l = l.replace(/\*(.+?)\*/g, '$1');
      l = l.replace(/`([^`]+)`/g, '$1');
      l = l.replace(/[*`]/g, '');
      return l;
    })
    .join('\n')
    .trim();
};

// Shared directive appended to every AI prompt so responses come back as plain text.
const PLAIN_TEXT_DIRECTIVE =
  "Formatting rules: reply in plain text only. Do NOT use markdown, asterisks (*), underscores, hashes (#), or backticks for emphasis, bullets, or headings. Use plain sentences, and where you need a list start each item on a new line with a simple dot (•).";

/**
 * Chat completion through the server-side gateway. `purpose: 'support'` is the
 * only mode available to signed-out visitors (landing-page StockBot).
 */
export const callQwenPlus = async (
  messages: ChatMessage[],
  fallbackText: string = "",
  purpose: 'support' | 'insights' = 'support'
): Promise<string> => {
  const directedMessages = messages.some(m => m.role === 'system')
    ? messages.map(m => m.role === 'system' ? { ...m, content: `${m.content}\n\n${PLAIN_TEXT_DIRECTIVE}` } : m)
    : [{ role: 'system' as const, content: PLAIN_TEXT_DIRECTIVE }, ...messages];

  try {
    const { text } = await invokeAi({ provider: 'qwen', purpose, messages: directedMessages });
    return text ? sanitizeAiText(text) : fallbackText;
  } catch (error) {
    console.error("AI gateway call failed:", error);
    return fallbackText || "Service is temporarily unavailable. Please try again shortly.";
  }
};

export const getInventoryInsightsQwen = async (products: Product[], sales: Sale[]): Promise<InsightResult> => {
  const itemSalesHistory = sales.slice(0, 50).map(s => ({
    d: s.date,
    items: s.items.map(i => ({ n: i.productName, q: i.quantity, p: i.price }))
  }));

  const inventoryState = products.map(p => ({
    n: p.name, q: p.quantity, m: p.min_threshold, p: p.price, c: p.category
  }));

  const systemPrompt = "You are an elite retail logistics analyst for Nigerian businesses. Analyze shop inventory levels and historical sales and suggest strategic optimizations.";
  const userPrompt = `
  Analyze this shop data and research current Nigerian retail market trends to provide a predictive audit.

  SHOP INVENTORY: ${JSON.stringify(inventoryState)}
  HISTORICAL SALES (Last 50): ${JSON.stringify(itemSalesHistory)}

  Structure your output clearly with high priority restocks, risk warnings for expiry/low-stock, and potential local business growth opportunities. Focus heavily on Nigerian consumer patterns and current inflation dynamics.
  `;

  try {
    const textResult = await callQwenPlus([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ], "", 'insights');

    return { text: textResult || "No insights could be generated right now.", sources: [] };
  } catch (error) {
    console.error("Insights Error:", error);
    return { text: "Error generating predictive audit. Please try again in a moment.", sources: [] };
  }
};
