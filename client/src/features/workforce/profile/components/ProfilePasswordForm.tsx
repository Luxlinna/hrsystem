import { useState, memo } from "react";

interface Props {
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
}: Props) {
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const isLen = newPassword.length >= 6;
  const isMatch = newPassword.length > 0 && newPassword === confirmPassword;
  const canSubmit = isLen && isMatch && !savingPassword;

  const handleReset = () => {
    setNewPassword?.("");
    setConfirmPassword?.("");
  };

  return (
    <div className="max-w-xl">
      <form
        autoComplete="off"
        onSubmit={(e) => { e.preventDefault(); if (canSubmit) onChangePassword?.(); }}
        className="space-y-5"
      >
        <input type="text" name="prevent_autofill" className="hidden" tabIndex={-1} autoComplete="off" />
        <input type="password" name="prevent_autofill_pwd" className="hidden" tabIndex={-1} autoComplete="off" />

        <div>
          <h3 className="text-[11.5px] font-bold text-[#0088cc] dark:text-sky-400 uppercase tracking-wider flex items-center gap-2">
            <i className="ri-lock-password-line text-sm" />
            <span>Change Account Password</span>
          </h3>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
            Ensure your account is protected with a secure password (minimum 6 characters)
          </p>
        </div>

        <hr className="border-slate-200 dark:border-slate-800" />

        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-200 block mb-1.5">
              New Password <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <i className="ri-lock-line absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
              <input
                type={showPass ? "text" : "password"}
                name="new_account_password"
                autoComplete="new-password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword?.(e.target.value)}
                className="w-full pl-9 pr-10 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-[#0088cc] focus:ring-1 focus:ring-[#0088cc] transition-all"
              />
              <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer p-1">
                <i className={showPass ? "ri-eye-off-line text-sm" : "ri-eye-line text-sm"} />
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-200 block mb-1.5">
              Confirm New Password <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <i className="ri-lock-check-line absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
              <input
                type={showConfirm ? "text" : "password"}
                name="confirm_new_account_password"
                autoComplete="new-password"
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword?.(e.target.value)}
                className="w-full pl-9 pr-10 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-[#0088cc] focus:ring-1 focus:ring-[#0088cc] transition-all"
              />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer p-1">
                <i className={showConfirm ? "ri-eye-off-line text-sm" : "ri-eye-line text-sm"} />
              </button>
            </div>
          </div>
        </div>

        {newPassword.length > 0 && (
          <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-lg border border-slate-200 dark:border-slate-700 space-y-1.5 text-xs">
            <div className="flex items-center gap-2">
              <i className={`text-sm ${isLen ? "ri-checkbox-circle-fill text-emerald-600" : "ri-close-circle-fill text-slate-400"}`} />
              <span className={isLen ? "text-slate-800 dark:text-slate-200 font-medium" : "text-slate-500"}>At least 6 characters long</span>
            </div>
            <div className="flex items-center gap-2">
              <i className={`text-sm ${isMatch ? "ri-checkbox-circle-fill text-emerald-600" : confirmPassword ? "ri-close-circle-fill text-rose-600" : "ri-close-circle-fill text-slate-400"}`} />
              <span className={isMatch ? "text-slate-800 dark:text-slate-200 font-medium" : confirmPassword ? "text-rose-600" : "text-slate-500"}>
                {confirmPassword && !isMatch ? "Passwords do not match" : "Passwords match"}
              </span>
            </div>
          </div>
        )}

        <hr className="border-slate-200 dark:border-slate-800" />

        <div className="flex items-center gap-3 pt-1">
          <button
            type="submit"
            disabled={!canSubmit}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#0088cc] hover:bg-[#0077b3] disabled:bg-slate-300 text-white font-semibold text-xs rounded-lg shadow-sm transition-all cursor-pointer active:scale-95 disabled:cursor-not-allowed"
          >
            {savingPassword ? <><i className="ri-loader-4-line animate-spin text-xs" /><span>Updating Password...</span></> : <><i className="ri-save-line text-xs" /><span>Update Password</span></>}
          </button>
          {(newPassword || confirmPassword) && (
            <button type="button" onClick={handleReset} className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-all cursor-pointer active:scale-95 border border-slate-200">
              <i className="ri-refresh-line text-xs" /><span>Reset</span>
            </button>
          )}
        </div>
      </form>
    </div>
  );
});
