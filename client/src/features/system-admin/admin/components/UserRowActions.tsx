import type { UserAssignment } from "../types";

interface UserRowActionsProps {
  user: UserAssignment;
  isUnconfirmed: boolean;
  isPhoneUser: boolean;
  invitingUserId: number | null;
  onResendInvite: (user: UserAssignment) => void;
  onOpenPhoneModal: (user: UserAssignment) => void;
  onRemoveUser: (user: UserAssignment) => void;
}

export function UserRowActions({
  user,
  isUnconfirmed,
  isPhoneUser,
  invitingUserId,
  onResendInvite,
  onOpenPhoneModal,
  onRemoveUser,
}: UserRowActionsProps) {
  return (
    <>
      {isPhoneUser ? (
        <>
          <button
            type="button"
            onClick={() => onResendInvite(user)}
            disabled={invitingUserId === user.id}
            title="Telegram invite & setup link"
            className="w-8 h-8 flex items-center justify-center rounded-xl bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-100 dark:hover:bg-sky-900/60 text-[#229ED9] dark:text-sky-400 transition-colors cursor-pointer shrink-0 shadow-2xs disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <i className={`ri-${invitingUserId === user.id ? "loader-4-line animate-spin" : "telegram-fill"} text-base`} />
          </button>
          <button
            type="button"
            onClick={() => onOpenPhoneModal(user)}
            title="Reset or set phone account password manually"
            className="w-8 h-8 flex items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-[#253C7D] dark:text-indigo-300 transition-colors cursor-pointer shrink-0 shadow-2xs"
          >
            <i className="ri-key-2-line text-base" />
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={() => onResendInvite(user)}
          disabled={invitingUserId === user.id}
          title={isUnconfirmed ? "Resend invitation email link" : "User already confirmed their account"}
          className="w-8 h-8 flex items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0 shadow-2xs"
        >
          <i className={`ri-${invitingUserId === user.id ? "loader-4-line animate-spin" : isUnconfirmed ? "mail-send-line" : "mail-check-line"} text-base`} />
        </button>
      )}

      <button
        type="button"
        onClick={() => onRemoveUser(user)}
        title="Remove user assignment"
        className="w-8 h-8 flex items-center justify-center rounded-xl bg-red-50 dark:bg-rose-950/60 hover:bg-red-100 dark:hover:bg-rose-900/60 text-red-500 dark:text-rose-400 cursor-pointer shrink-0 transition-colors shadow-2xs"
      >
        <i className="ri-delete-bin-line text-base" />
      </button>
    </>
  );
}
