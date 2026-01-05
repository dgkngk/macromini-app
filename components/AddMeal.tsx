import React, { useState } from 'react';
import { analyzeMeal } from '../services/geminiService';
import { MealEntry, Language, DietPlan, Macros } from '../types';
import { Loader2, Plus, Sparkles } from 'lucide-react';
import { TRANSLATIONS } from '../constants';

interface AddMealProps {
  planId: string;
  currentPlan: DietPlan;
  remainingMacros: Macros;
  onAdd: (entry: Omit<MealEntry, 'id' | 'timestamp'>) => void;
  dateStr: string;
  lang: Language;
}

// ⚡ Bolt: Wrapped in React.memo to prevent unnecessary re-renders when parent state changes
// (e.g. settings toggles) but props remain stable. This stabilizes the input field.
export const AddMeal: React.FC<AddMealProps> = React.memo(({ planId, currentPlan, remainingMacros, onAdd, dateStr, lang }) => {
  const [input, setInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const t = TRANSLATIONS[lang];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      const analysis = await analyzeMeal(input);
      
      onAdd({
        planId,
        date: dateStr,
        name: analysis.name || input,
        macros: {
          calories: analysis.calories,
          protein: analysis.protein,
          carbs: analysis.carbs,
          fat: analysis.fat,
          fiber: analysis.fiber,
          sugar: analysis.sugar,
        }
      });
      setInput('');
    } catch (err) {
      setError(t.analysis_error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6 mb-6 transition-colors">
      <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-indigo-500" />
        {t.log_meal}
      </h3>
      <div className="flex flex-col gap-4">
        <form onSubmit={handleSubmit} className="relative w-full">
          <div className="flex flex-col md:flex-row gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t.placeholder_meal}
              className="flex-1 px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400"
              disabled={isAnalyzing}
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={isAnalyzing || !input.trim()}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-w-[120px]"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="hidden sm:inline">{t.thinking}</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5" />
                    <span>{t.add_meal_btn}</span>
                  </>
                )}
              </button>
            </div>
          </div>
          {error && <p className="text-red-500 text-sm mt-2 absolute bottom-[-24px]">{error}</p>}
        </form>
        
        <div className="flex gap-2 flex-wrap text-xs text-slate-400 dark:text-slate-500">
          <span>{t.try_examples}</span>
        </div>
      </div>
    </div>
  );
});
