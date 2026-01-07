import React, { useState, useEffect, useMemo, useCallback } from "react";
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
import { ChefMini } from "./components/ChefMini";
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
  LogOut,
  Loader2,
  ShoppingCart,
  X
} from "lucide-react";

import { generateShoppingList } from "./services/geminiService";
import { rateLimitStore } from "./lib/rateLimitStore";
import { LanguageSelector } from "./components/LanguageSelector";

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
  const [showShoppingList, setShowShoppingList] = useState(false);

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
      rateLimitStore.setUserId(null);
      return;
    }

    rateLimitStore.setUserId(user.id);

    const loadUserData = async () => {
      setIsLoadingData(true);
      try {
        const [
          loadedPlans,
          loadedEntries,
          loadedRecipes,
          loadedShopping,
          activeId,
          usageData,
        ] = await Promise.all([
          api.plans.list(user.id),
          api.meals.list(user.id),
          api.recipes.list(user.id),
          api.shopping.list(user.id),
          api.settings.getActivePlan(user.id),
          api.user.getUsage(user.id),
        ]);

        if (usageData) {
          rateLimitStore.updateFromServer(usageData);
        }

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

  const activeShoppingCount = useMemo(
    () => shoppingList.filter((i) => !i.completed).length,
    [shoppingList]
  );

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
  const handleSelectPlan = useCallback(
    async (id: string) => {
      setActivePlanId(id);
      setActiveTab(Tab.TRACKER);
      if (user) {
        await api.settings.saveActivePlan(user.id, id);
      }
    },
    [user],
  );

  // Memoized to prevent PlanEditor re-renders
  const handleSavePlan = useCallback(async (plan: DietPlan) => {
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
  }, [user, activePlanId, handleSelectPlan]);

  const handleDeletePlan = useCallback((id: string) => {
    setItemToDelete({ type: "plan", id });
  }, []);

  // Meal Handlers
  const handleAddEntry = useCallback(
    async (entryData: Omit<MealEntry, "id" | "timestamp">) => {
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
    },
    [user],
  );

  const handleDeleteEntry = React.useCallback((id: string) => {
    setItemToDelete({ type: "entry", id });
  }, []);

  // Recipe Handlers
  // Memoized to prevent ChefMini re-renders
  const handleSaveRecipe = useCallback(async (recipe: AiRecipeResponse) => {
    if (!user) return;
    const newRecipe: SavedRecipe = {
      ...recipe,
      id: crypto.randomUUID(),
      savedAt: Date.now(),
    };

    setSavedRecipes((prev) => [newRecipe, ...prev]);
    await api.recipes.save(user.id, newRecipe);
  }, [user]);

  const handleDeleteRecipe = useCallback((id: string) => {
    setItemToDelete({ type: "recipe", id });
  }, []);

  const handleLogRecipe = useCallback((recipe: SavedRecipe) => {
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
  }, [activePlanId, selectedDate, handleAddEntry]);

  // Shopping List Handlers
  const updateShoppingList = useCallback(async (newList: ShoppingItem[]) => {
    if (!user) return;
    setShoppingList(newList);
    await api.shopping.saveAll(user.id, newList);
  }, [user]);

  const handleAddToShoppingList = useCallback(async (ingredients: string[], preGeneratedList?: string[]) => {
    // 1. Get AI-cleaned list
    // Use preGeneratedList if available, otherwise call AI
    const aiIngredients = preGeneratedList ?? await generateShoppingList(ingredients, language);

    // 2. Merge using existing logic
    // Note: We use the callback form of setShoppingList to avoid dependency on shoppingList state
    // but here updateShoppingList updates state directly.
    // To properly fix this, we should look at how updateShoppingList works.
    // However, since updateShoppingList is async and calls API, let's keep it simple for now,
    // but we need to depend on shoppingList for the merge logic.
    // Wait, if we depend on shoppingList, the callback changes every time the list changes.
    // That's acceptable as we only want to prevent re-creation on other state changes.

    // Actually, to make it truly stable, we'd need to use functional updates,
    // but mergeShoppingList needs the current list.
    // So we will depend on shoppingList.
    // This still prevents re-renders when other things change (like date, input, etc).
    const newList = mergeShoppingList(shoppingList, aiIngredients);
    updateShoppingList(newList);
  }, [shoppingList, language, updateShoppingList]);

  const handleAddShoppingItem = useCallback((text: string) => {
    const newList = mergeShoppingList(shoppingList, [text]);
    updateShoppingList(newList);
  }, [shoppingList, updateShoppingList]);

  const handleToggleShoppingItem = useCallback((id: string) => {
    const newList = shoppingList.map((item) =>
      item.id === id ? { ...item, completed: !item.completed } : item,
    );
    updateShoppingList(newList);
  }, [shoppingList, updateShoppingList]);

  const handleDeleteShoppingItem = useCallback((id: string) => {
    const newList = shoppingList.filter((item) => item.id !== id);
    updateShoppingList(newList);
  }, [shoppingList, updateShoppingList]);

  const handleClearCompletedShopping = useCallback(() => {
    const newList = shoppingList.filter((item) => !item.completed);
    updateShoppingList(newList);
  }, [shoppingList, updateShoppingList]);

  const handleUpdateShoppingItem = useCallback(async (
    id: string,
    updates: Partial<ShoppingItem>,
  ) => {
    const updatedList = shoppingList.map((item) =>
      item.id === id ? { ...item, ...updates } : item,
    );
    setShoppingList(updatedList);
    await api.shopping.saveAll(user?.id || "guest", updatedList);
  }, [shoppingList, user]);

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

  const openNewPlan = useCallback(() => {
    setEditingPlan(undefined);
    setShowPlanEditor(true);
  }, []);

  const openEditPlan = useCallback((plan: DietPlan) => {
    setEditingPlan(plan);
    setShowPlanEditor(true);
  }, []);

  const toggleTheme = () =>
    setTheme((prev) => (prev === "light" ? "dark" : "light"));

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
                            src={user.avatar ?? `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name ?? "User")}`}
                            alt={user.name ?? "Profile"}
                            className="w-7 h-7 rounded-full object-cover"
                          />            </button>
            <LanguageSelector language={language} setLanguage={setLanguage} />
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
              onClick={() => setActiveTab(Tab.RECIPES)}
              className={`whitespace-nowrap flex-1 sm:flex-none px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                activeTab === Tab.RECIPES
                  ? "bg-white dark:bg-slate-600 text-indigo-600 dark:text-indigo-300 shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              }`}
            >
              {t.recipes_tab}
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
              src={user.avatar ?? `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(user.name ?? "User")}`}
              alt={user.name ?? "Profile"}
              className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-600 object-cover"
            />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300 hidden lg:inline">
              {user.name}
            </span>
          </button>
          <LanguageSelector language={language} setLanguage={setLanguage} />
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
      <RateLimitProgressBar lang={language} />
    </header>
  );

  const renderTracker = () => {
    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
        {/* Plans Carousel */}
        <div>
          <div className="flex justify-between items-center mb-4">
             <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                {t.diet_profiles}
             </h2>
          </div>
          
          <div className="flex overflow-x-auto pb-4 gap-4 snap-x hide-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
             {plans.map((plan) => (
                <div key={plan.id} className="min-w-[280px] sm:min-w-[320px] snap-center">
                   <PlanCard
                      plan={plan}
                      isActive={activePlanId === plan.id}
                      onSelect={handleSelectPlan}
                      onEdit={openEditPlan}
                      onDelete={handleDeletePlan}
                      lang={language}
                   />
                </div>
             ))}
             
             <button
                onClick={openNewPlan}
                className="min-w-[280px] sm:min-w-[320px] snap-center flex flex-col items-center justify-center gap-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 transition-all group p-6"
             >
                <div className="p-4 bg-white dark:bg-slate-800 rounded-full shadow-sm group-hover:scale-110 transition-transform">
                   <Plus className="w-6 h-6 text-indigo-500" />
                </div>
                <span className="font-medium text-slate-600 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                   {t.create_plan}
                </span>
             </button>
          </div>
          {plans.length === 0 && (
            <div className="mt-2 text-sm text-slate-500 dark:text-slate-400 text-center">
              {t.no_plans}
            </div>
          )}
        </div>

        {currentPlan ? (
          <div>
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
        ) : (
          <div className="text-center py-12 border-t border-slate-100 dark:border-slate-800">
            <h3 className="text-lg font-medium text-slate-800 dark:text-white mb-2">{t.no_active_plan}</h3>
            <p className="text-slate-500 dark:text-slate-400">{t.create_select_msg}</p>
          </div>
        )}
      </div>
    );
  };



  const renderRecipes = () => (
    <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-8">
      
      {/* ChefMini Section */}
      <div className="space-y-4">
         {currentPlan ? (
            <ChefMini 
              plan={currentPlan}
              remainingMacros={remainingMacros}
              onAdd={handleAddEntry}
              onSave={handleSaveRecipe}
              onAddToShoppingList={handleAddToShoppingList}
              dateStr={selectedDate}
              lang={language}
            />
         ) : (
            <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-center">
               <ChefHat className="w-10 h-10 text-slate-300 mx-auto mb-2" />
               <p className="text-slate-500 dark:text-slate-400">{t.create_select_msg}</p>
            </div>
         )}
      </div>

      {/* Shopping List Button */}
      <button
         onClick={() => setShowShoppingList(true)}
         className="w-full py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-400 rounded-2xl shadow-sm flex items-center justify-between px-6 transition-all group"
      >
         <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
               <ShoppingCart size={24} />
            </div>
            <div className="text-left">
               <h3 className="font-bold text-lg text-slate-800 dark:text-white">{t.shopping_list_title}</h3>
               <p className="text-slate-500 dark:text-slate-400 text-sm">
                  {activeShoppingCount} {t.shopping_list_desc}
               </p>
            </div>
         </div>
         <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
            <Plus size={16} />
         </div>
      </button>

      {/* Recipes List */}
      <div>
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
    </div>
  );

  return (
    <ToastProvider>
    <div className="min-h-screen pb-12 transition-colors duration-300">
      {renderHeader()}

      <main className="max-w-5xl mx-auto px-4 py-8">
        {activeTab === Tab.TRACKER && renderTracker()}
        {activeTab === Tab.RECIPES && renderRecipes()}
      </main>

      {/* Shopping List Modal */}
      {showShoppingList && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
             <div className="flex justify-end p-4 pb-0">
                <button
                   onClick={() => setShowShoppingList(false)}
                   className="p-2 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                >
                   <X size={24} />
                </button>
             </div>
             <div className="p-6 pt-0 overflow-y-auto">
                <ShoppingList
                  items={shoppingList}
                  onAdd={handleAddShoppingItem}
                  onToggle={handleToggleShoppingItem}
                  onDelete={handleDeleteShoppingItem}
                  onUpdate={handleUpdateShoppingItem}
                  onClearCompleted={handleClearCompletedShopping}
                  lang={language}
                />
             </div>
          </div>
        </div>
      )}

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
