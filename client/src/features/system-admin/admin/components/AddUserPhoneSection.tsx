import type { NewUserState } from "../types";

interface AddUserPhoneSectionProps {
  newUser: NewUserState;
  setNewUser: React.Dispatch<React.SetStateAction<NewUserState>>;
  showPassword: boolean;
  setShowPassword: React.Dispatch<React.SetStateAction<boolean>>;
  onGeneratePassword: () => void;
}

export function AddUserPhoneSection({
  newUser,
  setNewUser,
  showPassword,
  setShowPassword,
  onGeneratePassword,
}: AddUserPhoneSectionProps) {
  if (newUser.sendInvite) {
    return (
      <div className="p-3 bg-gray-50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 rounded-lg text-xs text-gray-600 dark:text-slate-300">
        <p>
          A secure 24-hour setup link will be generated. You can share it directly to{" "}
          <strong className="text-gray-900 dark:text-slate-100">{newUser.phone || "the employee"}</strong> on Telegram so they can create their own password.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2 pt-1 border-t border-gray-100 dark:border-slate-800">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-gray-700 dark:text-slate-300">
          Initial Password <span className="text-red-500">*</span>
        </label>
        <button
          type="button"
          onClick={onGeneratePassword}
          className="text-[11px] font-medium text-[#253C7D] dark:text-sky-400 hover:underline cursor-pointer"
        >
          Auto-Generate Password
        </button>
      </div>
      <div className="relative max-w-sm">
        <input
          type={showPassword ? "text" : "password"}
          value={newUser.password || ""}
          onChange={(e) => setNewUser((p) => ({ ...p, password: e.target.value }))}
          placeholder="Minimum 6 characters"
          className="w-full pl-3 pr-8 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-xs text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-[#253C7D] h-[36px]"
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 cursor-pointer"
        >
          <i className={showPassword ? "ri-eye-off-line text-xs" : "ri-eye-line text-xs"} />
        </button>
      </div>
    </div>
  );
}
