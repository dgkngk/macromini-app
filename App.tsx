import React, { useState, useEffect, useMemo } from "react";
import { format } from "date-fns";
import {
  DietPlan,
  MealEntry,
  Macros,
  Tab,
  Language,
  SavedRecipe,
  AiRecipeResponse,
  ShoppingItem,
  User,
} from "./types";
import { DEFAULT_PLANS, BASE_STORAGE_KEYS, TRANSLATIONS } from "./constants";
import { api } from "./services/api";
import { PlanCard } from "./components/PlanCard";
import { MacroProgress } from "./components/MacroProgress";
import { AddMeal } from "./components/AddMeal";
import { MealLog } from "./components/MealLog";
import { PlanEditor } from "./components/PlanEditor";
import { RecipeModal } from "./components/RecipeModal";
import { ShoppingList } from "./components/ShoppingList";
import { ConfirmModal } from "./components/ConfirmModal";
import { RateLimitProgressBar } from "./components/RateLimitProgressBar";
import { Auth } from "./components/Auth";
import { SettingsModal } from "./components/SettingsModal";
import { LimitReachedModal } from "./components/LimitReachedModal";
import { ToastProvider } from "./components/Toast";
import { mergeShoppingList } from "./services/shoppingUtils";
import {
  Users,
  BookOpen,
  Plus,
  Moon,
  Sun,
  Trash2,
  Clock,
  Flame,
  ChefHat,
  ShoppingCart,
  Globe,
  LogOut,
  Loader2,
} from "lucide-react";

import { generateShoppingList } from "./services/geminiService";

