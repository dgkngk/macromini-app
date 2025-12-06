export interface Macros {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
}

export interface DietPlan {
  id: string;
  name: string;
  description: string;
  targets: Macros;
  colorTheme: string; // hex or tailwind class prefix
}

export interface MealEntry {
  id: string;
  planId: string;
  date: string; // ISO Date string YYYY-MM-DD
  name: string;
  macros: Macros;
  timestamp: number;
}

export interface AiAnalysisResponse {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
}

export interface AiRecipeResponse extends AiAnalysisResponse {
  description: string;
  ingredients: string[];
  instructions: string[];
  cookingTime: string;
}

export interface SavedRecipe extends AiRecipeResponse {
  id: string;
  savedAt: number;
}

export interface ShoppingItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
}

export enum Tab {
  TRACKER = 'TRACKER',
  PLANS = 'PLANS',
  RECIPES = 'RECIPES',
  SHOPPING = 'SHOPPING'
}

export type Language = 'en' | 'tr' | 'de' | 'fr' | 'nl' | 'es' | 'pt' | 'ru' | 'zh';