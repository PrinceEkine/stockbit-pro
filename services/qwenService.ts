import { Product, Sale } from "../types";
import { GoogleGenAI } from "@google/genai";

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
      // Turn markdown bullets ("* ", "- ", "+ ") at the start of a line into a clean dot.
      l = l.replace(/^(\s*)[*\-+]\s+/, '$1• ');
      // Drop leading heading markers ("#", "##", ...).
      l = l.replace(/^\s*#{1,6}\s*/, '');
      // Strip bold/italic emphasis wrappers while keeping the inner text.
      l = l.replace(/\*\*(.+?)\*\*/g, '$1');
      l = l.replace(/__(.+?)__/g, '$1');
      l = l.replace(/\*(.+?)\*/g, '$1');
      l = l.replace(/`([^`]+)`/g, '$1');
      // Remove any remaining stray asterisks or backticks.
      l = l.replace(/[*`]/g, '');
      return l;
    })
    .join('\n')
    .trim();
};

// Shared directive appended to every AI prompt so responses come back as plain text.
const PLAIN_TEXT_DIRECTIVE =
  "Formatting rules: reply in plain text only. Do NOT use markdown, asterisks (*), underscores, hashes (#), or backticks for emphasis, bullets, or headings. Use plain sentences, and where you need a list start each item on a new line with a simple dot (•).";

export const callQwenPlus = async (
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[],
  fallbackText: string = ""
): Promise<string> => {
  const apiKey = process.env.ALIBABA_API_KEY || process.env.QWEN_API_KEY || import.meta.env.VITE_ALIBABA_API_KEY || '';

  if (!apiKey) {
    console.log("Alibaba API key not configured. Falling back to Gemini...");
    return await callGeminiFallback(messages);
  }

  // Reinforce the system message with the plain-text formatting directive.
  const directedMessages = messages.some(m => m.role === 'system')
    ? messages.map(m => m.role === 'system' ? { ...m, content: `${m.content}\n\n${PLAIN_TEXT_DIRECTIVE}` } : m)
    : [{ role: 'system' as const, content: PLAIN_TEXT_DIRECTIVE }, ...messages];

  try {
    const endpoint = "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions";
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "qwen-plus",
        messages: directedMessages,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Qwen API returned ${response.status}: ${errText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    return content ? sanitizeAiText(content) : fallbackText;
  } catch (error) {
    console.error("Qwen API Call failed, falling back to Gemini:", error);
    return await callGeminiFallback(messages);
  }
};

const callGeminiFallback = async (
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[]
): Promise<string> => {
  try {
    const geminiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || '';
    if (!geminiKey) {
      throw new Error("No Gemini API key available either.");
    }
    
    const ai = new GoogleGenAI({ apiKey: geminiKey });
    const systemMsg = messages.find(m => m.role === 'system')?.content || '';
    const userMsgs = messages.filter(m => m.role !== 'system').map(m => m.content).join("\n");

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: userMsgs,
      config: {
        systemInstruction: `${systemMsg}\n\n${PLAIN_TEXT_DIRECTIVE}`.trim(),
      }
    });

    return sanitizeAiText(response.text || "Hello! I am StockBot. I am currently running on fallback mode because no API keys could be authorized.");
  } catch (err) {
    console.error("Gemini Fallback failed as well:", err);
    return "Service is temporarily unavailable. Please verify your API key configurations in the Settings menu.";
  }
};

export const getInventoryInsightsQwen = async (products: Product[], sales: Sale[]): Promise<InsightResult> => {
  const itemSalesHistory = sales.slice(0, 50).map(s => ({
    d: s.date,
    items: s.items.map(i => ({ n: i.productName, q: i.quantity, p: i.price }))
  }));

  const inventoryState = products.map(p => ({ 
    n: p.name, 
    q: p.quantity, 
    m: p.min_threshold, 
    p: p.price,
    c: p.category
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
    ]);

    return {
      text: textResult,
      sources: []
    };
  } catch (error) {
    console.error("Qwen Insights Error:", error);
    return {
      text: "Error generating predictive audit. Please ensure your Alibaba API key is configured correctly.",
      sources: []
    };
  }
};
