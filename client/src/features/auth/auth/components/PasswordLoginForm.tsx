import React, { memo } from "react";
import { Link } from "react-router-dom";
import { isPhoneIdentifier } from "@/lib/phoneUtils";
import { formatLockoutTimer } from "../loginRateLimiter";

interface PasswordLoginFormProps {
  email: string;
  setEmail: (email: string) => void;
  password: string;
  setPassword: (password: string) => void;
  showPassword: boolean;
  setShowPassword: React.Dispatch<React.SetStateAction<boolean>>;
  loading: boolean;
  isLocked?: boolean;
  lockoutSeconds?: number;
  singleAttemptAllowed?: boolean;
  attemptsRemaining?: number;
  onSubmit: (e: React.FormEvent) => void;
}

export const PasswordLoginForm = memo(function PasswordLoginForm({
  email,
  setEmail,
  password,
  setPassword,
  showPassword,
  setShowPassword,
  loading,
  isLocked = false,
  lockoutSeconds = 0,
  singleAttemptAllowed = false,
  attemptsRemaining = 5,
  onSubmit,
}: PasswordLoginFormProps) {
  const isPhone = isPhoneIdentifier(email);

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">
          Email or Phone Number
        </label>
        <div className="relative">
          <i
            className={`absolute left-3.5 top-1/2 -translate-y-1/2 text-base text-gray-400 pointer-events-none ${
              isPhone ? "ri-phone-line" : "ri-mail-line"
            }`}
          />
          <input
            type="text"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 text-[13px] text-gray-900 focus:outline-none focus:border-[#253C7D] focus:ring-1 focus:ring-[#253C7D]/20 transition-all"
            placeholder="admin@hrmops.com or 012 345 678"
            autoComplete="username"
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-[12px] font-semibold text-gray-700">Password</label>
          <Link to="/forgot-password" className="text-[12px] font-semibold text-[#253C7D] hover:underline">
            Forgot password?
          </Link>
        </div>
        <div className="relative">
          <i className="ri-lock-line absolute left-3.5 top-1/2 -translate-y-1/2 text-base text-gray-400 pointer-events-none" />
          <input
            type={showPassword ? "text" : "password"}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-gray-200 text-[13px] text-gray-900 focus:outline-none focus:border-[#253C7D] focus:ring-1 focus:ring-[#253C7D]/20 transition-all"
            placeholder="Enter your password"
            autoComplete="current-password"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            <i className={showPassword ? "ri-eye-off-line text-base" : "ri-eye-line text-base"} />
          </button>
        </div>
      </div>

      {isLocked && (
        <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-lg flex items-center gap-2.5 text-amber-800 dark:text-amber-200 text-xs animate-in fade-in duration-200">
          <i className="ri-alarm-warning-line text-lg text-amber-600 dark:text-amber-400 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-[12px]">Too Many Failed Attempts</p>
            <p className="text-[11px] text-amber-700 dark:text-amber-300 mt-0.5">
              Please wait <span className="font-mono font-bold text-amber-900 dark:text-amber-100 bg-amber-100 dark:bg-amber-900/60 px-1.5 py-0.5 rounded">{formatLockoutTimer(lockoutSeconds)}</span> before trying again.
            </p>
          </div>
        </div>
      )}

      {!isLocked && singleAttemptAllowed && (
        <div className="p-2.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-lg flex items-center gap-2 text-blue-800 dark:text-blue-200 text-xs">
          <i className="ri-information-line text-base text-blue-600 dark:text-blue-400 shrink-0" />
          <span className="text-[11px] leading-relaxed">
            You have <strong>1 attempt remaining</strong>. If incorrect, you will be locked out for a longer period.
          </span>
        </div>
      )}

      <button
        type="submit"
        disabled={loading || isLocked}
        className={`w-full py-2.5 rounded-lg text-[13px] font-semibold transition-all flex items-center justify-center gap-2 ${
          isLocked
            ? "bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-not-allowed border border-slate-300 dark:border-slate-700"
            : "bg-[#253C7D] text-white hover:bg-[#1F336A] active:scale-[0.98] disabled:opacity-60 cursor-pointer"
        }`}
      >
        {isLocked ? (
          <>
            <i className="ri-lock-2-line text-sm" />
            <span>Please wait {formatLockoutTimer(lockoutSeconds)}</span>
          </>
        ) : loading ? (
          "Signing in..."
        ) : (
          "Sign In"
        )}
      </button>
    </form>
  );
});
