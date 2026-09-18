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
    <div className="flex items-center justify-end gap-3 pt-2">
      <button
        type="button"
        onClick={onClose}
        className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-slate-300 hover:text-gray-800 dark:hover:text-white bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
      >
        Cancel
      </button>
      <button
        type="button"
        onClick={onSaveUser}
        disabled={isSubmitDisabled}
        className="px-5 py-2 text-xs font-semibold text-white bg-[#253C7D] hover:bg-[#1F336A] rounded-xl shadow-xs transition-all disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed flex items-center gap-1.5"
      >
        {savingUser ? (
          <>
            <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span>Saving...</span>
          </>
        ) : accountType === "phone" ? (
          newUser.sendInvite ? (
            <>
              <i className="ri-telegram-fill text-sm" />
              <span>Invite via Telegram</span>
            </>
          ) : (
            <>
              <i className="ri-shield-keyhole-line text-sm" />
              <span>Create Phone Account</span>
            </>
          )
        ) : newUser.sendInvite ? (
          <>
            <i className="ri-check-line text-sm" />
            <span>Send Invite &amp; Save</span>
          </>
        ) : (
          <>
            <i className="ri-check-line text-sm" />
            <span>Save User</span>
          </>
        )}
      </button>
    </div>
  );
}