const App: React.FC = () => {
  // --- Auth State ---
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // --- App State ---
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [plans, setPlans] = useState<DietPlan[]>([]);
  const [entries, setEntries] = useState<MealEntry[]>([]);
  const [savedRecipes, setSavedRecipes] = useState<SavedRecipe[]>([]);
  const [shoppingList, setShoppingList] = useState<ShoppingItem[]>([]);
  const [activePlanId, setActivePlanId] = useState<string>("");

  const [activeTab, setActiveTab] = useState<Tab>(Tab.TRACKER);
  const [showPlanEditor, setShowPlanEditor] = useState(false);
  const [editingPlan, setEditingPlan] = useState<DietPlan | undefined>(
    undefined,
  );
  const [selectedDate, setSelectedDate] = useState<string>(
    format(new Date(), "yyyy-MM-dd"),
  );
  const [viewingRecipe, setViewingRecipe] = useState<SavedRecipe | null>(null);
  const [itemToDelete, setItemToDelete] = useState<{
    type: "entry" | "plan" | "recipe";
    id: string;
  } | null>(null);

  // Settings & Modals
  const [showSettings, setShowSettings] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);

  // Settings
  const [theme, setTheme] = useState<"light" | "dark">("light");

  // Listen for Global Limit Reached Event
  useEffect(() => {
    const handleLimitReached = () => setShowLimitModal(true);
    window.addEventListener("limit-reached", handleLimitReached);
    return () => window.removeEventListener("limit-reached", handleLimitReached);
  }, []);

  // Add this helper function inside App component or outside
  const getInitialLanguage = (): Language => {
    // 1. Check Persistence
    const storedLang = localStorage.getItem(
      BASE_STORAGE_KEYS.LANG,
    ) as Language | null;
    if (storedLang) return storedLang;

    // 2. Check System Locale
    // navigator.language returns strings like 'en-US', 'fr-FR'. We just want the first part.
    const systemLang = navigator.language.split("-")[0] as Language;
    const supportedLanguages = Object.keys(TRANSLATIONS); // Get keys from your constants

    if (supportedLanguages.includes(systemLang)) {
      return systemLang;
    }

    // 3. Default Fallback
    return "en";
  };

  // Initialize state
  const [language, setLanguage] = useState<Language>(getInitialLanguage);

  // Helper for translations
  const t = TRANSLATIONS[language];

  // --- Initialization ---

  // 1. Load User Session & Global Settings
  useEffect(() => {
    // Global Settings (Theme/Lang remain in simple storage for now)
    const storedTheme = localStorage.getItem(BASE_STORAGE_KEYS.THEME) as
      | "light"
      | "dark"
      | null;
    if (storedTheme) setTheme(storedTheme);

    // Listen to Firebase Auth State
    const unsubscribe = api.auth.onAuthStateChanged((user) => {
      setUser(user);
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 2. Load User Data when User changes
  useEffect(() => {
    if (!user) {
      // Clear data when logged out
      setPlans([]);
      setEntries([]);
      setSavedRecipes([]);
      setShoppingList([]);
      setActivePlanId("");
      return;
    }

    const loadUserData = async () => {
      setIsLoadingData(true);
      try {
        const [
          loadedPlans,
          loadedEntries,
          loadedRecipes,
          loadedShopping,
          activeId,
        ] = await Promise.all([
          api.plans.list(user.id),
          api.meals.list(user.id),
          api.recipes.list(user.id),
          api.shopping.list(user.id),
          api.settings.getActivePlan(user.id),
        ]);

        if (loadedPlans.length === 0) {
          setPlans(DEFAULT_PLANS);
          // Optionally save defaults to backend immediately, or wait for user action
          // For now, we just show defaults. If user saves one, it gets persisted.
        } else {
          setPlans(loadedPlans);
        }

        setEntries(loadedEntries);
        setSavedRecipes(loadedRecipes);
        setShoppingList(loadedShopping);
        if (activeId) setActivePlanId(activeId);
      } catch (error) {
        console.error("Failed to load user data", error);
      } finally {
        setIsLoadingData(false);
      }
    };

    loadUserData();
  }, [user]);

  // Update DOM for theme
  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
      document.documentElement.style.colorScheme = "dark";
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.style.colorScheme = "light";
    }
    localStorage.setItem(BASE_STORAGE_KEYS.THEME, theme);
  }, [theme]);

  // Persist Lang
  useEffect(() => {
    localStorage.setItem(BASE_STORAGE_KEYS.LANG, language);
  }, [language]);

  // Ensure active plan is valid once plans are loaded
  useEffect(() => {
    if (plans.length > 0 && !plans.find((p) => p.id === activePlanId)) {
      handleSelectPlan(plans[0].id);
    }
  }, [plans, activePlanId]);

  // --- Computed Data ---
  const currentPlan = useMemo(
    () => plans.find((p) => p.id === activePlanId),
    [plans, activePlanId],
  );

  const dailyEntries = useMemo(() => {
    return entries.filter((e) => e.date === selectedDate);
  }, [entries, activePlanId, selectedDate]);

  const dailyTotals: Macros = useMemo(() => {
    return dailyEntries.reduce(
      (acc, entry) => ({
        calories: acc.calories + entry.macros.calories,
        protein: acc.protein + entry.macros.protein,
        carbs: acc.carbs + entry.macros.carbs,
        fat: acc.fat + entry.macros.fat,
        fiber: acc.fiber + entry.macros.fiber,
        sugar: acc.sugar + (entry.macros.sugar || 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0 },
    );
  }, [dailyEntries]);

  const remainingMacros: Macros = useMemo(() => {
    if (!currentPlan)
      return { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0 };
    return {
      calories: currentPlan.targets.calories - dailyTotals.calories,
      protein: currentPlan.targets.protein - dailyTotals.protein,
      carbs: currentPlan.targets.carbs - dailyTotals.carbs,
      fat: currentPlan.targets.fat - dailyTotals.fat,
      fiber: currentPlan.targets.fiber - dailyTotals.fiber,
      sugar: (currentPlan.targets.sugar || 0) - dailyTotals.sugar,
    };
  }, [currentPlan, dailyTotals]);

  // --- Handlers ---

  // Login handler is now just state update, actual logic is in Auth component calling api
  // But due to onAuthStateChanged, we actually don't need to manually setUser from child.
  // We keep it empty or remove it. We'll leave it empty to satisfy prop type if needed,
  // but better to let effect handle it.
  const handleLogin = (loggedInUser: User) => {
    // Optimistic update, but onAuthStateChanged is the source of truth
    setUser(loggedInUser);
  };

  const handleLogout = async () => {
    await api.auth.logout();
    setUser(null);
  };

  // Plan Handlers
  const handleSavePlan = async (plan: DietPlan) => {
    if (!user) return;
    try {
      const savedPlan = await api.plans.save(user.id, plan);
      setPlans((prev) => {
        const exists = prev.find((p) => p.id === savedPlan.id);
        if (exists) {
          return prev.map((p) => (p.id === savedPlan.id ? savedPlan : p));
        }
        return [...prev, savedPlan];
      });
      setShowPlanEditor(false);
      setEditingPlan(undefined);
      if (!activePlanId) handleSelectPlan(savedPlan.id);
    } catch (e) {
      console.error("Error saving plan", e);
    }
  };

  const handleDeletePlan = (id: string) => {
    setItemToDelete({ type: "plan", id });
  };

  const handleSelectPlan = async (id: string) => {
    setActivePlanId(id);
    setActiveTab(Tab.TRACKER);
    if (user) {
      await api.settings.saveActivePlan(user.id, id);
    }
  };

  // Meal Handlers
  const handleAddEntry = async (
    entryData: Omit<MealEntry, "id" | "timestamp">,
  ) => {
    if (!user) return;
    const newEntry: MealEntry = {
      ...entryData,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    };

    // Optimistic update
    setEntries((prev) => [newEntry, ...prev]);

    try {
      await api.meals.add(user.id, newEntry);
    } catch (e) {
      console.error("Error adding meal", e);
      // Revert if failed
      setEntries((prev) => prev.filter((e) => e.id !== newEntry.id));
    }
  };

  const handleDeleteEntry = (id: string) => {
    setItemToDelete({ type: "entry", id });
  };

  // Recipe Handlers
  const handleSaveRecipe = async (recipe: AiRecipeResponse) => {
    if (!user) return;
    const newRecipe: SavedRecipe = {
      ...recipe,
      id: crypto.randomUUID(),
      savedAt: Date.now(),
    };

    setSavedRecipes((prev) => [newRecipe, ...prev]);
    await api.recipes.save(user.id, newRecipe);
  };

  const handleDeleteRecipe = (id: string) => {
    setItemToDelete({ type: "recipe", id });
  };

  const handleLogRecipe = (recipe: SavedRecipe) => {
    if (!activePlanId) return;
    handleAddEntry({
      planId: activePlanId,
      date: selectedDate,
      name: `Cookbook: ${recipe.name}`,
      macros: {
        calories: recipe.calories,
        protein: recipe.protein,
        carbs: recipe.carbs,
        fat: recipe.fat,
        fiber: recipe.fiber,
        sugar: recipe.sugar,
      },
    });
    setViewingRecipe(null);
    setActiveTab(Tab.TRACKER);
  };

  // Shopping List Handlers
  const updateShoppingList = async (newList: ShoppingItem[]) => {
    if (!user) return;
    setShoppingList(newList);
    await api.shopping.saveAll(user.id, newList);
  };

  const handleAddToShoppingList = async (ingredients: string[]) => {
    // 1. Get AI-cleaned list
    // You might want to show a global loading indicator here if you wish,
    // but usually component-level loading (Phase 3) is better.
    const aiIngredients = await generateShoppingList(ingredients, language);

    // 2. Merge using existing logic
    const newList = mergeShoppingList(shoppingList, aiIngredients);
    updateShoppingList(newList);
  };

  const handleAddShoppingItem = (text: string) => {
    const newList = mergeShoppingList(shoppingList, [text]);
    updateShoppingList(newList);
  };

  const handleToggleShoppingItem = (id: string) => {
    const newList = shoppingList.map((item) =>
      item.id === id ? { ...item, completed: !item.completed } : item,
    );
    updateShoppingList(newList);
  };

  const handleDeleteShoppingItem = (id: string) => {
    const newList = shoppingList.filter((item) => item.id !== id);
    updateShoppingList(newList);
  };

  const handleClearCompletedShopping = () => {
    const newList = shoppingList.filter((item) => !item.completed);
    updateShoppingList(newList);
  };

  const handleUpdateShoppingItem = async (
    id: string,
    updates: Partial<ShoppingItem>,
  ) => {
    const updatedList = shoppingList.map((item) =>
      item.id === id ? { ...item, ...updates } : item,
    );
    setShoppingList(updatedList);
    await api.shopping.saveAll(user?.id || "guest", updatedList);
  };

  // Execution Handlers
  const executeDelete = async () => {
    if (!itemToDelete || !user) return;

    const { type, id } = itemToDelete;

    try {
      if (type === "entry") {
        setEntries((prev) => prev.filter((e) => e.id !== id));
        await api.meals.delete(user.id, id);
      } else if (type === "plan") {
        setPlans((prev) => prev.filter((p) => p.id !== id));
        await api.plans.delete(user.id, id);
        if (activePlanId === id) {
          handleSelectPlan("");
        }
      } else if (type === "recipe") {
        setSavedRecipes((prev) => prev.filter((r) => r.id !== id));
        await api.recipes.delete(user.id, id);
      }
    } catch (e) {
      console.error("Delete failed", e);
      // In a real app, we might reload data here to ensure sync
    }

    setItemToDelete(null);
  };

  const openNewPlan = () => {
    setEditingPlan(undefined);
    setShowPlanEditor(true);
  };

  const openEditPlan = (plan: DietPlan) => {
    setEditingPlan(plan);
    setShowPlanEditor(true);
  };

  const toggleTheme = () =>
    setTheme((prev) => (prev === "light" ? "dark" : "light"));

  const LanguageSelector = () => {
    const flagMapping: { [key in Language]: string } = {
      en: "🇺🇸",
      tr: "🇹🇷",
      de: "🇩🇪",
      fr: "🇫🇷",
      nl: "🇳🇱",
      es: "🇪🇸",
      pt: "🇵🇹",
      ru: "🇷🇺",
      zh: "🇨🇳",
    };

    return (
      <div className="relative group">
        <button className="flex items-center gap-2 px-3 py-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur rounded-lg shadow-sm hover:shadow-md transition-all text-slate-600 dark:text-slate-300">
          <Globe size={18} />
          <span className="uppercase text-sm font-bold">{language}</span>
        </button>

        {/* Dropdown Content */}
        <div className="absolute right-0 top-[10px] w-16 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden hidden group-hover:block focus-within:block">
          {Object.keys(TRANSLATIONS).map((l) => (
            <button
              key={l}
              onClick={() => setLanguage(l as Language)}
              className={`w-full flex items-center justify-between px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors ${
                language === l
                  ? "text-indigo-600 font-bold bg-indigo-50 dark:bg-indigo-900/20"
                  : "text-slate-600 dark:text-slate-300"
              }`}
            >
              <span>{l.toUpperCase()}</span>
              <span>{flagMapping[l as Language]}</span>
            </button>
          ))}
        </div>
      </div>
    );
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
      </div>
    );
  }

  // If not authenticated, show Auth Screen
  if (!user) {
    return <Auth onLogin={handleLogin} lang={language} setLang={setLanguage} />;
  }

  // --- Render Functions ---

  const renderHeader = () => (
    <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-30 transition-colors">
      <div className="max-w-5xl mx-auto px-4 py-2 sm:py-0 sm:h-16 flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-0">
        {/* Row 1 (Mobile): Logo & Settings Toggles */}
        <div className="w-full sm:w-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 text-white p-2 rounded-lg">
              <ChefHat size={20} />
            </div>
            <h1 className="font-bold text-xl text-slate-800 dark:text-white tracking-tight">
              MacroMini
            </h1>
            {isLoadingData && (
              <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
            )}
          </div>

          <div className="sm:hidden flex items-center gap-2">
            <button
              onClick={() => setShowSettings(true)}
              className="p-1 rounded-full border border-slate-200 dark:border-slate-700"
            >
                          <img
                            src={user.avatar ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name ?? "User")}`}
                            alt={user.name ?? "Profile"}
                            className="w-7 h-7 rounded-full object-cover"
                          />            </button>
            <LanguageSelector />
            <button
              onClick={toggleTheme}
              className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
            >
              {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
            </button>
            <button
              onClick={handleLogout}
              className="p-2 text-slate-500 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 rounded-lg"
              title={t.logout}
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>

        {/* Row 2 (Mobile): Tabs */}
        <div className="w-full sm:w-auto flex justify-center">
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700 p-1 rounded-lg w-full sm:w-auto justify-center overflow-x-auto">
            <button
              onClick={() => setActiveTab(Tab.TRACKER)}
              className={`whitespace-nowrap flex-1 sm:flex-none px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                activeTab === Tab.TRACKER
                  ? "bg-white dark:bg-slate-600 text-indigo-600 dark:text-indigo-300 shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              }`}
            >
              {t.tracker_tab}
            </button>
            <button
              onClick={() => setActiveTab(Tab.PLANS)}
              className={`whitespace-nowrap flex-1 sm:flex-none px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                activeTab === Tab.PLANS
                  ? "bg-white dark:bg-slate-600 text-indigo-600 dark:text-indigo-300 shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              }`}
            >
              {t.profiles_tab}
            </button>
            <button
              onClick={() => setActiveTab(Tab.RECIPES)}
              className={`whitespace-nowrap flex-1 sm:flex-none px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                activeTab === Tab.RECIPES
                  ? "bg-white dark:bg-slate-600 text-indigo-600 dark:text-indigo-300 shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              }`}
            >
              {t.recipes_tab}
            </button>
            <button
              onClick={() => setActiveTab(Tab.SHOPPING)}
              className={`whitespace-nowrap flex-1 sm:flex-none px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                activeTab === Tab.SHOPPING
                  ? "bg-white dark:bg-slate-600 text-indigo-600 dark:text-indigo-300 shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              }`}
            >
              {t.shopping_tab}
            </button>
          </div>
        </div>

        {/* Desktop Toggles */}
        <div className="hidden sm:flex items-center border-l border-slate-200 dark:border-slate-600 pl-3 gap-2">
          <button 
            onClick={() => setShowSettings(true)}
            className="flex items-center gap-2 mr-2 hover:bg-slate-100 dark:hover:bg-slate-700 py-1 px-2 rounded-lg transition-colors"
          >
            <img
              src={user.avatar ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name ?? "User")}`}
              alt={user.name ?? "Profile"}
              className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-600 object-cover"
            />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300 hidden lg:inline">
              {user.name}
            </span>
          </button>
          <LanguageSelector />
          <button
            onClick={toggleTheme}
            className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
          >
            {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
          </button>
          <button
            onClick={handleLogout}
            className="p-2 text-slate-500 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 rounded-lg"
            title={t.logout}
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
      <RateLimitProgressBar />
    </header>
  );

  const renderTracker = () => {
    if (!currentPlan)
      return (
        <div className="text-center py-20">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
            {t.no_active_plan}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mb-6">
            {t.create_select_msg}
          </p>
          <button
            onClick={() => setActiveTab(Tab.PLANS)}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            {t.go_to_plans}
          </button>
        </div>
      );

    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
              {t.todays_overview}
            </h2>
            <p className="text-slate-500 dark:text-slate-400">
              {t.tracking_for}{" "}
              <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                {currentPlan.name}
              </span>
            </p>
          </div>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            style={{ colorScheme: theme }}
            className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-300 text-sm focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <MacroProgress
              current={dailyTotals}
              target={currentPlan.targets}
              theme={currentPlan.colorTheme}
              lang={language}
            />
          </div>

          <div className="lg:col-span-2">
            <AddMeal
              planId={currentPlan.id}
              currentPlan={currentPlan}
              remainingMacros={remainingMacros}
              onAdd={handleAddEntry}
              onSaveRecipe={handleSaveRecipe}
              onAddToShoppingList={handleAddToShoppingList}
              dateStr={selectedDate}
              lang={language}
            />
            <MealLog
              entries={dailyEntries}
              onDelete={handleDeleteEntry}
              lang={language}
            />
          </div>
        </div>
      </div>
    );
  };

  const renderPlans = () => (
    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
            {t.diet_profiles}
          </h2>
          <p className="text-slate-500 dark:text-slate-400">
            {t.manage_profiles}
          </p>
        </div>
        <button
          onClick={openNewPlan}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium shadow-sm"
        >
          <Plus size={18} />
          {t.create_plan}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            isActive={activePlanId === plan.id}
            onSelect={handleSelectPlan}
            onEdit={openEditPlan}
            onDelete={handleDeletePlan}
            lang={language}
          />
        ))}

        {plans.length === 0 && (
          <div className="col-span-full py-12 text-center bg-white dark:bg-slate-800 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700">
            <Users className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <p className="text-slate-500 dark:text-slate-400">{t.no_plans}</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderRecipes = () => (
    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
          {t.cookbook_title}
        </h2>
        <p className="text-slate-500 dark:text-slate-400">{t.cookbook_desc}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {savedRecipes.map((recipe) => (
          <div
            key={recipe.id}
            onClick={() => setViewingRecipe(recipe)}
            className="group bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden cursor-pointer hover:shadow-lg transition-all hover:border-indigo-200 dark:hover:border-slate-600"
          >
            <div className="p-5">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-lg text-slate-800 dark:text-white line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {recipe.name}
                </h3>
              </div>

              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 line-clamp-2 h-10">
                {recipe.description}
              </p>

              <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mb-4">
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-md">
                  <Clock size={12} />
                  {recipe.cookingTime}
                </div>
                <div className="flex items-center gap-1 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 px-2 py-1 rounded-md">
                  <Flame size={12} />
                  {recipe.calories}
                </div>
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-slate-100 dark:border-slate-700">
                <span className="text-xs text-slate-400">
                  {format(recipe.savedAt, "MMM d, yyyy")}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteRecipe(recipe.id);
                  }}
                  className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  title={t.delete_recipe}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}

        {savedRecipes.length === 0 && (
          <div className="col-span-full py-16 text-center bg-white dark:bg-slate-800 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700">
            <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <p className="text-slate-500 dark:text-slate-400 font-medium">
              {t.no_recipes}
            </p>
            <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">
              {t.no_recipes_hint}
            </p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <ToastProvider>
    <div className="min-h-screen pb-12 transition-colors duration-300">
      {renderHeader()}

      <main className="max-w-5xl mx-auto px-4 py-8">
        {activeTab === Tab.TRACKER && renderTracker()}
        {activeTab === Tab.PLANS && renderPlans()}
        {activeTab === Tab.RECIPES && renderRecipes()}
        {activeTab === Tab.SHOPPING && (
          <ShoppingList
            items={shoppingList}
            onAdd={handleAddShoppingItem}
            onToggle={handleToggleShoppingItem}
            onDelete={handleDeleteShoppingItem}
            onUpdate={handleUpdateShoppingItem}
            onClearCompleted={handleClearCompletedShopping}
            lang={language}
          />
        )}
      </main>

      {showPlanEditor && (
        <PlanEditor
          initialPlan={editingPlan}
          onSave={handleSavePlan}
          onCancel={() => {
            setShowPlanEditor(false);
            setEditingPlan(undefined);
          }}
          lang={language}
        />
      )}

      {viewingRecipe && (
        <RecipeModal
          recipe={viewingRecipe}
          onClose={() => setViewingRecipe(null)}
          onLogMeal={handleLogRecipe}
          onAddToShoppingList={handleAddToShoppingList}
          lang={language}
        />
      )}

      {itemToDelete && (
        <ConfirmModal
          title={t.confirm_delete_title}
          message={
            itemToDelete.type === "plan"
              ? t.delete_confirm
              : itemToDelete.type === "entry"
                ? t.delete_entry_confirm
                : t.delete_recipe_confirm
          }
          onConfirm={executeDelete}
          onCancel={() => setItemToDelete(null)}
          lang={language}
        />
      )}

      {showSettings && user && (
        <SettingsModal
          user={user}
          onClose={() => setShowSettings(false)}
          lang={language}
        />
      )}

      {showLimitModal && (
        <LimitReachedModal
          user={user}
          onClose={() => setShowLimitModal(false)}
        />
      )}
    </div>
    </ToastProvider>
  );
};

export default App;
