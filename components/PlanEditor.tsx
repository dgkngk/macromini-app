import React, { useState, useEffect } from 'react';
import { DietPlan, Language } from '../types';
import { X, Save } from 'lucide-react';
import { TRANSLATIONS } from '../constants';

interface PlanEditorProps {
  initialPlan?: DietPlan;
  onSave: (plan: DietPlan) => void;
  onCancel: () => void;
  lang: Language;
}

export const PlanEditor: React.FC<PlanEditorProps> = ({ initialPlan, onSave, onCancel, lang }) => {
  const [formData, setFormData] = useState<DietPlan>({
    id: crypto.randomUUID(),
    name: '',
    description: '',
    targets: {
      calories: 2000,
      protein: 150,
      carbs: 200,
      fat: 65,
      fiber: 30,
      sugar: 30
    },
    colorTheme: 'blue'
  });

  const t = TRANSLATIONS[lang];

  useEffect(() => {
    if (initialPlan) {
      setFormData(initialPlan);
    }
  }, [initialPlan]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleTargetChange = (field: string, value: number) => {
    setFormData(prev => ({
      ...prev,
      targets: { ...prev.targets, [field]: value }
    }));
  };

  const themes = ['blue', 'green', 'orange'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 transition-colors">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">{initialPlan ? t.edit_plan : t.create_new_plan}</h3>
          <button onClick={onCancel} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-500 dark:text-slate-400">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t.plan_name}</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 dark:bg-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="e.g. My Cut, Winter Bulk"
              />
            </div>

             <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t.plan_desc}</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 dark:bg-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="Brief goal summary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t.color_theme}</label>
              <div className="flex gap-3">
                {themes.map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => handleChange('colorTheme', t)}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      formData.colorTheme === t 
                        ? 'border-slate-800 dark:border-white scale-110' 
                        : 'border-transparent hover:scale-105'
                    } ${
                      t === 'blue' ? 'bg-blue-500' : t === 'green' ? 'bg-emerald-500' : 'bg-orange-500'
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
              <h4 className="font-semibold text-slate-800 dark:text-white mb-3">{t.daily_targets}</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1">{t.calories}</label>
                  <input
                    type="number"
                    value={formData.targets.calories}
                    onChange={(e) => handleTargetChange('calories', Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 dark:bg-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                   <label className="block text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1">{t.protein} (g)</label>
                  <input
                    type="number"
                    value={formData.targets.protein}
                    onChange={(e) => handleTargetChange('protein', Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 dark:bg-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                   <label className="block text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1">{t.carbs} (g)</label>
                  <input
                    type="number"
                    value={formData.targets.carbs}
                    onChange={(e) => handleTargetChange('carbs', Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 dark:bg-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                   <label className="block text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1">{t.fats} (g)</label>
                  <input
                    type="number"
                    value={formData.targets.fat}
                    onChange={(e) => handleTargetChange('fat', Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 dark:bg-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                 <div>
                   <label className="block text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1">{t.fiber} (g)</label>
                  <input
                    type="number"
                    value={formData.targets.fiber}
                    onChange={(e) => handleTargetChange('fiber', Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 dark:bg-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                   <label className="block text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1">{t.sugar} (g)</label>
                  <input
                    type="number"
                    value={formData.targets.sugar}
                    onChange={(e) => handleTargetChange('sugar', Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 dark:bg-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 flex justify-end gap-3">
          <button onClick={onCancel} className="px-4 py-2 text-slate-600 dark:text-slate-400 font-medium hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors">
            {t.cancel}
          </button>
          <button onClick={() => onSave(formData)} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2">
            <Save size={18} />
            {t.save_plan}
          </button>
        </div>
      </div>
    </div>
  );
};