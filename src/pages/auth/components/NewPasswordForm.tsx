import React, { memo } from "react";

interface NewPasswordFormProps {
  invitedEmail: string;
  password: string;
  setPassword: (val: string) => void;
  confirm: string;
  setConfirm: (val: string) => void;
  loading: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export const NewPasswordForm = memo(function NewPasswordForm({
  invitedEmail,
  password,
  setPassword,
  confirm,
  setConfirm,
  loading,
  onSubmit,
}: NewPasswordFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Invited Email</label>
        <div className="relative">
          <i className="ri-mail-line absolute left-3.5 top-1/2 -translate-y-1/2 text-base text-gray-400 pointer-events-none" />
          <input
            type="email"
            value={invitedEmail}
            readOnly
            aria-label="Invited email"
            className="w-full cursor-not-allowed bg-gray-50 pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 text-[13px] text-gray-600"
            placeholder="Loading invited email..."
          />
        </div>
      </div>

      <div>
        <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">New Password</label>
        <div className="relative">
          <i className="ri-lock-line absolute left-3.5 top-1/2 -translate-y-1/2 text-base text-gray-400 pointer-events-none" />
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 text-[13px] text-gray-900 focus:outline-none focus:border-[#253C7D] focus:ring-1 focus:ring-[#253C7D]/20 transition-all"
            placeholder="At least 6 characters"
          />
        </div>
      </div>

      <div>
        <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Confirm Password</label>
        <div className="relative">
          <i className="ri-lock-line absolute left-3.5 top-1/2 -translate-y-1/2 text-base text-gray-400 pointer-events-none" />
          <input
            type="password"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 text-[13px] text-gray-900 focus:outline-none focus:border-[#253C7D] focus:ring-1 focus:ring-[#253C7D]/20 transition-all"
            placeholder="Re-enter your password"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2.5 bg-[#253C7D] text-white rounded-lg text-[13px] font-semibold hover:bg-[#1F336A] active:scale-[0.98] transition-all disabled:opacity-60 cursor-pointer"
      >
        {loading ? "Creating Account..." : "Create Account"}
      </button>
    </form>
  );
});
