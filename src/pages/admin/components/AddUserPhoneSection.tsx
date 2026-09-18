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
      <div className="p-4 bg-sky-50/70 dark:bg-sky-950/40 border border-sky-200/80 dark:border-sky-800/60 rounded-xl space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold text-sky-950 dark:text-sky-200">
          <i className="ri-telegram-fill text-[#229ED9] text-base" />
          <span>1-Click Telegram Setup Link</span>
          <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100/80 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-transparent dark:border-emerald-800/50">
            Free $0.00
          </span>
        </div>
        <p className="text-[11px] text-sky-900 dark:text-sky-300 leading-relaxed">
          A secure 24-hour setup link will be generated. You can share it directly to{" "}
          <strong>{newUser.phone || "the employee"}</strong> on Telegram in 1 click so they can create their own password safely.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-blue-50/50 dark:bg-slate-800/60 border border-blue-100 dark:border-slate-700 rounded-xl space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-gray-800 dark:text-slate-200">Initial Password *</label>
        <button
          type="button"
          onClick={onGeneratePassword}
          className="text-[11px] font-bold text-[#253C7D] dark:text-sky-400 hover:underline flex items-center gap-1 cursor-pointer"
        >
          <i className="ri-magic-line text-xs" />
          <span>Auto-Generate</span>
        </button>
      </div>
      <div className="relative max-w-md">
        <input
          type={showPassword ? "text" : "password"}
          value={newUser.password || ""}
          onChange={(e) => setNewUser((p) => ({ ...p, password: e.target.value }))}
          placeholder="Minimum 6 characters"
          className="w-full pl-3.5 pr-10 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#253C7D]/20 dark:focus:ring-sky-500/20 focus:border-[#253C7D] dark:focus:border-sky-500 transition-all"
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 cursor-pointer"
        >
          <i className={showPassword ? "ri-eye-off-line text-sm" : "ri-eye-line text-sm"} />
        </button>
      </div>
      <p className="text-[11px] text-gray-500 dark:text-slate-400">
        Share this password with the staff member. They will sign in using their phone number{" "}
        <strong>{newUser.phone || "..."}</strong> and this password.
      </p>
    </div>
  );
}
