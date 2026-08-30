import { memo } from "react";
import type { AppRole, UserAssignment } from "../types";

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
  if (displayedUsers.length === 0) {
    return (
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-2xs">
        <div className="flex flex-col items-center justify-center h-48 text-gray-400 p-6 text-center">
          <i className="ri-team-line text-4xl mb-2 text-gray-300" />
          <p className="text-sm font-semibold text-gray-700">No users found</p>
          <p className="text-xs text-gray-400 mt-1">
            {searchQuery || filterBranch !== "all"
              ? "Try clearing your branch filter or search query."
              : 'Click "Add User" to provision a new user account.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-2xs">
      <div className="divide-y divide-gray-50">
        {displayedUsers.map((user) => {
          const isUnconfirmed = unconfirmedEmails.has(user.email?.toLowerCase() ?? "");
          const isSuperUser = user.app_roles?.is_admin || user.app_roles?.name === "Super Admin";
          const canModifyUser = isSuperAdmin || !isSuperUser;

          return (
            <div key={user.id} className="flex flex-wrap items-center gap-3.5 px-5 py-3.5 hover:bg-gray-50/50 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-[#253C7D]/10 flex items-center justify-center text-[#253C7D] text-[12px] font-bold shrink-0 shadow-2xs">
                {(user.display_name || user.email).slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-[200px]">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-gray-900 truncate">{user.display_name || user.email}</p>
                  {isSuperUser && (
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded-full">
                      Super Admin
                    </span>
                  )}
                  <span className="text-[10px] font-medium text-[#253C7D] bg-blue-50/80 border border-blue-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <i className="ri-building-line text-[9px]" />
                    {user.branch_name || "Headquarters"}
                  </span>
                  {user.site_name && (
                    <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <i className="ri-map-pin-2-line text-[9px]" />
                      {user.site_name}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400 truncate mt-0.5">{user.email}</p>
              </div>
              <div className="flex items-center gap-2.5 flex-wrap">
                {canModifyUser ? (
                  <select
                    value={user.role_id || ""}
                    onChange={(e) => onUpdateUserRole(user, e.target.value ? parseInt(e.target.value) : null)}
                    className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#253C7D]/30 cursor-pointer"
                  >
                    <option value="">No role (no access)</option>
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
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-full text-white shrink-0 shadow-2xs"
                    style={{ backgroundColor: user.app_roles.color }}
                  >
                    {user.app_roles.name}
                  </span>
                )}
                {user.user_id && isUnconfirmed && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 shrink-0 whitespace-nowrap">
                    Pending
                  </span>
                )}
                {(!user.user_id || isUnconfirmed) && canModifyUser && (
                  <button
                    type="button"
                    onClick={() => onResendInvite(user)}
                    disabled={invitingUserId === user.id}
                    title={isUnconfirmed ? "Resend invite link" : "Send invite email"}
                    className="w-7 h-7 flex items-center justify-center rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-500 cursor-pointer shrink-0 disabled:opacity-60 transition-colors"
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
                    type="button"
                    onClick={() => onRemoveUser(user)}
                    title="Remove user assignment"
                    className="w-7 h-7 flex items-center justify-center rounded-lg bg-red-50 hover:bg-red-100 text-red-500 cursor-pointer shrink-0 transition-colors"
                  >
                    <i className="ri-delete-bin-line text-sm" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});
