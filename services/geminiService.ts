
import { GoogleGenAI, Type } from "@google/genai";
import { Product, Sale } from "../types";
import { DEFAULT_CATEGORIES } from "../constants";

const getAIClient = () => {
  if (!process.env.API_KEY) {
    console.warn("Gemini API Key missing.");
    return null;
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

const cleanBase64 = (base64: string) => {
  return base64.replace(/^data:image\/(png|jpeg|jpg);base64,/, '').replace(/\s/g, '');
};

/**
 * HIGH-SPEED SKU IDENTIFIER
 * Uses Gemini 3 Flash for sub-second SKU/Barcode identification.
 */
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
            text: "STRICT INDUSTRIAL PROTOCOL: Analyze product frame. " +
                  "Identify SKU, Barcode, or Serial Number alphanumeric string. " +
                  "IGNORE all other text. ONLY output the raw code. If nothing found, output: NULL.",
          },
        ],
      }
    });

    const text = response.text?.trim();
    if (text === 'NULL' || !text || text.length < 3) return null;
    return text;
  } catch (error) {
    console.error("Flash SKU Identification Error:", error);
    return null;
  }
};

/**
 * INTELLIGENT PRODUCT EXTRACTION
 * Uses Gemini 3 Pro for deep extraction of metadata from packaging.
 */
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
            text: `DEEP EXTRACTION PROTOCOL: Extract all inventory metadata. ` +
                  `VALID CATEGORIES: ${DEFAULT_CATEGORIES.join(', ')}. ` +
                  `Ensure currency values are extracted as numbers. ` +
                  `Standardize expiry dates to YYYY-MM-DD.`,
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: "Official product label name" },
            sku: { type: Type.STRING, description: "Barcode or SKU alphanumeric code" },
            batchNumber: { type: Type.STRING, description: "Batch/Lot identifier" },
            expiryDate: { type: Type.STRING, description: "Formatted expiry YYYY-MM-DD" },
            price: { type: Type.NUMBER, description: "Estimated market price" },
            category: { type: Type.STRING, description: "Matching inventory category" }
          },
          required: ["name", "sku"]
        }
      }
    });

    const text = response.text;
    return text ? JSON.parse(text) : null;
  } catch (error) {
    console.error("Pro Extraction Error:", error);
    return null;
  }
};

/**
 * BUSINESS INTELLIGENCE ENGINE
 */
export const getInventoryInsights = async (products: Product[], sales: Sale[]) => {
  const ai = getAIClient();
  if (!ai) return "Intelligence engine unavailable.";
  
  const ctx = {
    inventory: products.map(p => ({ n: p.name, q: p.quantity, m: p.min_threshold, p: p.price })),
    sales: sales.slice(0, 30).map(s => ({ r: s.total_price, d: s.date }))
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Act as a Top-Tier Retail Consultant. Analyze this operational footprint: ${JSON.stringify(ctx)}. ` +
                 `Provide 3 concise directives for: 1. Cash Flow, 2. Stock Health, 3. Growth Ops.`,
      config: {
        systemInstruction: "You are StockBit Pro AI. Your tone is professional, strategic, and concise."
      }
    });

    return response.text || "Analysis complete.";
  } catch (error) {
    console.error("Insight Generation Error:", error);
    return "Error connecting to strategic logic server.";
  }
};
