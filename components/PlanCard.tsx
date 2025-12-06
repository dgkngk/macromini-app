import React from 'react';
import { DietPlan, Language } from '../types';
import { Settings, Check, Trash2 } from 'lucide-react';
import { TRANSLATIONS } from '../constants';

interface PlanCardProps {
  plan: DietPlan;
  isActive: boolean;
  onSelect: (id: string) => void;
  onEdit: (plan: DietPlan) => void;
  onDelete: (id: string) => void;
  lang: Language;
}

export const PlanCard: React.FC<PlanCardProps> = ({ plan, isActive, onSelect, onEdit, onDelete, lang }) => {
  const t = TRANSLATIONS[lang];

  const getThemeColors = (theme: string) => {
    switch(theme) {
      case 'green': return 'bg-emerald-50 border-emerald-200 text-emerald-900 dark:bg-emerald-900/20 dark:border-emerald-700/50 dark:text-emerald-100';
      case 'orange': return 'bg-orange-50 border-orange-200 text-orange-900 dark:bg-orange-900/20 dark:border-orange-700/50 dark:text-orange-100';
      default: return 'bg-blue-50 border-blue-200 text-blue-900 dark:bg-blue-900/20 dark:border-blue-700/50 dark:text-blue-100';
    }
  };

  const getBadgeColor = (theme: string) => {
    switch(theme) {
      case 'green': return 'bg-emerald-500';
      case 'orange': return 'bg-orange-500';
      default: return 'bg-blue-500';
    }
  };

  return (
    <div 
      className={`relative p-4 rounded-xl border-2 transition-all cursor-pointer ${
        isActive 
          ? `${getThemeColors(plan.colorTheme).replace('bg-', 'bg-white dark:bg-slate-800 ')} border-opacity-100 shadow-md`
          : 'bg-white dark:bg-slate-800 border-gray-100 dark:border-slate-700 hover:border-gray-200 dark:hover:border-slate-600 text-gray-600 dark:text-slate-300'
      }`}
      onClick={() => onSelect(plan.id)}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${getBadgeColor(plan.colorTheme)}`} />
          <h3 className="font-bold text-lg">{plan.name}</h3>
        </div>
        {isActive && <Check className={`w-5 h-5 ${plan.colorTheme === 'orange' ? 'text-orange-600' : plan.colorTheme === 'green' ? 'text-emerald-600' : 'text-blue-600'}`} />}
      </div>
      
      <p className="text-sm opacity-80 mb-4 line-clamp-2 min-h-[2.5em]">{plan.description}</p>
      
      <div className="grid grid-cols-2 gap-2 text-xs opacity-70 mb-4">
        <div>{t.calories}: <span className="font-medium">{plan.targets.calories}</span></div>
        <div>{t.protein}: <span className="font-medium">{plan.targets.protein}g</span></div>
        <div>{t.carbs}: <span className="font-medium">{plan.targets.carbs}g</span></div>
        <div>{t.fats}: <span className="font-medium">{plan.targets.fat}g</span></div>
      </div>

      <div className="flex justify-end gap-2 mt-auto">
         <button 
          onClick={(e) => { e.stopPropagation(); onEdit(plan); }}
          className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors text-gray-500 dark:text-slate-400"
          title="Edit Plan"
        >
          <Settings size={16} />
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); onDelete(plan.id); }}
          className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg transition-colors"
          title="Delete Plan"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
};