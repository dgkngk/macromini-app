import React, { useState } from "react";
import {
  ChefHat,
  Mail,
  Lock,
  User as UserIcon,
  ArrowRight,
  Loader2,
  AlertCircle,
  ShieldOff,
  Globe,
} from "lucide-react";
import { TRANSLATIONS } from "../constants";
import { Language, User } from "../types";
import { api } from "../services/api";

interface AuthProps {
  onLogin: (user: User) => void;
  lang: Language;
  setLang: (lang: Language) => void;
}

export const Auth: React.FC<AuthProps> = ({ onLogin, lang, setLang }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const t = TRANSLATIONS[lang];

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      let user: User;
      if (isRegistering) {
        user = await api.auth.register(email, password, name);
      } else {
        user = await api.auth.login(email, password);
      }
      onLogin(user);
    } catch (err: any) {
      console.error(err);
      let msg = t.auth_error;
      if (err.code === "auth/email-already-in-use") msg = t.auth_exists;
      if (err.code === "auth/invalid-credential") msg = t.auth_error;
      if (err.code === "auth/unauthorized-domain") {
        msg = `Domain unauthorized. Please add "${window.location.hostname}" to Firebase Console > Auth > Settings > Authorized Domains`;
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider: "Google" | "Apple") => {
    setError(null);
    setLoading(true);
    try {
      let user: User;
      if (provider === "Google") {
        user = await api.auth.loginWithGoogle();
      } else {
        user = await api.auth.loginWithApple();
      }
      onLogin(user);
    } catch (err: any) {
      console.error(err);
      let msg = err.message || t.auth_error;
      if (err.code === "auth/unauthorized-domain") {
        msg = `Domain unauthorized. Please add "${window.location.hostname}" to Firebase Console > Auth > Settings > Authorized Domains`;
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      const user = await api.auth.loginAsGuest();
      onLogin(user);
    } catch (err: any) {
      setError("Failed to start guest session");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-4 transition-colors relative">
      {/* Language Selector - Top Right */}
      <div className="absolute top-4 right-4 z-20">
        <div className="relative group">
          <button className="flex items-center gap-2 px-3 py-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur rounded-lg shadow-sm hover:shadow-md transition-all text-slate-600 dark:text-slate-300">
            <Globe size={18} />
            <span className="uppercase text-sm font-bold">{lang}</span>
          </button>

          {/* Dropdown Content */}
          <div className="absolute right-0 top-[10px] w-32 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden hidden group-hover:block focus-within:block">
            {Object.keys(TRANSLATIONS).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l as Language)}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors ${
                  lang === l
                    ? "text-indigo-600 font-bold bg-indigo-50 dark:bg-indigo-900/20"
                    : "text-slate-600 dark:text-slate-300"
                }`}
              >
                {/* You might want a mapping for 'en' -> 'English', etc. */}
                {l.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-300">
        {/* Header Graphic */}
        <div className="bg-indigo-600 p-8 flex flex-col items-center justify-center text-white relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <pattern
                id="grid"
                width="10"
                height="10"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 10 0 L 0 0 0 10"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="0.5"
                />
              </pattern>
              <rect width="100" height="100" fill="url(#grid)" />
            </svg>
          </div>
          <div className="bg-white/20 p-4 rounded-2xl mb-4 backdrop-blur-sm z-10">
            <ChefHat size={40} />
          </div>
          <h1 className="text-3xl font-bold z-10">MacroMini</h1>
          <p className="text-indigo-200 mt-2 text-center z-10 max-w-xs">
            {isRegistering ? t.create_desc : t.welcome_desc}
          </p>
        </div>

        {/* Form */}
        <div className="p-8">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">
            {isRegistering ? t.create_account : t.welcome_back}
          </h2>

          <form onSubmit={handleAuth} className="space-y-4">
            {isRegistering && (
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                  {t.name_label}
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-4 top-3.5 text-slate-400 w-5 h-5" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    placeholder="John Doe"
                    disabled={loading}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                {t.email_label}
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-3.5 text-slate-400 w-5 h-5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  placeholder="hello@example.com"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                {t.password_label}
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-3.5 text-slate-400 w-5 h-5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  placeholder="••••••••"
                  disabled={loading}
                />
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/50 rounded-lg text-red-600 dark:text-red-400 text-sm">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <p>{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/30 transition-all flex items-center justify-center gap-2 group"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  {isRegistering ? t.register_btn : t.login_btn}
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Social Auth */}
          <div className="mt-8 space-y-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200 dark:border-slate-700"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white dark:bg-slate-800 px-2 text-slate-500">
                  Or continue with
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleOAuth("Google")}
                disabled={loading}
                className="flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Google
                </span>
              </button>
              <button
                onClick={() => handleOAuth("Apple")}
                disabled={loading}
                className="flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
              >
                <svg className="w-5 h-5 dark:fill-white" viewBox="0 0 384 512">
                  <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 52.3-11.4 69.5-34.3z" />
                </svg>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Apple
                </span>
              </button>
            </div>

            <button
              onClick={handleGuestLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors font-medium text-sm"
            >
              <ShieldOff size={16} />
              {t.guest_continue}
            </button>
          </div>

          <div className="mt-8 text-center">
            <button
              type="button"
              onClick={() => {
                setIsRegistering(!isRegistering);
                setError(null);
              }}
              disabled={loading}
              className="text-indigo-600 dark:text-indigo-400 text-sm font-semibold hover:underline"
            >
              {isRegistering ? t.switch_to_login : t.switch_to_register}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
