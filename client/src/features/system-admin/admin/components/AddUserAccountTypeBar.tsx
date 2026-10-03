import type { NewUserState } from "../types";

interface AddUserAccountTypeBarProps {
  accountType: "email" | "phone";
  newUser: NewUserState;
  setNewUser: React.Dispatch<React.SetStateAction<NewUserState>>;
  onSwitchAccountType: (type: "email" | "phone") => void;
}

export function AddUserAccountTypeBar({
  accountType,
  newUser,
  setNewUser,
  onSwitchAccountType,
}: AddUserAccountTypeBarProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-white/90 dark:bg-slate-800/80 border border-gray-200/90 dark:border-slate-700 rounded-xl shadow-2xs">
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-gray-700 dark:text-slate-300">Account Type:</span>
        <div className="flex items-center bg-gray-100 dark:bg-slate-700 p-0.5 rounded-lg text-xs font-medium">
          <button
            type="button"
            onClick={() => onSwitchAccountType("email")}
            className={`px-3 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
              accountType === "email"
                ? "bg-white dark:bg-slate-800 text-[#253C7D] dark:text-sky-300 shadow-xs font-bold"
                : "text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200"
            }`}
          >
            <i className="ri-mail-line text-xs" />
            <span>Email Account</span>
          </button>
          <button
            type="button"
            onClick={() => onSwitchAccountType("phone")}
            className={`px-3 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
              accountType === "phone"
                ? "bg-white dark:bg-slate-800 text-[#253C7D] dark:text-sky-300 shadow-xs font-bold"
                : "text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200"
            }`}
          >
            <i className="ri-phone-line text-xs" />
            <span>Phone Number Account</span>
          </button>
        </div>
      </div>

      {accountType === "email" ? (
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            id="sendInvite"
            checked={newUser.sendInvite}
            onChange={(e) => setNewUser((p) => ({ ...p, sendInvite: e.target.checked }))}
            className="w-4 h-4 rounded cursor-pointer accent-[#253C7D]"
          />
          <span className="text-xs text-gray-700 dark:text-slate-300 font-medium">Send setup link via Gmail</span>
        </label>
      ) : (
        <div className="flex items-center gap-4 flex-wrap">
          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <input
              type="radio"
              name="phoneAccountMode"
              checked={newUser.sendInvite}
              onChange={() => setNewUser((p) => ({ ...p, sendInvite: true }))}
              className="w-3.5 h-3.5 cursor-pointer accent-[#229ED9]"
            />
            <span className="text-xs text-gray-800 dark:text-slate-200 font-semibold flex items-center gap-1">
              <i className="ri-telegram-fill text-[#229ED9] text-sm" />
              Invite via Telegram
            </span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <input
              type="radio"
              name="phoneAccountMode"
              checked={!newUser.sendInvite}
              onChange={() => setNewUser((p) => ({ ...p, sendInvite: false }))}
              className="w-3.5 h-3.5 cursor-pointer accent-[#253C7D]"
            />
            <span className="text-xs text-gray-600 dark:text-slate-400 font-medium">Set password manually</span>
          </label>
        </div>
      )}
    </div>
  );
}
