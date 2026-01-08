import React, { useState } from 'react';
import { SavedRecipe, Language } from '../types';
import { X, Clock, Flame, Plus, ShoppingCart, Check, Loader2 } from 'lucide-react';
import { TRANSLATIONS } from '../constants';

interface RecipeModalProps {
  recipe: SavedRecipe;
  onClose: () => void;
  onLogMeal: (recipe: SavedRecipe) => void;
  onAddToShoppingList: (ingredients: string[], preGeneratedList?: string[]) => Promise<void>;
  lang: Language;
}

// Optimized: Wrapped in React.memo to prevent re-renders when parent state changes but props remain stable.
export const RecipeModal: React.NamedExoticComponent<RecipeModalProps> = React.memo(({ recipe, onClose, onLogMeal, onAddToShoppingList, lang }) => {
  const [addedToShopping, setAddedToShopping] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const t = TRANSLATIONS[lang];

  const handleAddToShopping = async () => {
    if (addedToShopping || isLoading) return;
    
    setIsLoading(true);
    try {
      await onAddToShoppingList(recipe.ingredients, recipe.shoppingList);
      setAddedToShopping(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/10 dark:to-blue-900/10">
          <h3 className="text-xl font-bold text-slate-800 dark:text-white">{recipe.name}</h3>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full text-slate-500 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
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
                  disabled={addedToShopping || isLoading}
                  className={`text-xs flex items-center gap-1 px-2 py-1 rounded transition-colors ${
                    addedToShopping 
                      ? 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' 
                      : 'text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30'
                  }`}
                >
                  {isLoading ? <Loader2 size={12} className="animate-spin" /> : (addedToShopping ? <Check size={12} /> : <ShoppingCart size={12} />)}
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
                  {t.daily_targets}
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

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex justify-end gap-3">
          <button 
            onClick={onClose} 
            className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg font-medium transition-colors"
          >
            {t.cancel}
          </button>
          <button 
            onClick={() => onLogMeal(recipe)} 
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-md hover:shadow-indigo-500/25 transition-all flex items-center gap-2"
          >
            <Plus size={18} />
            {t.log_this_meal}
          </button>
        </div>
      </div>
    </div>
  );
});
