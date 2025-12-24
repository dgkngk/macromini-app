import React, { useState, useEffect } from "react";
import { User, UserTier } from "../types";
import { X, User as UserIcon, CreditCard, Star, Shield, Loader2, Zap, Mail, Lock, LogOut, ArrowRight } from "lucide-react";
import { api } from "../services/api";
import { SUBSCRIPTION_PRICE_MONTHLY } from "../constants";
import { useToast } from "./Toast";

interface SettingsModalProps {
  user: User;
  onClose: () => void;
  lang: string;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  user,
  onClose,
  lang,
}) => {
  const [profile, setProfile] = useState<{
    tier: UserTier;
    subscriptionStatus: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const { addToast } = useToast();

  // Registration State
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const isGuest = user.id.startsWith("guest_");

  useEffect(() => {
    if (isGuest) {
      setLoading(false);
      return;
    }

    const loadProfile = async () => {
      try {
        const p = await api.subscription.getProfile(user.id);
        setProfile(p);
      } catch (e) {
        console.error("Failed to load profile", e);
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, [user.id, isGuest]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await api.auth.register(regEmail, regPassword, regName);
      addToast("Account created successfully!", "success");
      // App will automatically detect user change and re-render SettingsModal with new user
    } catch (e: any) {
      console.error("Registration failed", e);
      let msg = "Failed to register.";
      if (e.code === "auth/email-already-in-use") msg = "Email already in use.";
      if (e.code === "auth/weak-password") msg = "Password is too weak.";
      addToast(msg, "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleLogout = async () => {
    await api.auth.logout();
    onClose();
  };

  const handleUpgrade = async () => {
    setActionLoading(true);
    try {
      const res = await api.subscription.createCheckoutSession(user.id);
      if (res.url) window.location.href = res.url;
    } catch (e) {
      console.error("Upgrade failed", e);
      addToast("Failed to start upgrade process.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpgradeOTP = async () => {
    setActionLoading(true);
    try {
      const res = await api.subscription.createCheckoutSessionOTP(user.id);
      if (res.url) window.location.href = res.url;
    } catch (e) {
      console.error("Upgrade OTP failed", e);
      addToast("Failed to start upgrade process.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleManage = async () => {
    setActionLoading(true);
    try {
      const res = await api.subscription.createPortalSession(user.id);
      if (res.url) window.location.href = res.url;
    } catch (e) {
      console.error("Portal failed", e);
      addToast("Failed to open billing portal.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const getTierBadge = (tier: UserTier) => {
    switch (tier) {
      case 2: // Elite
        return (
          <div className="flex items-center gap-1 px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-xs font-bold rounded uppercase tracking-wide border border-purple-200 dark:border-purple-800">
            <Shield size={12} fill="currentColor" /> ELITE
          </div>
        );
      case 1: // Plus
        return (
          <div className="flex items-center gap-1 px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold rounded uppercase tracking-wide border border-emerald-200 dark:border-emerald-800">
            <Zap size={12} fill="currentColor" /> PLUS
          </div>
        );
      default:
        return (
          <div className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-xs font-bold rounded uppercase tracking-wide border border-slate-200 dark:border-slate-600">
            FREE
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
          <h2 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
            <UserIcon size={20} className="text-indigo-600" />
            {isGuest ? "Create Account" : "Account Settings"}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-500"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {isGuest ? (
            // GUEST VIEW - Registration Form
            <div className="space-y-6">
               <div className="text-center">
                 <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-indigo-600 dark:text-indigo-400">
                   <UserIcon size={32} />
                 </div>
                 <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Save Your Progress</h3>
                 <p className="text-slate-500 dark:text-slate-400 text-sm">
                   Create an account to save your recipes, sync across devices, and unlock premium features.
                 </p>
               </div>

               <form onSubmit={handleRegister} className="space-y-4">
                 <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-600 dark:text-slate-400">Name</label>
                    <div className="relative">
                      <UserIcon className="absolute left-4 top-3.5 text-slate-400 w-5 h-5" />
                      <input
                        type="text"
                        required
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        placeholder="John Doe"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-600 dark:text-slate-400">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-3.5 text-slate-400 w-5 h-5" />
                      <input
                        type="email"
                        required
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        placeholder="hello@example.com"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-600 dark:text-slate-400">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-3.5 text-slate-400 w-5 h-5" />
                      <input
                        type="password"
                        required
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/30 transition-all flex items-center justify-center gap-2"
                  >
                    {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Create Account <ArrowRight size={18}/></>}
                  </button>
               </form>

               <div className="text-center pt-2 border-t border-slate-100 dark:border-slate-700">
                 <button 
                   onClick={handleLogout}
                   className="text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 flex items-center justify-center gap-2 mx-auto"
                 >
                   <LogOut size={14} />
                   Already have an account? Log out
                 </button>
               </div>
            </div>
          ) : (
            // LOGGED IN VIEW - Profile & Subscriptions
            <>
              <div className="flex items-center gap-4 mb-6">
                <img
                  src={user.avatar ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name ?? "User")}`}
                  alt={user.name ?? "User"}
                  className="w-16 h-16 rounded-full border-2 border-white dark:border-slate-700 shadow-md"
                />
                <div>
                  <h3 className="font-bold text-xl text-slate-800 dark:text-white">
                    {user.name}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {user.email}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    {loading ? (
                      <div className="h-5 w-16 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                    ) : (
                      profile && getTierBadge(profile.tier)
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 border border-slate-100 dark:border-slate-800">
                <h4 className="font-semibold text-slate-800 dark:text-white mb-2 flex items-center gap-2">
                  <CreditCard size={18} className="text-slate-400" />
                  Subscription Plan
                </h4>

                {loading ? (
                  <div className="space-y-2">
                    <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                    <div className="h-10 w-full bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {profile?.tier === 0 && (
                      <div className="text-sm text-slate-600 dark:text-slate-300">
                        <p className="mb-2">
                          You are currently on the <strong>Free Tier</strong>.
                        </p>
                        <ul className="space-y-1 mb-4 text-slate-500 dark:text-slate-400">
                          <li className="flex items-center gap-2">
                            • 10 AI Requests per day
                          </li>
                          <li className="flex items-center gap-2">
                            • Basic Features
                          </li>
                        </ul>
                        <button
                          onClick={handleUpgrade}
                          disabled={actionLoading}
                          className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg font-semibold shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                          {actionLoading ? (
                            <Loader2 size={18} className="animate-spin" />
                          ) : (
                            <>
                              <Star size={18} fill="currentColor" className="text-yellow-300" />
                              Upgrade to Plus
                            </>
                          )}
                        </button>
                        <p className="text-xs text-center text-slate-400 mt-2">
                          Unlock 15 requests/hour for just {SUBSCRIPTION_PRICE_MONTHLY}/month
                        </p>

                        <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                            <p className="mb-2 font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                                <Shield size={16} className="text-purple-600" />
                                Lifetime Access
                            </p>
                            <ul className="space-y-1 mb-4 text-purple-600 dark:text-purple-400 text-xs">
                                <li className="flex items-center gap-2">
                                    • 100 AI Requests per hour
                                </li>
                                <li className="flex items-center gap-2">
                                    • One-time payment, no subscription
                                </li>
                            </ul>
                            <button
                              onClick={handleUpgradeOTP}
                              disabled={actionLoading}
                              className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg font-semibold shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                              {actionLoading ? (
                                <Loader2 size={18} className="animate-spin" />
                              ) : (
                                <>
                                  <Shield size={18} fill="currentColor" className="text-purple-200" />
                                  Get Elite Lifetime
                                </>
                              )}
                            </button>
                        </div>
                      </div>
                    )}

                    {profile?.tier === 1 && (
                      <div className="text-sm text-slate-600 dark:text-slate-300">
                        <p className="mb-2">
                          You are a <strong>Plus Member</strong>! Thank you for your support.
                        </p>
                        <ul className="space-y-1 mb-4 text-emerald-600 dark:text-emerald-400">
                          <li className="flex items-center gap-2">
                            ✓ 15 AI Requests per hour
                          </li>
                          <li className="flex items-center gap-2">
                            ✓ Priority Support
                          </li>
                        </ul>
                        <button
                          onClick={handleManage}
                          disabled={actionLoading}
                          className="w-full py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg font-medium transition-colors disabled:opacity-70"
                        >
                          {actionLoading ? "Loading..." : "Manage Subscription"}
                        </button>

                        <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                            <p className="mb-2 font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                                <Shield size={16} className="text-purple-600" />
                                Upgrade to Elite
                            </p>
                            <p className="mb-4 text-slate-500 dark:text-slate-400 text-xs">
                                Switch to Lifetime Elite for higher limits.
                            </p>
                            <button
                              onClick={handleUpgradeOTP}
                              disabled={actionLoading}
                              className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg font-semibold shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                              {actionLoading ? (
                                <Loader2 size={18} className="animate-spin" />
                              ) : (
                                <>
                                  <Shield size={18} fill="currentColor" className="text-purple-200" />
                                  Get Elite Lifetime
                                </>
                              )}
                            </button>
                        </div>
                      </div>
                    )}

                    {profile?.tier === 2 && (
                      <div className="text-sm text-slate-600 dark:text-slate-300">
                        <p className="mb-2">
                          You are an <strong>Elite Member</strong>.
                        </p>
                        <p className="text-purple-600 dark:text-purple-400 font-medium mb-4">
                          100 Requests per hour enabled.
                        </p>
                        <div className="p-3 bg-purple-50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-900/30 rounded-lg text-xs text-purple-700 dark:text-purple-300">
                          Elite status is managed manually by administrators.
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
