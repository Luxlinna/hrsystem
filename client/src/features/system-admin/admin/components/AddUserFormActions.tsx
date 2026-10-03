import type { NewUserState } from "../types";

interface AddUserFormActionsProps {
  savingUser: boolean;
  accountType: "email" | "phone";
  newUser: NewUserState;
  isSubmitDisabled: boolean;
  onClose: () => void;
  onSaveUser: () => void;
}

export function AddUserFormActions({
  savingUser,
  accountType,
  newUser,
  isSubmitDisabled,
  onClose,
  onSaveUser,
}: AddUserFormActionsProps) {
  return (
    <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 dark:border-slate-800">
      <button
        type="button"
        onClick={onClose}
        className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition-colors"
      >
        Cancel
      </button>
      <button
        type="button"
        onClick={onSaveUser}
        disabled={isSubmitDisabled}
        className="flex items-center gap-1.5 px-4 py-2 bg-[#253C7D] dark:bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-[#1F336A] dark:hover:bg-blue-700 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed shadow-xs transition-colors"
      >
        {savingUser ? (
          <>
            <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span>Saving...</span>
          </>
        ) : accountType === "phone" ? (
          newUser.sendInvite ? (
            <span>Send Telegram Setup Link</span>
          ) : (
            <span>Create Phone Account</span>
          )
        ) : newUser.sendInvite ? (
          <span>Send Invitation &amp; Save</span>
        ) : (
          <span>Create User</span>
        )}
      </button>
    </div>
  );
}
