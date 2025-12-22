import { Injectable, inject, isDevMode } from '@angular/core';
import { AuthService } from './auth.service';
import { DietPlan, MealEntry, SavedRecipe, ShoppingItem } from '../models/types';
import { BASE_STORAGE_KEYS } from '../models/constants';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  private authService = inject(AuthService);
  private isProd = !isDevMode();

  private isGuest(userId: string): boolean {
    return userId.startsWith('guest_');
  }

  private getUserKey(userId: string, key: string): string {
    return `user_${userId}_${key}`;
  }

  private async fetchWithAuth(endpoint: string, options: RequestInit = {}): Promise<any> {
    const token = await this.authService.getIdToken();
    if (!token) throw new Error('Not authenticated');

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...(options.headers as any || {}),
    };

    const response = await fetch(endpoint, { ...options, headers });
    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }
    return response.json();
  }
  
  // Plans
  async getPlans(): Promise<DietPlan[]> {
    const user = this.authService.user();
    if (!user) return [];
    
    if (this.isProd && !this.isGuest(user.id)) {
      return this.fetchWithAuth('/api/data/plans');
    }
    
    const key = this.getUserKey(user.id, BASE_STORAGE_KEYS.PLANS);
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  }

  async savePlan(plan: DietPlan): Promise<DietPlan> {
    const user = this.authService.user();
    if (!user) throw new Error('No user');

    if (this.isProd && !this.isGuest(user.id)) {
      return this.fetchWithAuth('/api/data/plans', {
        method: 'POST',
        body: JSON.stringify(plan)
      });
    }

    const key = this.getUserKey(user.id, BASE_STORAGE_KEYS.PLANS);
    const current = JSON.parse(localStorage.getItem(key) || '[]');
    const index = current.findIndex((p: DietPlan) => p.id === plan.id);
    let updated;
    if (index >= 0) {
      updated = current.map((p: DietPlan) => p.id === plan.id ? plan : p);
    } else {
      updated = [...current, plan];
    }
    localStorage.setItem(key, JSON.stringify(updated));
    return plan;
  }

  async deletePlan(planId: string): Promise<void> {
    const user = this.authService.user();
    if (!user) return;

    if (this.isProd && !this.isGuest(user.id)) {
      return this.fetchWithAuth(`/api/data/plans/${planId}`, { method: 'DELETE' });
    }

    const key = this.getUserKey(user.id, BASE_STORAGE_KEYS.PLANS);
    const current = JSON.parse(localStorage.getItem(key) || '[]');
    const updated = current.filter((p: DietPlan) => p.id !== planId);
    localStorage.setItem(key, JSON.stringify(updated));
  }

  // Meals
  async getMeals(): Promise<MealEntry[]> {
    const user = this.authService.user();
    if (!user) return [];

    if (this.isProd && !this.isGuest(user.id)) {
      return this.fetchWithAuth('/api/data/meals');
    }

    const key = this.getUserKey(user.id, BASE_STORAGE_KEYS.ENTRIES);
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  }

  async addMeal(entry: MealEntry): Promise<MealEntry> {
    const user = this.authService.user();
    if (!user) throw new Error('No user');

    if (this.isProd && !this.isGuest(user.id)) {
      return this.fetchWithAuth('/api/data/meals', {
        method: 'POST',
        body: JSON.stringify(entry)
      });
    }

    const key = this.getUserKey(user.id, BASE_STORAGE_KEYS.ENTRIES);
    const current = JSON.parse(localStorage.getItem(key) || '[]');
    const updated = [entry, ...current];
    localStorage.setItem(key, JSON.stringify(updated));
    return entry;
  }

  async deleteMeal(entryId: string): Promise<void> {
    const user = this.authService.user();
    if (!user) return;

    if (this.isProd && !this.isGuest(user.id)) {
      return this.fetchWithAuth(`/api/data/meals/${entryId}`, { method: 'DELETE' });
    }

    const key = this.getUserKey(user.id, BASE_STORAGE_KEYS.ENTRIES);
    const current = JSON.parse(localStorage.getItem(key) || '[]');
    const updated = current.filter((e: MealEntry) => e.id !== entryId);
    localStorage.setItem(key, JSON.stringify(updated));
  }

  // Recipes
  async getRecipes(): Promise<SavedRecipe[]> {
    const user = this.authService.user();
    if (!user) return [];

    if (this.isProd && !this.isGuest(user.id)) {
      return this.fetchWithAuth('/api/data/recipes');
    }

    const key = this.getUserKey(user.id, BASE_STORAGE_KEYS.RECIPES);
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  }

  async saveRecipe(recipe: SavedRecipe): Promise<SavedRecipe> {
    const user = this.authService.user();
    if (!user) throw new Error('No user');

    if (this.isProd && !this.isGuest(user.id)) {
      return this.fetchWithAuth('/api/data/recipes', {
        method: 'POST',
        body: JSON.stringify(recipe)
      });
    }

    const key = this.getUserKey(user.id, BASE_STORAGE_KEYS.RECIPES);
    const current = JSON.parse(localStorage.getItem(key) || '[]');
    const updated = [recipe, ...current];
    localStorage.setItem(key, JSON.stringify(updated));
    return recipe;
  }

  async deleteRecipe(recipeId: string): Promise<void> {
    const user = this.authService.user();
    if (!user) return;

    if (this.isProd && !this.isGuest(user.id)) {
      return this.fetchWithAuth(`/api/data/recipes/${recipeId}`, { method: 'DELETE' });
    }

    const key = this.getUserKey(user.id, BASE_STORAGE_KEYS.RECIPES);
    const current = JSON.parse(localStorage.getItem(key) || '[]');
    const updated = current.filter((r: SavedRecipe) => r.id !== recipeId);
    localStorage.setItem(key, JSON.stringify(updated));
  }

  // Shopping List
  async getShoppingList(): Promise<ShoppingItem[]> {
    const user = this.authService.user();
    if (!user) return [];

    if (this.isProd && !this.isGuest(user.id)) {
      return this.fetchWithAuth('/api/data/shopping');
    }

    const key = this.getUserKey(user.id, BASE_STORAGE_KEYS.SHOPPING);
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  }

  async saveShoppingList(items: ShoppingItem[]): Promise<ShoppingItem[]> {
    const user = this.authService.user();
    if (!user) throw new Error('No user');

    if (this.isProd && !this.isGuest(user.id)) {
      return this.fetchWithAuth('/api/data/shopping', {
        method: 'POST',
        body: JSON.stringify(items)
      });
    }

    const key = this.getUserKey(user.id, BASE_STORAGE_KEYS.SHOPPING);
    localStorage.setItem(key, JSON.stringify(items));
    return items;
  }

  // Active Plan
  async getActivePlanId(): Promise<string | null> {
    const user = this.authService.user();
    if (!user) return null;

    if (this.isProd && !this.isGuest(user.id)) {
      try {
        const res = await this.fetchWithAuth('/api/data/settings/activePlan');
        return res.activePlanId;
      } catch (e) {
        return null;
      }
    }

    const key = this.getUserKey(user.id, BASE_STORAGE_KEYS.ACTIVE_PLAN);
    return localStorage.getItem(key);
  }

  async saveActivePlanId(planId: string): Promise<void> {
    const user = this.authService.user();
    if (!user) return;

    if (this.isProd && !this.isGuest(user.id)) {
      return this.fetchWithAuth('/api/data/settings/activePlan', {
        method: 'POST',
        body: JSON.stringify({ planId })
      });
    }

    const key = this.getUserKey(user.id, BASE_STORAGE_KEYS.ACTIVE_PLAN);
    localStorage.setItem(key, planId);
  }
}
