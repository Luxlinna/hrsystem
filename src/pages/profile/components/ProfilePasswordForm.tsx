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

  return (
    <form
      autoComplete="off"
      onSubmit={(e) => {
        e.preventDefault();
        if (onChangePassword) onChangePassword();
      }}
      className="space-y-4 max-w-sm text-xs"
    >
      <input type="text" name="prevent_autofill" className="hidden" tabIndex={-1} autoComplete="off" />
      <input type="password" name="prevent_autofill_pwd" className="hidden" tabIndex={-1} autoComplete="off" />

      {[
        { label: "New Password", val: newPassword, set: setNewPassword, show: showPass, toggle: () => setShowPass(!showPass), name: "new_account_password" },
        { label: "Confirm New Password", val: confirmPassword, set: setConfirmPassword, show: showConfirm, toggle: () => setShowConfirm(!showConfirm), name: "confirm_new_account_password" },
      ].map((p) => (
        <div key={p.name}>
          <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">{p.label}</label>
          <div className="relative">
            <i className="ri-lock-line absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
            <input
              type={p.show ? "text" : "password"}
              name={p.name}
              autoComplete="new-password"
              placeholder={p.label}
              value={p.val}
              onChange={(e) => p.set && p.set(e.target.value)}
              className="w-full pl-8 pr-9 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#253C7D] dark:focus:border-sky-400 shadow-2xs"
            />
            <button
              type="button"
              onClick={p.toggle}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-1"
            >
              <i className={p.show ? "ri-eye-off-line text-xs" : "ri-eye-line text-xs"} />
            </button>
          </div>
        </div>
      ))}

      <div className="pt-2">
        <button
          type="submit"
          disabled={savingPassword || !newPassword}
          className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#253C7D] dark:bg-blue-600 hover:bg-[#1E3064] dark:hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer active:scale-95 disabled:opacity-50"
        >
          <i className="ri-save-line text-xs" />
          <span>{savingPassword ? "Updating..." : "Update Password"}</span>
        </button>
      </div>
    </form>
  );
});
