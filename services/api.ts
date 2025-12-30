import { DietPlan, MealEntry, SavedRecipe, ShoppingItem, User } from '../types';
import { BASE_STORAGE_KEYS } from '../constants';
import { auth } from '../lib/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  updateProfile,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';

// Fix: Property 'env' does not exist on type 'ImportMeta'
const IS_PROD = (import.meta as any).env?.PROD;

// Helper: Get Auth Token
const getAuthToken = async () => {
  const user = auth.currentUser;
  if (!user) return null;
  return await user.getIdToken();
};

// Helper: Fetch with Auth
const fetchWithAuth = async (endpoint: string, options: RequestInit = {}) => {
  const token = await getAuthToken();
  if (!token) throw new Error('Not authenticated');

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...options.headers,
  };

  const response = await fetch(endpoint, { ...options, headers });
  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }
  return response.json();
};


const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const getUserKey = (userId: string, key: string) => `user_${userId}_${key}`;

const mapFirebaseUser = (fbUser: FirebaseUser): User => ({
  id: fbUser.uid,
  email: fbUser.email || '',
  name: fbUser.displayName || fbUser.email?.split('@')[0] || 'User',
  avatar: fbUser.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(fbUser.displayName || fbUser.email?.split('@')[0] || 'U')}`
});

export const api = {
  auth: {
    onAuthStateChanged: (callback: (user: User | null) => void) => {
      return onAuthStateChanged(auth, (fbUser) => {
        if (fbUser) {
          callback(mapFirebaseUser(fbUser));
        } else {
          callback(null);
        }
      });
    },

    login: async (email: string, password: string): Promise<User> => {
      const result = await signInWithEmailAndPassword(auth, email, password);
      return mapFirebaseUser(result.user);
    },
    
    register: async (email: string, password: string, name: string): Promise<User> => {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(result.user, { displayName: name });
      return { ...mapFirebaseUser(result.user), name };
    },

    loginWithGoogle: async (): Promise<User> => {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      return mapFirebaseUser(result.user);
    },

    loginWithApple: async (): Promise<User> => {
       throw new Error("Apple Sign-In is not implemented yet, thank you for waiting.");
    },

    logout: async (): Promise<void> => {
      await signOut(auth);
    }
  },

  plans: {
    list: async (userId: string): Promise<DietPlan[]> => {
      if (IS_PROD) {
        return fetchWithAuth('/api/data/plans');
      }
      // LocalStorage Fallback
      await delay(300);
      const key = getUserKey(userId, BASE_STORAGE_KEYS.PLANS);
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    },

    save: async (userId: string, plan: DietPlan): Promise<DietPlan> => {
      if (IS_PROD) {
        return fetchWithAuth('/api/data/plans', {
          method: 'POST',
          body: JSON.stringify(plan)
        });
      }
      // LocalStorage Fallback
      await delay(200);
      const key = getUserKey(userId, BASE_STORAGE_KEYS.PLANS);
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
    },

    delete: async (userId: string, planId: string): Promise<void> => {
      if (IS_PROD) {
        return fetchWithAuth(`/api/data/plans/${planId}`, { method: 'DELETE' });
      }
      // LocalStorage Fallback
      await delay(200);
      const key = getUserKey(userId, BASE_STORAGE_KEYS.PLANS);
      const current = JSON.parse(localStorage.getItem(key) || '[]');
      const updated = current.filter((p: DietPlan) => p.id !== planId);
      localStorage.setItem(key, JSON.stringify(updated));
    }
  },

  meals: {
    list: async (userId: string): Promise<MealEntry[]> => {
      if (IS_PROD) {
        return fetchWithAuth('/api/data/meals');
      }
      await delay(300);
      const key = getUserKey(userId, BASE_STORAGE_KEYS.ENTRIES);
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    },

    add: async (userId: string, entry: MealEntry): Promise<MealEntry> => {
      if (IS_PROD) {
        return fetchWithAuth('/api/data/meals', {
          method: 'POST',
          body: JSON.stringify(entry)
        });
      }
      await delay(200);
      const key = getUserKey(userId, BASE_STORAGE_KEYS.ENTRIES);
      const current = JSON.parse(localStorage.getItem(key) || '[]');
      const updated = [entry, ...current];
      localStorage.setItem(key, JSON.stringify(updated));
      return entry;
    },

    delete: async (userId: string, entryId: string): Promise<void> => {
      if (IS_PROD) {
        return fetchWithAuth(`/api/data/meals/${entryId}`, { method: 'DELETE' });
      }
      await delay(200);
      const key = getUserKey(userId, BASE_STORAGE_KEYS.ENTRIES);
      const current = JSON.parse(localStorage.getItem(key) || '[]');
      const updated = current.filter((e: MealEntry) => e.id !== entryId);
      localStorage.setItem(key, JSON.stringify(updated));
    }
  },

  recipes: {
    list: async (userId: string): Promise<SavedRecipe[]> => {
      if (IS_PROD) {
        return fetchWithAuth('/api/data/recipes');
      }
      await delay(300);
      const key = getUserKey(userId, BASE_STORAGE_KEYS.RECIPES);
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    },

    save: async (userId: string, recipe: SavedRecipe): Promise<SavedRecipe> => {
      if (IS_PROD) {
        return fetchWithAuth('/api/data/recipes', {
          method: 'POST',
          body: JSON.stringify(recipe)
        });
      }
      await delay(200);
      const key = getUserKey(userId, BASE_STORAGE_KEYS.RECIPES);
      const current = JSON.parse(localStorage.getItem(key) || '[]');
      const updated = [recipe, ...current];
      localStorage.setItem(key, JSON.stringify(updated));
      return recipe;
    },

    delete: async (userId: string, recipeId: string): Promise<void> => {
      if (IS_PROD) {
        return fetchWithAuth(`/api/data/recipes/${recipeId}`, { method: 'DELETE' });
      }
      await delay(200);
      const key = getUserKey(userId, BASE_STORAGE_KEYS.RECIPES);
      const current = JSON.parse(localStorage.getItem(key) || '[]');
      const updated = current.filter((r: SavedRecipe) => r.id !== recipeId);
      localStorage.setItem(key, JSON.stringify(updated));
    }
  },

  shopping: {
    list: async (userId: string): Promise<ShoppingItem[]> => {
      if (IS_PROD) {
        return fetchWithAuth('/api/data/shopping');
      }
      await delay(300);
      const key = getUserKey(userId, BASE_STORAGE_KEYS.SHOPPING);
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    },

    saveAll: async (userId: string, items: ShoppingItem[]): Promise<ShoppingItem[]> => {
      if (IS_PROD) {
        return fetchWithAuth('/api/data/shopping', {
          method: 'POST',
          body: JSON.stringify(items)
        });
      }
      await delay(200);
      const key = getUserKey(userId, BASE_STORAGE_KEYS.SHOPPING);
      localStorage.setItem(key, JSON.stringify(items));
      return items;
    }
  },
  
  settings: {
    getActivePlan: async (userId: string): Promise<string | null> => {
      if (IS_PROD) {
        const res = await fetchWithAuth('/api/data/settings/activePlan');
        return res.activePlanId;
      }
      const key = getUserKey(userId, BASE_STORAGE_KEYS.ACTIVE_PLAN);
      return localStorage.getItem(key);
    },
    saveActivePlan: async (userId: string, planId: string): Promise<void> => {
      if (IS_PROD) {
        return fetchWithAuth('/api/data/settings/activePlan', {
          method: 'POST',
          body: JSON.stringify({ planId })
        });
      }
      const key = getUserKey(userId, BASE_STORAGE_KEYS.ACTIVE_PLAN);
      localStorage.setItem(key, planId);
    }
  },

  subscription: {
    createCheckoutSession: async (userId: string) => {
      if (IS_PROD) {
        return fetchWithAuth('/api/subscription/create-checkout-session', { method: 'POST', body: JSON.stringify({}) });
      }
      console.warn("Subscription not available in dev mode");
      throw new Error("Subscription not available in dev mode");
    },
    createCheckoutSessionOTP: async (userId: string) => {
      if (IS_PROD) {
        return fetchWithAuth('/api/subscription/create-checkout-session-otp', { method: 'POST', body: JSON.stringify({}) });
      }
      console.warn("OTP Checkout not available in dev mode");
      throw new Error("OTP Checkout not available in dev mode");
    },
    createPortalSession: async (userId: string) => {
      if (IS_PROD) {
        return fetchWithAuth('/api/subscription/portal', { method: 'POST', body: JSON.stringify({}) });
      }
      console.warn("Subscription portal not available in dev mode");
      throw new Error("Subscription portal not available in dev mode");
    },
    getProfile: async (userId: string): Promise<{ tier: number; subscriptionStatus: number }> => {
      if (IS_PROD) {
        return fetchWithAuth('/api/user/profile');
      }
      // Mock for dev
      return { tier: 0, subscriptionStatus: 0 };
    }
  },

  user: {
    getUsage: async (userId: string): Promise<{ limit: number; remaining: number; resetTime: number }> => {
      if (IS_PROD) {
        return fetchWithAuth('/api/user/usage');
      }
      // Mock for dev (will be overridden by rateLimitStore defaults or local storage)
      return { limit: 10, remaining: 10, resetTime: Date.now() };
    }
  }
};