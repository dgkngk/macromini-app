import { useState, useEffect } from "react";

export interface RateLimitState {
  limit: number;
  remaining: number;
  resetTime: number; // Absolute timestamp in ms
}

const STORAGE_KEY = "macromini_rate_limit";

const loadState = (): RateLimitState => {
  if (typeof window === "undefined")
    return { limit: 10, remaining: 10, resetTime: Date.now() };
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Date.now() > parsed.resetTime) {
        return { ...parsed, remaining: parsed.limit };
      }
      return parsed;
    }
  } catch (e) {
    console.error("Failed to load rate limit state", e);
  }
  return {
    limit: 10,
    remaining: 10,
    resetTime: Date.now(),
  };
};

// Initial state: assume generous limits until we hear otherwise
let state: RateLimitState = loadState();

type Listener = (state: RateLimitState) => void;
const listeners: Set<Listener> = new Set();

const notify = () => {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }
  listeners.forEach((listener) => listener(state));
};

export const rateLimitStore = {
  getState: () => state,

  update: (headers: Headers) => {
    // Express-rate-limit with standardHeaders: true
    // RateLimit-Limit: <limit>
    // RateLimit-Remaining: <remaining>
    // RateLimit-Reset: <seconds until reset>

    const limitHeader = headers.get("RateLimit-Limit");
    const remainingHeader = headers.get("RateLimit-Remaining");
    const resetHeader = headers.get("RateLimit-Reset");

    if (limitHeader && remainingHeader && resetHeader) {
      const limit = parseInt(limitHeader, 10);
      const remaining = parseInt(remainingHeader, 10);
      const resetSeconds = parseInt(resetHeader, 10);

      const resetTime = Date.now() + resetSeconds * 1000;

      state = {
        limit,
        remaining,
        resetTime,
      };
      notify();
    }
  },

  subscribe: (listener: Listener) => {
    listeners.add(listener);
    // return unsubscribe function
    return () => {
      listeners.delete(listener);
    };
  },
};

export const useRateLimit = () => {
  const [rateLimit, setRateLimit] = useState<RateLimitState>(
    rateLimitStore.getState(),
  );

  useEffect(() => {
    const unsubscribe = rateLimitStore.subscribe(setRateLimit);
    return unsubscribe;
  }, []);

  return rateLimit;
};
