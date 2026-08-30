import { Product, Sale } from "../types";
import { DEFAULT_CATEGORIES } from "../constants";
import { sanitizeAiText } from "./qwenService";
import { invokeAi } from "./aiClient";

// All calls go through the `ai-gateway` Edge Function — no API key in the browser.

const cleanBase64 = (base64: string) =>
  base64.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '').replace(/\s/g, '');

const imagePart = (base64Image: string) => ({
  inlineData: { mimeType: 'image/jpeg', data: cleanBase64(base64Image) },
});

export const identifyProductFromImage = async (base64Image: string): Promise<string | null> => {
  try {
    const { text } = await invokeAi({
      provider: 'gemini',
      model: 'gemini-2.5-flash',
      contents: [{
        role: 'user',
        parts: [
          imagePart(base64Image),
          { text: "Identify SKU, Barcode, or Serial Number. ONLY output the raw code. If nothing found, output: NULL." },
        ],
      }],
    });
    const code = text.trim();
    if (!code || code === 'NULL' || code.length < 3) return null;
    return code;
  } catch (error) {
    console.error("SKU Identification Error:", error);
    return null;
  }
};

export const extractProductDetailsFromImage = async (base64Image: string) => {
  try {
    const { text } = await invokeAi({
      provider: 'gemini',
      model: 'gemini-2.5-flash',
      contents: [{
        role: 'user',
        parts: [
          imagePart(base64Image),
          { text: `Extract inventory metadata from this product image. VALID CATEGORIES: ${DEFAULT_CATEGORIES.join(', ')}. Return name, sku, price, and category.` },
        ],
      }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            name: { type: "STRING" },
            sku: { type: "STRING" },
            batchNumber: { type: "STRING" },
            expiryDate: { type: "STRING" },
            price: { type: "NUMBER" },
            cost_price: { type: "NUMBER" },
            category: { type: "STRING" },
          },
          required: ["name", "sku"],
        },
      },
    });
    return text ? JSON.parse(text) : null;
  } catch (error) {
    console.error("Pro Extraction Error:", error);
    return null;
  }
};

export interface InsightResult {
  text: string;
  sources: { title: string; uri: string }[];
}

export const getInventoryInsights = async (products: Product[], sales: Sale[]): Promise<InsightResult> => {
  const itemSalesHistory = sales.slice(0, 50).map(s => ({
    d: s.date,
    items: s.items.map(i => ({ n: i.productName, q: i.quantity, p: i.price }))
  }));

  const inventoryState = products.map(p => ({
    n: p.name, q: p.quantity, m: p.min_threshold, p: p.price, c: p.category
  }));

  try {
    const { text, sources } = await invokeAi({
      provider: 'gemini',
      model: 'gemini-2.5-flash',
      contents: [{
        role: 'user',
        parts: [{ text: `
      SHOP INVENTORY: ${JSON.stringify(inventoryState)}
      HISTORICAL SALES (Last 50): ${JSON.stringify(itemSalesHistory)}

      You are an elite retail logistics analyst for Nigerian businesses.
      Based on this data and your research of current market trends in Nigeria, provide a detailed predictive audit.
      Suggest high priority restocks, risk warnings for expiry, and market opportunities.
      Reply in plain text only. Do NOT use markdown, asterisks (*), underscores, hashes (#), or backticks. For lists, start each item on a new line with a simple dot (•).` }],
      }],
      tools: [{ googleSearch: {} }],
    });

    return { text: sanitizeAiText(text || "Analysis complete."), sources };
  } catch (error) {
    console.error("Insight Error:", error);
    return { text: "Error connecting to logic server. Please check your network connection.", sources: [] };
  }
};
