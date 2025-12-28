import React from 'react';
import { MealEntry, Language } from '../types';
import { Trash2 } from 'lucide-react';
import { TRANSLATIONS } from '../constants';

interface MealLogProps {
  entries: MealEntry[];
  onDelete: (id: string) => void;
  lang: Language;
}

export const MealLog: React.FC<MealLogProps> = React.memo(({ entries, onDelete, lang }) => {
  const t = TRANSLATIONS[lang];

  if (entries.length === 0) {
    return (
      <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 transition-colors">
        <div className="text-slate-300 dark:text-slate-600 text-6xl mb-4">🍽️</div>
        <p className="text-slate-500 dark:text-slate-400 font-medium">{t.meal_log_empty_msg}</p>
        <p className="text-slate-400 dark:text-slate-500 text-sm">{t.meal_log_empty_hint}</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden transition-colors">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-700/50 text-slate-600 dark:text-slate-400 text-xs uppercase tracking-wider">
              <th className="p-4 font-semibold rounded-tl-2xl">{t.meal_col}</th>
              <th className="p-4 font-semibold text-right">{t.cals_col}</th>
              <th className="p-4 font-semibold text-right hidden sm:table-cell">{t.prot_col}</th>
              <th className="p-4 font-semibold text-right hidden sm:table-cell">{t.carbs_col}</th>
              <th className="p-4 font-semibold text-right hidden sm:table-cell">{t.fat_col}</th>
              <th className="p-4 font-semibold text-right hidden sm:table-cell">{t.fiber_col}</th>
              <th className="p-4 font-semibold text-right hidden sm:table-cell">{t.sugar_col}</th>
              <th className="p-4 font-semibold text-right rounded-tr-2xl w-[50px]"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
            {entries.map((entry) => (
              <tr key={entry.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors group">
                <td className="p-4">
                  <div className="font-medium text-slate-800 dark:text-slate-200">{entry.name}</div>
                  {/* Mobile View Summary */}
                  <div className="sm:hidden text-xs text-slate-400 mt-1 flex gap-2">
                    <span>{Math.round(entry.macros.protein)}g P</span>
                    <span>{Math.round(entry.macros.carbs)}g C</span>
                    <span>{Math.round(entry.macros.fat)}g F</span>
                  </div>
                </td>
                <td className="p-4 text-right font-medium text-slate-700 dark:text-slate-300">{Math.round(entry.macros.calories)}</td>
                <td className="p-4 text-right hidden sm:table-cell text-slate-600 dark:text-slate-400">{Math.round(entry.macros.protein)}g</td>
                <td className="p-4 text-right hidden sm:table-cell text-slate-600 dark:text-slate-400">{Math.round(entry.macros.carbs)}g</td>
                <td className="p-4 text-right hidden sm:table-cell text-slate-600 dark:text-slate-400">{Math.round(entry.macros.fat)}g</td>
                <td className="p-4 text-right hidden sm:table-cell text-slate-600 dark:text-slate-400">{Math.round(entry.macros.fiber)}g</td>
                <td className="p-4 text-right hidden sm:table-cell text-slate-600 dark:text-slate-400">{Math.round(entry.macros.sugar || 0)}g</td>
                <td className="p-4 text-right">
                  <button
                    onClick={() => onDelete(entry.id)}
                    className="p-2 text-slate-400 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400 transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100"
                    title={t.delete_entry_confirm}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
});