import React, { useState } from 'react';
import { ShoppingItem, Language } from '../types';
import { TRANSLATIONS } from '../constants';
import { Trash2, Plus, CheckSquare, Square, ShoppingCart, Minus } from 'lucide-react';
import { parseIngredient, formatIngredient, getIncrementStep } from '../services/shoppingUtils';

interface ShoppingListProps {
  items: ShoppingItem[];
  onAdd: (text: string) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<ShoppingItem>) => void;
  onClearCompleted: () => void;
  lang: Language;
}

export const ShoppingList: React.FC<ShoppingListProps> = ({ 
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

  const sortedItems = [...items].sort((a, b) => {
    if (a.completed === b.completed) return 0;
    return a.completed ? 1 : -1;
  });

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
            sortedItems.map(item => {
              const parsed = parseIngredient(item.text);

              const handleQuantityChange = (delta: number) => {
                const step = getIncrementStep(parsed.unit);
                const newQty = Math.max(0, parsed.quantity + (delta * step));
                if (newQty === 0) return; // Prevent 0 items?
                
                const newText = formatIngredient({ ...parsed, quantity: newQty });
                onUpdate(item.id, { text: newText });
              };

              return (
              <div 
                key={item.id} 
                className={`flex items-center justify-between p-4 group transition-colors ${
                  item.completed ? 'bg-slate-50 dark:bg-slate-800/50' : 'hover:bg-slate-50 dark:hover:bg-slate-700/30'
                }`}
              >
                <div 
                  className="flex items-center gap-3 flex-1 cursor-pointer"
                  onClick={() => onToggle(item.id)}
                >
                  <button className={`flex-shrink-0 transition-colors ${item.completed ? 'text-emerald-500' : 'text-slate-300 dark:text-slate-500 hover:text-indigo-500'}`}>
                    {item.completed ? <CheckSquare size={22} /> : <Square size={22} />}
                  </button>
                  <div className="flex-1 ml-2">
                    <span className={`text-slate-700 dark:text-slate-200 transition-all ${
                      item.completed ? 'line-through text-slate-400 dark:text-slate-500' : ''
                    }`}>
                      <span className="text-xs font-bold text-slate-400 uppercase">{parsed.unit}</span>
                      <span className="ml-1">{parsed.name}</span>
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {/* Decrease */}
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleQuantityChange(-1); }}
                    className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-indigo-600"
                  >
                    <Minus size={14} />
                  </button>

                  {/* Quantity Display/Input */}
                  <span className="font-semibold w-8 text-center text-sm">{parsed.quantity}</span>

                  {/* Increase */}
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleQuantityChange(1); }}
                    className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-indigo-600"
                  >
                    <Plus size={14} />
                  </button>
                </div>

                <button 
                  onClick={() => onDelete(item.id)}
                  className="p-2 text-slate-300 hover:text-red-500 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            )})
          )}
        </div>
      </div>
    </div>
  );
};