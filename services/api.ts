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

// Simulate network delay for realistic async behavior for data operations
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const getUserKey = (userId: string, key: string) => `user_${userId}_${key}`;

// Helper to transform Firebase user to our App user type
const mapFirebaseUser = (fbUser: FirebaseUser): User => ({
  id: fbUser.uid,
  email: fbUser.email || '',
  name: fbUser.displayName || fbUser.email?.split('@')[0] || 'User',
  avatar: fbUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(fbUser.email || 'U')}&background=random`
});

export const api = {
  auth: {
    // Listen for auth state changes
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
      // Update display name immediately after registration
      await updateProfile(result.user, { displayName: name });
      
      // Force token refresh to ensure display name is available or manually map it
      return {
        ...mapFirebaseUser(result.user),
        name: name // Explicitly set name since updateProfile might not reflect instantly in the result object
      };
    },

    loginWithGoogle: async (): Promise<User> => {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      return mapFirebaseUser(result.user);
    },

    loginWithApple: async (): Promise<User> => {
       // Note: Apple Auth requires a paid Apple Developer account and specific domain verification in Firebase Console.
       // For this phase, we'll throw a placeholder error if not configured, or you can implement OAuthProvider('apple.com')
       throw new Error("Apple Sign-In requires domain verification. Please use Google or Email for Phase 2 testing.");
    },

    logout: async (): Promise<void> => {
      await signOut(auth);
      localStorage.removeItem(BASE_STORAGE_KEYS.CURRENT_USER);
    }
  },

  plans: {
    list: async (userId: string): Promise<DietPlan[]> => {
      await delay(300);
      const key = getUserKey(userId, BASE_STORAGE_KEYS.PLANS);
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    },

    save: async (userId: string, plan: DietPlan): Promise<DietPlan> => {
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
      await delay(200);
      const key = getUserKey(userId, BASE_STORAGE_KEYS.PLANS);
      const current = JSON.parse(localStorage.getItem(key) || '[]');
      const updated = current.filter((p: DietPlan) => p.id !== planId);
      localStorage.setItem(key, JSON.stringify(updated));
    }
  },

  meals: {
    list: async (userId: string): Promise<MealEntry[]> => {
      await delay(300);
      const key = getUserKey(userId, BASE_STORAGE_KEYS.ENTRIES);
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    },

    add: async (userId: string, entry: MealEntry): Promise<MealEntry> => {
      await delay(200);
      const key = getUserKey(userId, BASE_STORAGE_KEYS.ENTRIES);
      const current = JSON.parse(localStorage.getItem(key) || '[]');
      const updated = [entry, ...current];
      localStorage.setItem(key, JSON.stringify(updated));
      return entry;
    },

    delete: async (userId: string, entryId: string): Promise<void> => {
      await delay(200);
      const key = getUserKey(userId, BASE_STORAGE_KEYS.ENTRIES);
      const current = JSON.parse(localStorage.getItem(key) || '[]');
      const updated = current.filter((e: MealEntry) => e.id !== entryId);
      localStorage.setItem(key, JSON.stringify(updated));
    }
  },

  recipes: {
    list: async (userId: string): Promise<SavedRecipe[]> => {
      await delay(300);
      const key = getUserKey(userId, BASE_STORAGE_KEYS.RECIPES);
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    },

    save: async (userId: string, recipe: SavedRecipe): Promise<SavedRecipe> => {
      await delay(200);
      const key = getUserKey(userId, BASE_STORAGE_KEYS.RECIPES);
      const current = JSON.parse(localStorage.getItem(key) || '[]');
      const updated = [recipe, ...current];
      localStorage.setItem(key, JSON.stringify(updated));
      return recipe;
    },

    delete: async (userId: string, recipeId: string): Promise<void> => {
      await delay(200);
      const key = getUserKey(userId, BASE_STORAGE_KEYS.RECIPES);
      const current = JSON.parse(localStorage.getItem(key) || '[]');
      const updated = current.filter((r: SavedRecipe) => r.id !== recipeId);
      localStorage.setItem(key, JSON.stringify(updated));
    }
  },

  shopping: {
    list: async (userId: string): Promise<ShoppingItem[]> => {
      await delay(300);
      const key = getUserKey(userId, BASE_STORAGE_KEYS.SHOPPING);
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    },

    saveAll: async (userId: string, items: ShoppingItem[]): Promise<ShoppingItem[]> => {
      await delay(200);
      const key = getUserKey(userId, BASE_STORAGE_KEYS.SHOPPING);
      localStorage.setItem(key, JSON.stringify(items));
      return items;
    }
  },
  
  settings: {
    getActivePlan: async (userId: string): Promise<string | null> => {
       const key = getUserKey(userId, BASE_STORAGE_KEYS.ACTIVE_PLAN);
       return localStorage.getItem(key);
    },
    saveActivePlan: async (userId: string, planId: string): Promise<void> => {
       const key = getUserKey(userId, BASE_STORAGE_KEYS.ACTIVE_PLAN);
       localStorage.setItem(key, planId);
    }
  }
};