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
    <div className="flex flex-wrap items-center justify-between gap-3 pb-1">
      {/* Segmented Account Type Tabs */}
      <div className="flex items-center gap-1.5 p-0.5 bg-gray-100 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
        <button
          type="button"
          onClick={() => onSwitchAccountType("email")}
          className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
            accountType === "email"
              ? "bg-white dark:bg-slate-900 text-[#253C7D] dark:text-sky-400 shadow-xs"
              : "text-gray-500 hover:text-gray-800 dark:text-slate-400 dark:hover:text-slate-200"
          }`}
        >
          <i className="ri-mail-line text-xs" />
          <span>Email Account</span>
        </button>

        <button
          type="button"
          onClick={() => onSwitchAccountType("phone")}
          className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
            accountType === "phone"
              ? "bg-white dark:bg-slate-900 text-[#253C7D] dark:text-sky-400 shadow-xs"
              : "text-gray-500 hover:text-gray-800 dark:text-slate-400 dark:hover:text-slate-200"
          }`}
        >
          <i className="ri-phone-line text-xs" />
          <span>Phone Account</span>
        </button>
      </div>

      {/* Invite Delivery Option */}
      {accountType === "email" ? (
        <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-gray-600 dark:text-slate-300">
          <input
            type="checkbox"
            id="sendInvite"
            checked={newUser.sendInvite}
            onChange={(e) => setNewUser((p) => ({ ...p, sendInvite: e.target.checked }))}
            className="rounded border-gray-300 text-[#253C7D] focus:ring-0 cursor-pointer"
          />
          <span>Send invitation email to set password</span>
        </label>
      ) : (
        <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-slate-300">
          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <input
              type="radio"
              name="phoneAccountMode"
              checked={newUser.sendInvite}
              onChange={() => setNewUser((p) => ({ ...p, sendInvite: true }))}
              className="text-[#253C7D] focus:ring-0 cursor-pointer"
            />
            <span>Invite via Telegram link</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <input
              type="radio"
              name="phoneAccountMode"
              checked={!newUser.sendInvite}
              onChange={() => setNewUser((p) => ({ ...p, sendInvite: false }))}
              className="text-[#253C7D] focus:ring-0 cursor-pointer"
            />
            <span>Set password manually</span>
          </label>
        </div>
      )}
    </div>
  );
}
