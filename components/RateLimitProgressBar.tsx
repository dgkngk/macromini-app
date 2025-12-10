import React from 'react';
import { useRateLimit } from '../lib/rateLimitStore';

export const RateLimitProgressBar: React.FC = () => {
  const { limit, remaining } = useRateLimit();

  // If limit is 0, avoid division by zero
  const safeLimit = limit > 0 ? limit : 1;
  const used = limit - remaining;
  const percentUsed = Math.min(100, Math.max(0, (used / safeLimit) * 100));

  // Color based on usage
  let barColor = 'bg-emerald-500';
  if (percentUsed > 80) barColor = 'bg-red-500';
  else if (percentUsed > 50) barColor = 'bg-amber-500';

  return (
    <div className="w-full px-4 py-1 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
      <div className="max-w-md mx-auto">
        <div className="flex justify-between text-[10px] mb-1 text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">
          <span>AI Usage Limit</span>
          <span>{used} / {limit} Used</span>
        </div>
        <div className="h-1 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <div
            className={`h-full ${barColor} rounded-full transition-all duration-500 ease-out`}
            style={{ width: `${percentUsed}%` }}
          />
        </div>
      </div>
    </div>
  );
};
