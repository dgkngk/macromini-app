import { GoogleGenAI, Type } from "@google/genai";

const apiKey = process.env.API_KEY;
const ai = new GoogleGenAI({ apiKey });

export const analyzeMeal = async (description) => {
  if (!apiKey) throw new Error("API_KEY not set on server");

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
          name: { type: Type.STRING, description: "A short, clean name for the meal entry." },
          calories: { type: Type.NUMBER },
          protein: { type: Type.NUMBER },
          carbs: { type: Type.NUMBER },
          fat: { type: Type.NUMBER },
          fiber: { type: Type.NUMBER },
          sugar: { type: Type.NUMBER },
        },
        required: ["name", "calories", "protein", "carbs", "fat", "fiber", "sugar"],
      },
    },
  });

  return JSON.parse(response.text);
};

export const generateRecipe = async (plan, remainingMacros, targetCalories, lang, userPrompt) => {
  if (!apiKey) throw new Error("API_KEY not set on server");

  const langMap = {
    en: 'English', tr: 'Turkish', de: 'German', fr: 'French', 
    nl: 'Dutch', es: 'Spanish', pt: 'Portuguese', ru: 'Russian', zh: 'Chinese'
  };

  const langInstruction = langMap[lang] || 'English';
  const customRequest = userPrompt ? `User's specific request: "${userPrompt}". Make sure the recipe honors this request.` : '';

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
        required: ["name", "description", "cookingTime", "ingredients", "instructions", "calories", "protein", "carbs", "fat", "fiber", "sugar"],
      },
    },
  });

  return JSON.parse(response.text);
};