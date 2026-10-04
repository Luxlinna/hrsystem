import type { UserAssignment } from "../types";

interface PhonePasswordSuccessViewProps {
  user: UserAssignment;
  phone: string;
  newPhonePassword: string;
  copied: boolean;
  onCopyCredentials: () => void;
  onClose: () => void;
}

export function PhonePasswordSuccessView({
  user,
  phone,
  newPhonePassword,
  copied,
  onCopyCredentials,
  onClose,
}: PhonePasswordSuccessViewProps) {
  return (
    <div className="p-6 space-y-4">
      <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 flex items-start gap-3">
        <i className="ri-checkbox-circle-fill text-emerald-600 dark:text-emerald-400 text-xl shrink-0 mt-0.5" />
        <div className="text-xs text-emerald-900 dark:text-emerald-200">
          <p className="font-bold text-sm text-emerald-950 dark:text-emerald-100 mb-0.5">Password Successfully Saved</p>
          <p><strong>{user.display_name || "Staff"}</strong> can now log in using this password.</p>
        </div>
      </div>

      <div className="bg-gray-50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 rounded-xl p-4 space-y-2 text-xs">
        <div className="flex justify-between items-center">
          <span className="text-gray-500 dark:text-slate-400">Phone:</span>
          <span className="font-mono font-bold text-gray-900 dark:text-slate-100">{phone}</span>
        </div>
        <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-slate-700">
          <span className="text-gray-500 dark:text-slate-400">New Password:</span>
          <span className="font-mono font-bold text-[#253C7D] dark:text-sky-300">{newPhonePassword}</span>
        </div>
      </div>

      <button
        type="button"
        onClick={onCopyCredentials}
        className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs ${
          copied ? "bg-emerald-600 text-white" : "bg-[#253C7D] text-white hover:bg-[#1d3066]"
        }`}
      >
        <i className={copied ? "ri-check-double-line text-sm" : "ri-file-copy-line text-sm"} />
        <span>{copied ? "Copied to Clipboard!" : "Copy Login Info to Share"}</span>
      </button>

      <button
        type="button"
        onClick={onClose}
        className="w-full py-2.5 px-4 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
      >
        Close
      </button>
    </div>
  );
}
