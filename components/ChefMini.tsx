import React, { useState } from 'react';
import { ChefHat, Loader2, Clock, Flame, Plus, Bookmark, Check, MessageSquarePlus, ShoppingCart } from 'lucide-react';
import { DietPlan, Language, Macros, MealEntry, AiRecipeResponse } from '../types';
import { TRANSLATIONS } from '../constants';
import { generateAiRecipe } from '../services/geminiService';

interface ChefMiniProps {
  plan: DietPlan;
  remainingMacros: Macros;
  onAdd: (entry: Omit<MealEntry, 'id' | 'timestamp'>) => Promise<void> | void;
  onSave: (recipe: AiRecipeResponse) => void;
  onAddToShoppingList: (ingredients: string[], preGeneratedList?: string[]) => Promise<void>;
  dateStr: string;
  lang: Language;
}

export const ChefMini: React.FC<ChefMiniProps> = ({ plan, remainingMacros, onAdd, onSave, onAddToShoppingList, dateStr, lang }) => {
  const [sliderValue, setSliderValue] = useState(50); // percentage
  const [userPrompt, setUserPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [recipe, setRecipe] = useState<AiRecipeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [addedToShopping, setAddedToShopping] = useState(false);
  const [shoppingLoading, setShoppingLoading] = useState(false);

  const t = TRANSLATIONS[lang];
  const remainingCalories = Math.max(0, remainingMacros.calories);
  const targetCalories = Math.round((remainingCalories * sliderValue) / 100);

  const handleGenerate = async () => {
    if (targetCalories <= 0) return;

    setLoading(true);
    setError(null);
    setRecipe(null);
    setIsSaved(false);
    setAddedToShopping(false);

    try {
      const result = await generateAiRecipe(plan, remainingMacros, targetCalories, lang, userPrompt);
      setRecipe(result);
    } catch (err) {
      setError(t.chef_error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddRecipe = async () => {
    if (!recipe) return;

    await onAdd({
      planId: plan.id,
      date: dateStr,
      name: `ChefMini: ${recipe.name}`,
      macros: {
        calories: recipe.calories,
        protein: recipe.protein,
        carbs: recipe.carbs,
        fat: recipe.fat,
        fiber: recipe.fiber,
        sugar: recipe.sugar
      }
    });
    setRecipe(null);
    setUserPrompt('');
  };

  const handleSave = () => {
    if (!recipe || isSaved) return;
    onSave(recipe);
    setIsSaved(true);
  };

  const handleAddToShopping = async () => {
    if (!recipe || addedToShopping || shoppingLoading) return;

    setShoppingLoading(true);
    try {
      await onAddToShoppingList(recipe.ingredients, recipe.shoppingList);
      setAddedToShopping(true);
    } finally {
      setShoppingLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 w-full overflow-hidden flex flex-col">
      
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/10 dark:to-amber-900/10">
        <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
          <ChefHat className="w-6 h-6" />
          <h3 className="text-xl font-bold">{t.chef_mini_title}</h3>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 overflow-y-auto flex-1">
        
        {!recipe && (
          <div className="space-y-8">
            <div className="text-center space-y-2">
                <p className="text-lg text-slate-700 dark:text-slate-300 font-medium">{t.chef_intro}</p>
                {remainingCalories === 0 && (
                  <p className="text-sm text-red-500 font-medium">{t.chef_no_remaining}</p>
                )}
            </div>

            <div className="space-y-6">
              {/* Calorie Slider */}
              <div className="space-y-3">
                <div className="flex justify-between items-end">
                  <label className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t.chef_target_calories}</label>
                  <div className="text-3xl font-bold text-orange-500 flex items-baseline gap-1">
                    {targetCalories}
                    <span className="text-sm font-normal text-slate-400">kcal</span>
                  </div>
                </div>
                
                <input 
                  type="range" 
                  min="10" 
                  max="100" 
                  value={sliderValue} 
                  onChange={(e) => setSliderValue(Number(e.target.value))}
                  disabled={remainingCalories === 0}
                  className="w-full h-3 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
                />
                
                <div className="flex justify-between text-xs text-slate-400">
                    <span>10% ({Math.round(remainingCalories * 0.1)} kcal)</span>
                    <span>100% ({remainingCalories} kcal)</span>
                </div>
              </div>

              {/* User Prompt Input */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <MessageSquarePlus className="w-4 h-4" />
                  {t.chef_prompt_label}
                </label>
                <textarea
                  value={userPrompt}
                  onChange={(e) => setUserPrompt(e.target.value)}
                  placeholder={t.chef_prompt_placeholder}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none resize-none transition-all placeholder:text-slate-400"
                  rows={2}
                />
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={loading || remainingCalories === 0}
              className="w-full py-4 bg-orange-500 hover:bg-orange-600 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-orange-500/25 transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin w-5 h-5" />
                  {t.chef_generating}
                </>
              ) : (
                <>
                    <Flame className="w-5 h-5" />
                    {t.chef_generate}
                </>
              )}
            </button>
            
            {error && (
              <p className="text-center text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-100 dark:border-red-900/50">
                {error}
              </p>
            )}
          </div>
        )}

        {recipe && (
          <div className="animate-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">{recipe.name}</h2>
            <p className="text-slate-600 dark:text-slate-300 italic mb-4">{recipe.description}</p>
            
            <div className="flex flex-wrap gap-4 mb-6">
              <div className="flex items-center gap-1.5 text-sm font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700/50 px-3 py-1.5 rounded-lg">
                <Clock size={16} />
                {recipe.cookingTime}
              </div>
              <div className="flex items-center gap-1.5 text-sm font-medium text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 px-3 py-1.5 rounded-lg">
                <Flame size={16} />
                {recipe.calories} kcal
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div className="bg-slate-50 dark:bg-slate-700/30 p-4 rounded-xl">
                <div className="flex justify-between items-center mb-3">
                    <h4 className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    {t.chef_ingredients}
                  </h4>
                  <button 
                    onClick={handleAddToShopping}
                    disabled={addedToShopping || shoppingLoading}
                    className={`text-xs flex items-center gap-1 px-2 py-1 rounded transition-colors ${
                      addedToShopping 
                        ? 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' 
                        : 'text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30'
                    }`}
                  >
                    {shoppingLoading ? <Loader2 size={12} className="animate-spin" /> : (addedToShopping ? <Check size={12} /> : <ShoppingCart size={12} />)}
                    {addedToShopping ? t.added_to_shopping : t.add_to_shopping}
                  </button>
                </div>
                <ul className="list-disc list-inside space-y-1 text-sm text-slate-600 dark:text-slate-300">
                  {recipe.ingredients.map((ing, i) => (
                    <li key={i}>{ing}</li>
                  ))}
                </ul>
              </div>
              <div className="bg-slate-50 dark:bg-slate-700/30 p-4 rounded-xl">
                  <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-3">
                    {t.daily_targets} ({t.remaining_cals})
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">{t.protein}</span>
                      <span className="font-medium text-slate-700 dark:text-slate-300">{recipe.protein}g</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">{t.carbs}</span>
                      <span className="font-medium text-slate-700 dark:text-slate-300">{recipe.carbs}g</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">{t.fats}</span>
                      <span className="font-medium text-slate-700 dark:text-slate-300">{recipe.fat}g</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">{t.sugar}</span>
                      <span className="font-medium text-slate-700 dark:text-slate-300">{recipe.sugar}g</span>
                    </div>
                  </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-3">{t.chef_instructions}</h4>
              <ol className="space-y-3">
                {recipe.instructions.map((step, i) => (
                  <li key={i} className="flex gap-3 text-sm text-slate-600 dark:text-slate-300">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs">
                      {i + 1}
                    </span>
                    <span className="mt-0.5">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      {recipe && (
        <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex justify-end gap-3 flex-wrap">
            <button 
            onClick={() => setRecipe(null)} 
            className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg font-medium transition-colors"
            >
              {t.cancel}
            </button>
            <button 
              onClick={handleSave}
              disabled={isSaved}
              className={`px-4 py-2 border font-medium rounded-lg transition-colors flex items-center gap-2 ${
                isSaved 
                ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 text-emerald-600 dark:text-emerald-400' 
                : 'border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              {isSaved ? <Check size={18} /> : <Bookmark size={18} />}
              {isSaved ? t.recipe_saved : t.save_recipe}
            </button>
            <button 
            onClick={handleAddRecipe} 
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-md hover:shadow-indigo-500/25 transition-all flex items-center gap-2"
            >
              <Plus size={18} />
              {t.chef_add_to_log}
            </button>
        </div>
      )}
    </div>
  );
};