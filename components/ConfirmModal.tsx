import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { TRANSLATIONS } from '../constants';
import { Language } from '../types';

interface ConfirmModalProps {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  lang: Language;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({ title, message, onConfirm, onCancel, lang }) => {
  const t = TRANSLATIONS[lang];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden transform transition-all scale-100">
        <div className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full text-red-600 dark:text-red-400">
              <AlertTriangle size={24} />
            </div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-white">{title}</h3>
          </div>
          
          <p className="text-slate-600 dark:text-slate-300 mb-8">{message}</p>
          
          <div className="flex justify-end gap-3">
            <button 
              onClick={onCancel}
              className="px-4 py-2 text-slate-600 dark:text-slate-400 font-medium hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              {t.cancel}
            </button>
            <button 
              onClick={onConfirm}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors shadow-sm"
            >
              {t.delete_btn} 
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};