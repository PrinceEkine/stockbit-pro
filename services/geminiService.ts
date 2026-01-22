import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { Product, Sale } from "../types";
import { DEFAULT_CATEGORIES } from "../constants";

const getAIClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
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

export interface InsightResult {
  text: string;
  sources: { title: string; uri: string }[];
}

export const getInventoryInsights = async (products: Product[], sales: Sale[]): Promise<InsightResult> => {
  const ai = getAIClient();
  if (!ai) return { text: "Engine unavailable.", sources: [] };
  
  // Create a granular map of what sold and when
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

  const systemInstruction = `You are an elite retail logistics analyst for Nigerian businesses. 
  Your goal is to provide predictive stock recommendations.
  Use Google Search to factor in:
  1. Current inflation rates in Nigeria and their impact on retail pricing.
  2. Upcoming holidays or seasonal events in Nigeria (e.g., Ramadan, Christmas, School Resumption).
  3. Supply chain or currency (Naira) trends that might affect stock availability.
  
  Analyze the provided data and suggest:
  - High priority restocks (items moving fast vs current low stock).
  - Risk warnings (items expiring soon or stagnant capital).
  - Market opportunities (new categories to enter based on search data).`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `
      SHOP INVENTORY: ${JSON.stringify(inventoryState)}
      HISTORICAL SALES (Last 50): ${JSON.stringify(itemSalesHistory)}
      
      Based on this data and your research of current market trends in Nigeria, provide a detailed predictive audit.`,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });

    const sources: { title: string; uri: string }[] = [];
    const groundingMetadata = (response as any).candidates?.[0]?.groundingMetadata;
    
    if (groundingMetadata?.groundingChunks) {
      groundingMetadata.groundingChunks.forEach((chunk: any) => {
        if (chunk.web) {
          sources.push({ title: chunk.web.title, uri: chunk.web.uri });
        }
      });
    }

    return {
      text: response.text || "Analysis complete.",
      sources: sources
    };
  } catch (error) {
    console.error("Insight Error:", error);
    return { text: "Error connecting to logic server.", sources: [] };
  }
};