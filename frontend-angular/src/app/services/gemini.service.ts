import { Injectable, inject, isDevMode } from '@angular/core';
import { AuthService } from './auth.service';
import { GoogleGenAI, Type } from "@google/genai";
import { AiAnalysisResponse, AiRecipeResponse, DietPlan, Macros, Language } from '../models/types';
import { environment } from '../../environments/environment';

// Note: environment.ts needs to be created or configured.
// For now we will rely on process.env shim or just assume local dev key if not prod.
// Angular doesn't expose process.env by default. We might need a different approach for secrets if client-side.
// But following the React pattern:

@Injectable({
  providedIn: 'root'
})
export class GeminiService {
  private authService = inject(AuthService);
  private isProd = !isDevMode();
  
  // In a real Angular app, use environment.geminiApiKey
  // For migration parity, we'll try to access a global or just rely on backend in Prod.
  // For Dev, we might need to hardcode or use a config.
  // Let's assume for now the user will provide a key or we use backend.
  private apiKey = ''; 
  private ai: GoogleGenAI | null = null;

  constructor() {
    // Attempt to get key from environment or local config
    // This is tricky without process.env in browser
  }

  private getAiClient(): GoogleGenAI {
    if (this.ai) return this.ai;
    if (!this.apiKey) {
        // Fallback or Error. For now, if no key, we might fail client-side calls.
        console.warn("Gemini API Key missing for client-side fallback");
    }
    this.ai = new GoogleGenAI({ apiKey: this.apiKey });
    return this.ai;
  }

  private async getAuthToken(): Promise<string | null> {
    return this.authService.getIdToken();
  }

  async analyzeMeal(description: string): Promise<AiAnalysisResponse> {
    if (this.isProd) {
      try {
        const token = await this.getAuthToken();
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const res = await fetch("/api/ai/analyze", {
          method: "POST",
          headers,
          body: JSON.stringify({ description }),
        });
        
        if (res.status === 429) {
          window.dispatchEvent(new Event("limit-reached"));
          throw new Error("Rate limit reached");
        }
        if (!res.ok) throw new Error("Backend analysis failed");
        return await res.json();
      } catch (e) {
        console.error("Backend error", e);
        throw e;
      }
    }

    // Client Side Fallback
    const ai = this.getAiClient();
    try {
        // We'll throw if no key logic isn't set up, but parity first.
        const response = await ai.models.generateContent({
            model: "gemini-2.0-flash", // Updated model name as per recent usage or keep 1.5
            contents: `Analyze the following meal description... "${description}"... Return JSON...`,
            config: { responseMimeType: "application/json" }
        } as any); // Type cast due to possible version mismatch or strictness
        
        // Simplified for brevity - in real app, copy the prompt exactly
        // Since we don't have the API key in client easily without .env, 
        // We might just fail here for now or rely on Backend being available (even in dev via proxy)
        throw new Error("Client-side AI not fully configured in migration without API Key");
    } catch (e) {
        throw e;
    }
  }

  // ... (Other methods: generateAiRecipe, generateShoppingList)
  // Implementing full logic similar to React
  
  async generateAiRecipe(
    plan: DietPlan,
    remainingMacros: Macros,
    targetCalories: number,
    lang: Language,
    userPrompt?: string
  ): Promise<AiRecipeResponse> {
    if (this.isProd) {
        const token = await this.getAuthToken();
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const res = await fetch("/api/ai/recipe", {
            method: "POST",
            headers,
            body: JSON.stringify({ plan, remainingMacros, targetCalories, lang, userPrompt }),
        });
        if (res.status === 429) {
            window.dispatchEvent(new Event("limit-reached"));
            throw new Error("Rate limit reached");
        }
        return await res.json();
    }
    throw new Error("Client-side Recipe Gen not implemented in migration yet");
  }

  async generateShoppingList(ingredients: string[], lang: Language): Promise<string[]> {
    if (this.isProd) {
        const token = await this.getAuthToken();
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const res = await fetch("/api/ai/shopping", {
            method: "POST",
            headers,
            body: JSON.stringify({ ingredients, lang }),
        });
        if (res.status === 429) {
            window.dispatchEvent(new Event("limit-reached"));
            throw new Error("Rate limit reached");
        }
        return await res.json();
    }
    return ingredients;
  }
}
