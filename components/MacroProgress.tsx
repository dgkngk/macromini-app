import React from 'react';
import { Macros, Language } from '../types';
import { TRANSLATIONS } from '../constants';

interface MacroProgressProps {
  current: Macros;
  target: Macros;
  theme: string;
  lang: Language;
}

export const MacroProgress: React.FC<MacroProgressProps> = ({ current, target, theme, lang }) => {
  const t = TRANSLATIONS[lang];

  const getThemeColor = () => {
     switch(theme) {
      case 'green': return '#10b981'; // emerald-500
      case 'orange': return '#f97316'; // orange-500
      default: return '#3b82f6'; // blue-500
    }
  };

  const mainColor = getThemeColor();
  
  const calculatePercentage = (curr: number, total: number) => {
    if (total === 0) return 0;
    return Math.min(100, Math.max(0, (curr / total) * 100));
  };

  const calPercent = calculatePercentage(current.calories, target.calories);
  
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 p-6 transition-colors">
      <div className="flex flex-col items-center gap-6">
        
        {/* Calories Ring - Resized and Top Centered */}
        <div className="relative w-24 h-24 flex-shrink-0">
           <svg className="w-full h-full transform -rotate-90" viewBox="0 0 128 128">
            <circle
              cx="64"
              cy="64"
              r="56"
              stroke="currentColor"
              strokeWidth="10"
              fill="transparent"
              className="text-slate-200 dark:text-slate-700 transition-colors"
            />
            <circle
              cx="64"
              cy="64"
              r="56"
              stroke={mainColor}
              strokeWidth="10"
              fill="transparent"
              strokeDasharray={351} // 2 * PI * 56
              strokeDashoffset={351 - (351 * calPercent) / 100}
              className="transition-all duration-1000 ease-out"
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-700 dark:text-slate-200">
            <span className="text-xl font-bold">{Math.round(current.calories)}</span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wide">kcal</span>
          </div>
        </div>

        {/* Macros Bars */}
        <div className="flex-1 w-full space-y-3">
          
          {/* Protein */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-medium text-slate-700 dark:text-slate-300">{t.protein}</span>
              <span className="text-slate-500 dark:text-slate-400">{Math.round(current.protein)} / {target.protein}g</span>
            </div>
            <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-violet-500 rounded-full transition-all duration-700"
                style={{ width: `${calculatePercentage(current.protein, target.protein)}%` }}
              />
            </div>
          </div>

          {/* Carbs */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-medium text-slate-700 dark:text-slate-300">{t.carbs}</span>
              <span className="text-slate-500 dark:text-slate-400">{Math.round(current.carbs)} / {target.carbs}g</span>
            </div>
            <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-amber-500 rounded-full transition-all duration-700"
                style={{ width: `${calculatePercentage(current.carbs, target.carbs)}%` }}
              />
            </div>
          </div>

          {/* Fat */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-medium text-slate-700 dark:text-slate-300">{t.fat_col}</span>
              <span className="text-slate-500 dark:text-slate-400">{Math.round(current.fat)} / {target.fat}g</span>
            </div>
            <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-red-500 rounded-full transition-all duration-700"
                style={{ width: `${calculatePercentage(current.fat, target.fat)}%` }}
              />
            </div>
          </div>
           
           {/* Fiber */}
           <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-medium text-slate-700 dark:text-slate-300">{t.fiber}</span>
              <span className="text-slate-500 dark:text-slate-400">{Math.round(current.fiber)} / {target.fiber}g</span>
            </div>
            <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-emerald-500 rounded-full transition-all duration-700"
                style={{ width: `${calculatePercentage(current.fiber, target.fiber)}%` }}
              />
            </div>
          </div>

          {/* Sugar */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-medium text-slate-700 dark:text-slate-300">{t.sugar_col}</span>
              <span className="text-slate-500 dark:text-slate-400">{Math.round(current.sugar || 0)} / {target.sugar || 0}g</span>
            </div>
            <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-pink-500 rounded-full transition-all duration-700"
                style={{ width: `${calculatePercentage(current.sugar || 0, target.sugar || 1)}%` }}
              />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};