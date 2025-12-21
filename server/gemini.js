import { GoogleGenAI, Type } from "@google/genai";

const getAI = (apiKey) => {
  const key = apiKey || process.env.GEMINI_API_KEY;
  if (!key) throw new Error("API_KEY not set on server");
  return new GoogleGenAI({ apiKey: key });
};

export const analyzeMeal = async (description, apiKey) => {
  const ai = getAI(apiKey);

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
          calories: { type: Type.NUMBER },
          protein: { type: Type.NUMBER },
          carbs: { type: Type.NUMBER },
          fat: { type: Type.NUMBER },
          fiber: { type: Type.NUMBER },
          sugar: { type: Type.NUMBER },
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

  return JSON.parse(response.text);
};

export const generateRecipe = async (
  plan,
  remainingMacros,
  targetCalories,
  lang,
  userPrompt,
  apiKey,
) => {
  const ai = getAI(apiKey);

  const langMap = {
    en: "English",
    tr: "Turkish",
    de: "German",
    fr: "French",
    nl: "Dutch",
    es: "Spanish",
    pt: "Portuguese",
    ru: "Russian",
    zh: "Chinese",
  };

  const langInstruction = langMap[lang] || "English";
  const customRequest = userPrompt
    ? `User's specific request: "${userPrompt}". Make sure the recipe honors this request.`
    : "";

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `You are a professional chef and nutritionist.

    Context:
    The user is following a "${plan.name}" diet plan.
    Description of plan: ${plan.description}.
    ${customRequest}

    Goal:
    Create a single delicious recipe that provides approximately ${targetCalories} calories.
    The recipe should respect the diet plan style unless the user's specific request contradicts it.

    IMPORTANT: Generate the content in ${langInstruction}.

    Return a JSON object containing the recipe details.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          description: { type: Type.STRING },
          cookingTime: { type: Type.STRING },
          ingredients: { type: Type.ARRAY, items: { type: Type.STRING } },
          instructions: { type: Type.ARRAY, items: { type: Type.STRING } },
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

  return JSON.parse(response.text);
};

export const generateShoppingList = async (ingredients, lang, apiKey) => {
  const ai = getAI(apiKey);

  const langMap = {
    en: "English",
    tr: "Turkish",
    de: "German",
    fr: "French",
    nl: "Dutch",
    es: "Spanish",
    pt: "Portuguese",
    ru: "Russian",
    zh: "Chinese",
  };

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
        3. Standardize units and translate them to the target language (e.g. for Turkish use 'g', 'ml', 'yk', 'sb').
        4. Translate BOTH the ingredient names AND the units to ${langMap[lang] || "English"}.
        5. Remove pantry staples like "water" or "ice" if they are obvious.
        6. Format as: "Quantity Unit Item" (fully localized string).
      `,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
      },
    },
  });

  return JSON.parse(response.text);
};
