import { useState, memo } from "react";

interface ProfilePasswordFormProps {
  newPassword?: string;
  setNewPassword?: (p: string) => void;
  confirmPassword?: string;
  setConfirmPassword?: (p: string) => void;
  savingPassword?: boolean;
  onChangePassword?: () => void;
}

export const ProfilePasswordForm = memo(function ProfilePasswordForm({
  newPassword = "",
  setNewPassword,
  confirmPassword = "",
  setConfirmPassword,
  savingPassword = false,
  onChangePassword,
}: ProfilePasswordFormProps) {
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const isLengthValid = newPassword.length >= 6;
  const isMatchValid = newPassword.length > 0 && newPassword === confirmPassword;
  const canSubmit = isLengthValid && isMatchValid && !savingPassword;

  const handleReset = () => {
    if (setNewPassword) setNewPassword("");
    if (setConfirmPassword) setConfirmPassword("");
  };

  return (
    <div className="max-w-xl">
      <form
        autoComplete="off"
        onSubmit={(e) => {
          e.preventDefault();
          if (canSubmit && onChangePassword) onChangePassword();
        }}
        className="bg-slate-50/60 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 sm:p-6 space-y-5 shadow-2xs"
      >
        <input type="text" name="prevent_autofill" className="hidden" tabIndex={-1} autoComplete="off" />
        <input type="password" name="prevent_autofill_pwd" className="hidden" tabIndex={-1} autoComplete="off" />

        {/* Card Section Header */}
        <div className="flex items-start gap-3 pb-3 border-b border-slate-200/70 dark:border-slate-700/60">
          <div className="w-9 h-9 rounded-xl bg-[#253C7D]/10 dark:bg-sky-500/20 text-[#253C7D] dark:text-sky-400 flex items-center justify-center shrink-0 text-base">
            <i className="ri-lock-password-line" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">
              Update Password
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Enter and confirm your new password to keep your account safe
            </p>
          </div>
        </div>

        {/* Form Fields */}
        <div className="space-y-4">
          {/* New Password */}
          <div>
            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
              New Password
            </label>
            <div className="relative">
              <i className="ri-lock-line absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
              <input
                type={showPass ? "text" : "password"}
                name="new_account_password"
                autoComplete="new-password"
                placeholder="Enter new password (min. 6 characters)"
                value={newPassword}
                onChange={(e) => setNewPassword && setNewPassword(e.target.value)}
                className="w-full pl-8 pr-10 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#253C7D]/20 focus:border-[#253C7D] dark:focus:border-sky-400 shadow-2xs transition-all placeholder:text-slate-400 placeholder:font-normal"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-1 transition-colors"
                title={showPass ? "Hide password" : "Show password"}
              >
                <i className={showPass ? "ri-eye-off-line text-xs" : "ri-eye-line text-xs"} />
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
              Confirm New Password
            </label>
            <div className="relative">
              <i className="ri-lock-check-line absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
              <input
                type={showConfirm ? "text" : "password"}
                name="confirm_new_account_password"
                autoComplete="new-password"
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword && setConfirmPassword(e.target.value)}
                className="w-full pl-8 pr-10 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#253C7D]/20 focus:border-[#253C7D] dark:focus:border-sky-400 shadow-2xs transition-all placeholder:text-slate-400 placeholder:font-normal"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-1 transition-colors"
                title={showConfirm ? "Hide password" : "Show password"}
              >
                <i className={showConfirm ? "ri-eye-off-line text-xs" : "ri-eye-line text-xs"} />
              </button>
            </div>
          </div>
        </div>

        {/* Validation Checklist / Guidance */}
        {newPassword.length > 0 && (
          <div className="p-3 bg-white dark:bg-slate-900/80 rounded-xl border border-slate-200/80 dark:border-slate-700/80 space-y-1.5 text-[11px]">
            <div className="flex items-center gap-2">
              <i
                className={`text-xs ${
                  isLengthValid
                    ? "ri-checkbox-circle-fill text-emerald-500"
                    : "ri-close-circle-fill text-slate-400"
                }`}
              />
              <span className={isLengthValid ? "text-slate-700 dark:text-slate-200 font-medium" : "text-slate-400 font-normal"}>
                At least 6 characters long
              </span>
            </div>
            <div className="flex items-center gap-2">
              <i
                className={`text-xs ${
                  isMatchValid
                    ? "ri-checkbox-circle-fill text-emerald-500"
                    : confirmPassword.length > 0
                    ? "ri-close-circle-fill text-rose-500"
                    : "ri-close-circle-fill text-slate-400"
                }`}
              />
              <span
                className={
                  isMatchValid
                    ? "text-slate-700 dark:text-slate-200 font-medium"
                    : confirmPassword.length > 0
                    ? "text-rose-500 font-medium"
                    : "text-slate-400 font-normal"
                }
              >
                {confirmPassword.length > 0 && !isMatchValid
                  ? "Passwords do not match"
                  : "Passwords match"}
              </span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 pt-2 border-t border-slate-200/70 dark:border-slate-700/60">
          <button
            type="submit"
            disabled={!canSubmit}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#253C7D] dark:bg-blue-600 hover:bg-[#1E3064] dark:hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {savingPassword ? (
              <>
                <i className="ri-loader-4-line animate-spin text-xs" />
                <span>Updating Password...</span>
              </>
            ) : (
              <>
                <i className="ri-save-line text-xs" />
                <span>Update Password</span>
              </>
            )}
          </button>
          {(newPassword || confirmPassword) && (
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl shadow-2xs transition-all cursor-pointer active:scale-95"
            >
              <i className="ri-refresh-line text-xs" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </form>
    </div>
  );
});

