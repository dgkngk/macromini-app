import React, { useMemo } from 'react';
import { ShoppingItem } from '../types';
import { Trash2, Plus, CheckSquare, Square, Minus } from 'lucide-react';
import { parseIngredient, formatIngredient, getIncrementStep } from '../services/shoppingUtils';

interface ShoppingListItemProps {
  item: ShoppingItem;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<ShoppingItem>) => void;
}

export const ShoppingListItem: React.FC<ShoppingListItemProps> = React.memo(({
  item,
  onToggle,
  onDelete,
  onUpdate
}) => {
  // ⚡ Bolt Optimization: Memoize parsing to avoid regex overhead on every render
  const parsed = useMemo(() => parseIngredient(item.text), [item.text]);

  const handleQuantityChange = (delta: number) => {
    const step = getIncrementStep(parsed.unit);
    const newQty = Math.max(1, parsed.quantity + (delta * step));

    const newText = formatIngredient({ ...parsed, quantity: newQty });
    onUpdate(item.id, { text: newText });
  };

  return (
    <div
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
            {parsed.name}
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
        <span className="font-semibold text-center text-sm min-w-[2rem] px-1 whitespace-nowrap">
          {parsed.quantity} {parsed.unit}
        </span>

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
  );
});
