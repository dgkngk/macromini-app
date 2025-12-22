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

export type UserTier = 0 | 1 | 2; // 0: Free, 1: Plus, 2: Elite

export interface User {
  id: string;
  email: string | null;
  name: string | null;
  avatar: string | null;
  tier?: UserTier;
  subscriptionStatus?: number; // 0: Inactive, 1: Active, 2: Past Due, 3: Trialing
  lemonSqueezyCustomerId?: string;
  subscriptionId?: string;
}

export enum Tab {
  TRACKER = 'TRACKER',
  PLANS = 'PLANS',
  RECIPES = 'RECIPES',
  SHOPPING = 'SHOPPING'
}

export type Language = 'en' | 'tr' | 'de' | 'fr' | 'nl' | 'es' | 'pt' | 'ru' | 'zh';