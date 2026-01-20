
import { GoogleGenAI, Type } from "@google/genai";
import { Product, Sale } from "../types";
import { DEFAULT_CATEGORIES } from "../constants";

const getAIClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.warn("Gemini API Key missing.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

const cleanBase64 = (base64: string) => {
  return base64.replace(/^data:image\/(png|jpeg|jpg);base64,/, '').replace(/\s/g, '');
};

export const identifyProductFromImage = async (base64Image: string): Promise<string | null> => {
  const ai = getAIClient();
  if (!ai) return null;
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: cleanBase64(base64Image),
            },
          },
          {
            text: "Identify SKU, Barcode, or Serial Number. ONLY output the raw code. If nothing found, output: NULL.",
          },
        ],
      }
    });

    const text = response.text?.trim();
    if (text === 'NULL' || !text || text.length < 3) return null;
    return text;
  } catch (error) {
    console.error("SKU Identification Error:", error);
    return null;
  }
};

export const extractProductDetailsFromImage = async (base64Image: string) => {
  const ai = getAIClient();
  if (!ai) return null;
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: cleanBase64(base64Image),
            },
          },
          {
            text: `Extract inventory metadata. VALID CATEGORIES: ${DEFAULT_CATEGORIES.join(', ')}.`,
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            sku: { type: Type.STRING },
            batchNumber: { type: Type.STRING },
            expiryDate: { type: Type.STRING },
            price: { type: Type.NUMBER },
            category: { type: Type.STRING }
          },
          required: ["name", "sku"]
        }
      }
    });

    return response.text ? JSON.parse(response.text) : null;
  } catch (error) {
    console.error("Pro Extraction Error:", error);
    return null;
  }
};

export const getInventoryInsights = async (products: Product[], sales: Sale[]) => {
  const ai = getAIClient();
  if (!ai) return "Engine unavailable.";
  
  const ctx = {
    inventory: products.map(p => ({ n: p.name, q: p.quantity, m: p.min_threshold, p: p.price })),
    sales: sales.slice(0, 30).map(s => ({ r: s.total_price, d: s.date }))
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Analyze this operational footprint: ${JSON.stringify(ctx)}. Provide concise directives.`,
    });

    return response.text || "Analysis complete.";
  } catch (error) {
    console.error("Insight Error:", error);
    return "Error connecting to logic server.";
  }
};
