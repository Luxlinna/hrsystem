import React, { memo } from "react";
import type { AppRole, DirectoryEmployee, NewUserState, UserAssignment } from "../types";
import { AddUserForm } from "./AddUserForm";

interface UsersTabProps {
  users: UserAssignment[];
  roles: AppRole[];
  employees: DirectoryEmployee[];
  unconfirmedEmails: Set<string>;
  invitingUserId: number | null;
  userLoadError: string | null;
  showAddUser: boolean;
  setShowAddUser: (show: boolean) => void;
  newUser: NewUserState;
  setNewUser: React.Dispatch<React.SetStateAction<NewUserState>>;
  selectedEmployeeEmail: string;
  setSelectedEmployeeEmail: (email: string) => void;
  savingUser: boolean;
  isSuperAdmin?: boolean;
  onAddCurrentUser: () => void;
  onSaveNewUser: () => void;
  onResendInvite: (user: UserAssignment) => void;
  onUpdateUserRole: (user: UserAssignment, roleId: number | null) => void;
  onRemoveUser: (user: UserAssignment) => void;
}

export const UsersTab = memo(function UsersTab({
  users,
  roles,
  employees,
  unconfirmedEmails,
  invitingUserId,
  userLoadError,
  showAddUser,
  setShowAddUser,
  newUser,
  setNewUser,
  selectedEmployeeEmail,
  setSelectedEmployeeEmail,
  savingUser,
  isSuperAdmin = true,
  onAddCurrentUser,
  onSaveNewUser,
  onResendInvite,
  onUpdateUserRole,
  onRemoveUser,
}: UsersTabProps) {
  const assignableRoles = React.useMemo(() => {
    return isSuperAdmin ? roles : roles.filter((r) => !r.is_admin && r.name !== "Super Admin");
  }, [roles, isSuperAdmin]);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-gray-500">{users.length} users assigned</p>
        <div className="flex gap-2">
          <button
            onClick={onAddCurrentUser}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm hover:bg-gray-200 transition-colors cursor-pointer whitespace-nowrap"
          >
            <i className="ri-user-add-line" />
            Add Me
          </button>
          <button
            onClick={() => {
              setSelectedEmployeeEmail("");
              setNewUser({ email: "", display_name: "", role_id: "", sendInvite: true });
              setShowAddUser(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-[#253C7D] text-white rounded-xl text-sm hover:bg-[#1F336A] transition-colors cursor-pointer whitespace-nowrap"
          >
            <i className="ri-add-line" />
            Add User
          </button>
        </div>
      </div>

      {userLoadError && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex gap-3 text-red-700">
          <i className="ri-error-warning-line text-lg shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold">Could not fetch Supabase Auth accounts</p>
            <p className="text-xs mt-1">{userLoadError}</p>
          </div>
        </div>
      )}

      {/* Add user form */}
      <AddUserForm
        isOpen={showAddUser}
        onClose={() => setShowAddUser(false)}
        newUser={newUser}
        setNewUser={setNewUser}
        selectedEmployeeEmail={selectedEmployeeEmail}
        setSelectedEmployeeEmail={setSelectedEmployeeEmail}
        employees={employees}
        roles={assignableRoles}
        savingUser={savingUser}
        onSaveUser={onSaveNewUser}
      />

      {/* User list */}
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
        {users.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-gray-400">
            <i className="ri-team-line text-3xl mb-2" />
            <p className="text-sm">No users assigned yet. Click &quot;Add Me&quot; to start.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {users.map((user) => {
              const isUnconfirmed = unconfirmedEmails.has(user.email?.toLowerCase() ?? "");
              const isSuperUser = user.app_roles?.is_admin || user.app_roles?.name === "Super Admin";
              const canModifyUser = isSuperAdmin || !isSuperUser;

              return (
                <div key={user.id} className="flex flex-wrap items-center gap-4 px-5 py-4">
                  <div className="w-10 h-10 rounded-xl bg-[#253C7D]/10 flex items-center justify-center text-[#253C7D] text-[12px] font-bold shrink-0">
                    {(user.display_name || user.email).slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-900 truncate">{user.display_name || user.email}</p>
                      {isSuperUser && (
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded-full">
                          Super Admin
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 truncate">{user.email}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {canModifyUser ? (
                      <select
                        value={user.role_id || ""}
                        onChange={(e) => onUpdateUserRole(user, e.target.value ? parseInt(e.target.value) : null)}
                        className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#253C7D]/30 cursor-pointer"
                      >
                        <option value="">No role (no access until assigned)</option>
                        {assignableRoles.map((r) => (
                          <option key={r.id} value={r.id}>{r.name}</option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-xs text-gray-500 font-medium px-2 py-1 bg-gray-50 rounded-lg border border-gray-200">
                        {user.app_roles?.name || "Super Admin"}
                      </span>
                    )}
                    {user.app_roles && (
                      <span
                        className="text-[10px] font-semibold px-2 py-0.5 rounded-full text-white shrink-0"
                        style={{ backgroundColor: user.app_roles.color }}
                      >
                        {user.app_roles.name}
                      </span>
                    )}
                    {/* Pending badge — invited but email not yet confirmed */}
                    {user.user_id && isUnconfirmed && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 shrink-0 whitespace-nowrap">
                        Pending
                      </span>
                    )}
                    {/* Resend invite — show for: (a) no user_id yet, or (b) user_id set but email unconfirmed */}
                    {(!user.user_id || isUnconfirmed) && canModifyUser && (
                      <button
                        onClick={() => onResendInvite(user)}
                        disabled={invitingUserId === user.id}
                        title={isUnconfirmed ? "Resend invite — previous link may have expired" : "Send invite email"}
                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-400 cursor-pointer shrink-0 disabled:opacity-60"
                      >
                        {invitingUserId === user.id ? (
                          <span className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <i className="ri-mail-send-line text-sm" />
                        )}
                      </button>
                    )}
                    {canModifyUser && (
                      <button
                        onClick={() => onRemoveUser(user)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-red-50 hover:bg-red-100 text-red-400 cursor-pointer shrink-0"
                      >
                        <i className="ri-delete-bin-line text-sm" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Info box */}
      <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex gap-3">
        <i className="ri-information-line text-amber-500 text-lg shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-amber-800">How it works</p>
          <p className="text-xs text-amber-700 mt-1">
            Users are matched by their account email. You can add a user by email before they sign up — the assignment links automatically the first time they log in. Users with no role assigned have no access until an admin assigns one. Role restrictions determine which modules a user can open, including in the sidebar and navigation.
          </p>
        </div>
      </div>
    </div>
  );
});
