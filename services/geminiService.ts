import { GoogleGenAI, Type } from "@google/genai";
import {
  AiAnalysisResponse,
  AiRecipeResponse,
  DietPlan,
  Macros,
  Language,
} from "../types";

// Determine if we should use Backend API or Client-Side Key
// Fix: Property 'env' does not exist on type 'ImportMeta'
const USE_BACKEND = (import.meta as any).env?.PROD;

// Client-side fallback setup
const apiKey = process.env.GEMINI_API_KEY || "";
let ai: GoogleGenAI | null = null;
if (!USE_BACKEND && apiKey) {
  ai = new GoogleGenAI({ apiKey });
}

export const analyzeMeal = async (
  description: string,
): Promise<AiAnalysisResponse> => {
  // 1. Production Mode: Use Backend
  if (USE_BACKEND) {
    try {
      const res = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description }),
      });
      if (!res.ok) throw new Error("Backend analysis failed");
      return await res.json();
    } catch (e) {
      console.error("Backend error, falling back to client (if key exists)", e);
      // Fallthrough to client logic only if backend fails and we have a key (unlikely in prod but good for robust dev)
    }
  }

  // 2. Dev/Fallback Mode: Use Client-Side Key
  if (!ai) {
    if (!apiKey) throw new Error("API Key is missing (Client Side).");
    ai = new GoogleGenAI({ apiKey });
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Analyze the following meal description and estimate the nutritional content. Return a JSON object.
      Meal Description: "${description}"

      If exact quantities aren't specified, estimate based on standard serving sizes.
      Be realistic. If the input is nonsense, return 0 for all values but try to name what it might be or just say "Unknown".`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: {
              type: Type.STRING,
              description: "A short, clean name for the meal entry.",
            },
            calories: {
              type: Type.NUMBER,
              description: "Total calories (kcal)",
            },
            protein: { type: Type.NUMBER, description: "Protein in grams" },
            carbs: { type: Type.NUMBER, description: "Carbohydrates in grams" },
            fat: { type: Type.NUMBER, description: "Fat in grams" },
            fiber: { type: Type.NUMBER, description: "Fiber in grams" },
            sugar: { type: Type.NUMBER, description: "Sugar in grams" },
          },
          required: [
            "name",
            "calories",
            "protein",
            "carbs",
            "fat",
            "fiber",
            "sugar",
          ],
        },
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response from AI");
    }

    const data = JSON.parse(text) as AiAnalysisResponse;
    return data;
  } catch (error) {
    console.error("Error analyzing meal with Gemini:", error);
    throw error;
  }
};

export const generateAiRecipe = async (
  plan: DietPlan,
  remainingMacros: Macros,
  targetCalories: number,
  lang: Language,
  userPrompt?: string,
): Promise<AiRecipeResponse> => {
  // 1. Production Mode: Use Backend
  if (USE_BACKEND) {
    try {
      const res = await fetch("/api/ai/recipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan,
          remainingMacros,
          targetCalories,
          lang,
          userPrompt,
        }),
      });
      if (!res.ok) throw new Error("Backend recipe generation failed");
      return await res.json();
    } catch (e) {
      console.error("Backend error", e);
    }
  }

  // 2. Dev/Fallback Mode
  if (!ai) {
    if (!apiKey) throw new Error("API Key is missing (Client Side).");
    ai = new GoogleGenAI({ apiKey });
  }

  const langMap: Record<Language, string> = {
    en: "English",
    tr: "Turkish",
    de: "German",
    fr: "French",
    nl: "Dutch",
    es: "Spanish",
    pt: "Portuguese",
    ru: "Russian",
    zh: "Chinese (Simplified)",
  };

  const langInstruction = langMap[lang] || "English";
  const customRequest = userPrompt
    ? `User's specific request: "${userPrompt}". Make sure the recipe honors this request.`
    : "";

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `You are a professional chef and nutritionist.

      Context:
      The user is following a "${plan.name}" diet plan.
      Description of plan: ${plan.description}.
      ${customRequest}

      Goal:
      Create a single delicious recipe that provides approximately ${targetCalories} calories.
      The recipe should respect the diet plan style (e.g. if Keto, low carb; if High Protein, focus on meat/legumes) unless the user's specific request contradicts it (prioritize user request).

      IMPORTANT: Generate the content (name, description, ingredients, instructions) in ${langInstruction}.

      Return a JSON object containing the recipe details and its nutritional analysis.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: {
              type: Type.STRING,
              description: `Name of the dish in ${langInstruction}`,
            },
            description: {
              type: Type.STRING,
              description: `Brief appetizing description in ${langInstruction}`,
            },
            cookingTime: { type: Type.STRING, description: `e.g. 20 mins` },
            ingredients: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: `List of ingredients with quantities in ${langInstruction}`,
            },
            instructions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: `Step by step cooking instructions in ${langInstruction}`,
            },
            calories: { type: Type.NUMBER },
            protein: { type: Type.NUMBER },
            carbs: { type: Type.NUMBER },
            fat: { type: Type.NUMBER },
            fiber: { type: Type.NUMBER },
            sugar: { type: Type.NUMBER },
          },
          required: [
            "name",
            "description",
            "cookingTime",
            "ingredients",
            "instructions",
            "calories",
            "protein",
            "carbs",
            "fat",
            "fiber",
            "sugar",
          ],
        },
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response from AI");
    }

    return JSON.parse(text) as AiRecipeResponse;
  } catch (error) {
    throw error;
  }
};

export const generateShoppingList = async (
  ingredients: string[], 
  lang: Language
): Promise<string[]> => {
  // 1. Production Mode Check (same as others)
  if (USE_BACKEND) {
     // ... fetch('/api/ai/shopping') implementation if needed
     // For now, we can skip or copy the pattern if you have a backend endpoint ready.
  }

  // 2. Client Fallback
  if (!ai) {
    if (!apiKey) throw new Error("API Key missing");
    ai = new GoogleGenAI({ apiKey });
  }

  const langMap: Record<Language, string> = {
    en: "English", tr: "Turkish", de: "German", fr: "French", 
    nl: "Dutch", es: "Spanish", pt: "Portuguese", ru: "Russian", zh: "Chinese"
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `
        You are a smart kitchen assistant.
        Convert the following recipe ingredients into a consolidated shopping list.
        
        Ingredients:
        ${JSON.stringify(ingredients)}

        Instructions:
        1. Output ONLY a JSON array of strings.
        2. Combine duplicates (e.g. "2 eggs" and "1 egg" -> "3 eggs").
        3. Standardize units (e.g. use "g", "ml", "tbsp", "cup").
        4. Translate items to ${langMap[lang]}.
        5. Remove pantry staples like "water" or "ice" if they are obvious.
        6. Format as: "Quantity Unit Item" (e.g. "500g Chicken Breast", "2 Onions").
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });

    const text = response.text;
    if (!text) return ingredients; // Fallback to original if AI fails
    return JSON.parse(text) as string[];

  } catch (error) {
    console.error("AI Shopping List Error", error);
    return ingredients; // Fallback
  }
};
