
import { GoogleGenAI, Type } from "@google/genai";
import { Product, Sale } from "../types";

export const identifyProductFromImage = async (base64Image: string): Promise<string | null> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Image,
            },
          },
          {
            text: "Find the barcode, SKU, or product name in this image. Return ONLY the text of the code or name. If you see a barcode, extract its numeric or alphanumeric value. If no product identifier is found, return 'NOT_FOUND'.",
          },
        ],
      },
    });

    const text = response.text?.trim();
    if (text === 'NOT_FOUND') return null;
    return text || null;
  } catch (error) {
    console.error("Gemini Vision Error:", error);
    return null;
  }
};

export const extractProductDetailsFromImage = async (base64Image: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Image,
            },
          },
          {
            text: "Analyze this product label or barcode. Extract the following details into JSON: name (Product Name), sku (Barcode or Identifier), batchNumber (Batch number if visible), expiryDate (Expiry date in YYYY-MM-DD if visible), price (numeric value if visible, else 0), category (one of Electronics, Appliances, Furniture, Textiles, Stationery, Groceries, Other).",
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

    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Gemini Extraction Error:", error);
    return null;
  }
};

export const getInventoryInsights = async (products: Product[], sales: Sale[]) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const inventoryContext = products.map(p => ({
    name: p.name,
    stock: p.quantity,
    min: p.minThreshold,
    price: p.price,
    batch: p.batchNumber,
    expiry: p.expiryDate
  }));

  const salesContext = sales.slice(0, 20).flatMap(s => 
    s.items.map(item => ({
      name: item.productName,
      qty: item.quantity,
      date: s.date
    }))
  );

  const prompt = `
    Analyze this inventory data and recent sales to provide 3 actionable insights:
    Inventory: ${JSON.stringify(inventoryContext)}
    Recent Sales: ${JSON.stringify(salesContext)}
    
    Keep insights concise, professional, and helpful for a warehouse manager. 
    Identify low stock risks, items nearing expiry, slow-moving items, or revenue opportunities.
    Format as a bulleted list.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        systemInstruction: "You are a senior supply chain analyst for a modern retail company. You provide data-driven insights about stock levels, sales trends, and inventory health including expiry monitoring."
      }
    });

    return response.text || "Unable to generate insights at this time.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "The AI assistant is temporarily unavailable. Check your internet connection or API key.";
  }
};
