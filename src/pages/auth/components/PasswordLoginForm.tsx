import React, { memo } from "react";
import { Link } from "react-router-dom";
import { isPhoneIdentifier } from "@/lib/phoneUtils";

interface PasswordLoginFormProps {
  email: string;
  setEmail: (email: string) => void;
  password: string;
  setPassword: (password: string) => void;
  showPassword: boolean;
  setShowPassword: React.Dispatch<React.SetStateAction<boolean>>;
  loading: boolean;
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

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2.5 bg-[#253C7D] text-white rounded-lg text-[13px] font-semibold hover:bg-[#1F336A] active:scale-[0.98] transition-all disabled:opacity-60 cursor-pointer"
      >
        {loading ? "Signing in..." : "Sign In"}
      </button>
    </form>
  );
});
