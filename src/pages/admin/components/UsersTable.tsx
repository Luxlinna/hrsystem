import { memo, useState, useCallback } from "react";
import type { AppRole, UserAssignment } from "../types";
import { UserRowItem } from "./UserRowItem";
import { PhonePasswordModal } from "./PhonePasswordModal";

interface UsersTableProps {
  displayedUsers: UserAssignment[];
  assignableRoles: AppRole[];
  unconfirmedEmails: Set<string>;
  invitingUserId: number | null;
  isSuperAdmin: boolean;
  searchQuery: string;
  filterBranch: string;
  onUpdateUserRole: (user: UserAssignment, roleId: number | null) => void;
  onResendInvite: (user: UserAssignment) => void;
  onRemoveUser: (user: UserAssignment) => void;
}

export const UsersTable = memo(function UsersTable({
  displayedUsers,
  assignableRoles,
  unconfirmedEmails,
  invitingUserId,
  isSuperAdmin,
  searchQuery,
  filterBranch,
  onUpdateUserRole,
  onResendInvite,
  onRemoveUser,
}: UsersTableProps) {
  const [phoneModalUser, setPhoneModalUser] = useState<UserAssignment | null>(null);

  const handleOpenPhoneModal = useCallback((user: UserAssignment) => {
    setPhoneModalUser(user);
  }, []);

  const handleClosePhoneModal = useCallback(() => {
    setPhoneModalUser(null);
  }, []);

  if (displayedUsers.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xs">
        <div className="flex flex-col items-center justify-center h-48 text-gray-400 dark:text-slate-500 p-6 text-center">
          <i className="ri-team-line text-4xl mb-2 text-gray-300 dark:text-slate-600" />
          <p className="text-sm font-semibold text-gray-700 dark:text-slate-300">No users found</p>
          <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">
            {searchQuery || filterBranch !== "all"
              ? "Try clearing your branch filter or search query."
              : 'Click "Add User" to provision a new user account.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xs">
        <div className="divide-y divide-gray-50 dark:divide-slate-800">
          {displayedUsers.map((user) => (
            <UserRowItem
              key={user.id}
              user={user}
              assignableRoles={assignableRoles}
              isUnconfirmed={unconfirmedEmails.has(user.email?.toLowerCase() ?? "")}
              isSuperAdmin={isSuperAdmin}
              invitingUserId={invitingUserId}
              onUpdateUserRole={onUpdateUserRole}
              onResendInvite={onResendInvite}
              onRemoveUser={onRemoveUser}
              onOpenPhoneModal={handleOpenPhoneModal}
            />
          ))}
        </div>
      </div>

      <PhonePasswordModal
        user={phoneModalUser}
        onClose={handleClosePhoneModal}
      />
    </>
  );
});
