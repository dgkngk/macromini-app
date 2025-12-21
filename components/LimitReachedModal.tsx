import React, { useState } from "react";
import { X, Zap, Loader2, Clock } from "lucide-react";
import { api } from "../services/api";
import { User } from "../types";

interface LimitReachedModalProps {
  onClose: () => void;
  user: User | null;
}

export const LimitReachedModal: React.FC<LimitReachedModalProps> = ({ onClose, user }) => {
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await api.subscription.createCheckoutSession(user.id);
      if (res.url) window.location.href = res.url;
    } catch (e) {
      console.error("Upgrade failed", e);
      alert("Failed to start upgrade.");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-700">
        <div className="p-6 text-center">
          <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-amber-600 dark:text-amber-500">
            <Clock size={32} />
          </div>
          
          <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
            Usage Limit Reached
          </h2>
          
          <p className="text-slate-500 dark:text-slate-400 mb-6 text-sm">
            You've used all your AI requests for now. 
            <br />
            Free tier resets daily. Plus tier resets hourly.
          </p>

          <div className="space-y-3">
            <button
              onClick={handleUpgrade}
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              {loading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <>
                  <Zap size={20} fill="currentColor" className="text-yellow-300" />
                  Upgrade to Plus
                </>
              )}
            </button>
            
            <button
              onClick={onClose}
              className="w-full py-2.5 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 font-medium transition-colors"
            >
              I'll wait
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
