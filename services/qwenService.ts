import { Product, Sale } from "../types";
import { GoogleGenAI } from "@google/genai";

export interface InsightResult {
  text: string;
  sources: { title: string; uri: string }[];
}

export const callQwenPlus = async (
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[],
  fallbackText: string = ""
): Promise<string> => {
  const apiKey = process.env.ALIBABA_API_KEY || process.env.QWEN_API_KEY || import.meta.env.VITE_ALIBABA_API_KEY || '';
  
  if (!apiKey) {
    console.log("Alibaba API key not configured. Falling back to Gemini...");
    return await callGeminiFallback(messages);
  }

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
        messages: messages,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Qwen API returned ${response.status}: ${errText}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || fallbackText;
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
        systemInstruction: systemMsg || undefined,
      }
    });

    return response.text || "Hello! I am StockBot. I am currently running on fallback mode because no API keys could be authorized.";
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
