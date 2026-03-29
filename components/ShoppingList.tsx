import React, { useState, useMemo } from 'react';
import { ShoppingItem, Language } from '../types';
import { TRANSLATIONS } from '../constants';
import { Plus, ShoppingCart } from 'lucide-react';
import { ShoppingListItem } from './ShoppingListItem';

interface ShoppingListProps {
  items: ShoppingItem[];
  onAdd: (text: string) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<ShoppingItem>) => void;
  onClearCompleted: () => void;
  lang: Language;
}

export const ShoppingList: React.FC<ShoppingListProps> = React.memo(({
  items, 
  onAdd, 
  onToggle, 
  onDelete, 
  onUpdate,
  onClearCompleted,
  lang 
}) => {
  const [inputValue, setInputValue] = useState('');
  const t = TRANSLATIONS[lang];

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onAdd(inputValue.trim());
      setInputValue('');
    }
  };

  // ⚡ Bolt Optimization: Memoize sorting to prevent unnecessary calculations on every render
  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      if (a.completed === b.completed) return 0;
      return a.completed ? 1 : -1;
    });
  }, [items]);

  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{t.shopping_list_title}</h2>
          <p className="text-slate-500 dark:text-slate-400">{t.shopping_list_desc}</p>
        </div>
        {items.some(i => i.completed) && (
          <button 
            onClick={onClearCompleted}
            className="text-sm text-slate-500 hover:text-red-500 dark:text-slate-400 dark:hover:text-red-400 underline transition-colors"
          >
            {t.clear_completed}
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
        {/* Add Input */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
          <form onSubmit={handleAdd} className="flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={t.add_item + "..."}
              className="flex-1 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
            />
            <button 
              type="submit"
              disabled={!inputValue.trim()}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl transition-colors flex items-center justify-center"
            >
              <Plus size={20} />
            </button>
          </form>
        </div>

        {/* List */}
        <div className="divide-y divide-slate-100 dark:divide-slate-700 max-h-[60vh] overflow-y-auto">
          {items.length === 0 ? (
            <div className="py-12 text-center text-slate-400 dark:text-slate-500">
              <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">{t.no_items}</p>
              <p className="text-sm mt-1">{t.no_items_hint}</p>
            </div>
          ) : (
            sortedItems.map(item => (
              <ShoppingListItem
                key={item.id}
                item={item}
                onToggle={onToggle}
                onDelete={onDelete}
                onUpdate={onUpdate}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
});
