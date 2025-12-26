import React from 'react';
import { Globe } from 'lucide-react';
import { Language } from '../types';
import { TRANSLATIONS } from '../constants';

interface LanguageSelectorProps {
  language: Language;
  setLanguage: (lang: Language) => void;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({ language, setLanguage }) => {
  const flagMapping: { [key in Language]: string } = {
    en: "🇺🇸",
    tr: "🇹🇷",
    de: "🇩🇪",
    fr: "🇫🇷",
    nl: "🇳🇱",
    es: "🇪🇸",
    pt: "🇵🇹",
    ru: "🇷🇺",
    zh: "🇨🇳",
  };

  return (
    <div className="relative group">
      <button className="flex items-center gap-2 px-3 py-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur rounded-lg shadow-sm hover:shadow-md transition-all text-slate-600 dark:text-slate-300">
        <Globe size={18} />
        <span className="uppercase text-sm font-bold">{language}</span>
      </button>

      {/* Dropdown Content */}
      <div className="absolute right-0 top-[10px] w-16 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden hidden group-hover:block focus-within:block">
        {Object.keys(TRANSLATIONS).map((l) => (
          <button
            key={l}
            onClick={() => setLanguage(l as Language)}
            className={`w-full flex items-center justify-between px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors ${
              language === l
                ? "text-indigo-600 font-bold bg-indigo-50 dark:bg-indigo-900/20"
                : "text-slate-600 dark:text-slate-300"
            }`}
          >
            <span>{l.toUpperCase()}</span>
            <span>{flagMapping[l as Language]}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
