import { memo } from "react";
import type { AppRole, DirectoryEmployee, NewUserState, UserAssignment } from "../types";
import { AddUserForm } from "./AddUserForm";
import { UsersFilterBar } from "./UsersFilterBar";
import { UsersTable } from "./UsersTable";
import { useUsersTabFilter } from "../hooks/useUsersTabFilter";

interface BranchOption {
  id: string;
  name: string;
  is_site?: boolean;
  branch_id?: string;
}

interface UsersTabProps {
  users: UserAssignment[];
  roles: AppRole[];
  employees: DirectoryEmployee[];
  branches: BranchOption[];
  filterBranch: string;
  setFilterBranch: (branchId: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
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
  users = [],
  roles = [],
  employees = [],
  branches = [],
  filterBranch = "all",
  setFilterBranch,
  searchQuery = "",
  setSearchQuery,
  unconfirmedEmails = new Set(),
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
  const assignableRoles = isSuperAdmin
    ? roles
    : (roles || []).filter((r) => !r?.is_admin && r?.name !== "Super Admin");

  const { displayedUsers, branchCounts, scopedTotal } = useUsersTabFilter(
    users,
    branches,
    filterBranch,
    searchQuery,
    isSuperAdmin
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-slate-100">
            {displayedUsers.length} {displayedUsers.length === 1 ? "User" : "Users"} Listed
            {isSuperAdmin && filterBranch !== "all" && (
              <span className="text-xs font-normal text-gray-500 dark:text-slate-400 ml-1.5">
                (filtered from {scopedTotal} total)
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onAddCurrentUser}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-200 rounded-xl text-xs font-semibold hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors cursor-pointer whitespace-nowrap"
          >
            <i className="ri-user-add-line" />
            Add Me
          </button>
          <button
            type="button"
            onClick={() => setShowAddUser(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#253C7D] hover:bg-[#1E3064] text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shadow-2xs"
          >
            <i className="ri-add-line" />
            Add User
          </button>
        </div>
      </div>

      <UsersFilterBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        filterBranch={filterBranch}
        setFilterBranch={setFilterBranch}
        isSuperAdmin={isSuperAdmin}
        branches={branches}
        branchCounts={branchCounts}
        scopedTotal={scopedTotal}
      />

      {userLoadError && (
        <div className="bg-red-50 dark:bg-rose-950/40 border border-red-100 dark:border-rose-900/50 rounded-xl p-4 flex gap-3 text-red-700 dark:text-rose-300">
          <i className="ri-error-warning-line text-lg shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold">Could not fetch Supabase Auth accounts</p>
            <p className="text-xs mt-1 text-red-600 dark:text-rose-400">{userLoadError}</p>
          </div>
        </div>
      )}

      <AddUserForm
        isOpen={showAddUser}
        onClose={() => setShowAddUser(false)}
        newUser={newUser}
        setNewUser={setNewUser}
        selectedEmployeeEmail={selectedEmployeeEmail}
        setSelectedEmployeeEmail={setSelectedEmployeeEmail}
        employees={employees}
        branches={branches}
        filterBranch={filterBranch}
        roles={assignableRoles}
        savingUser={savingUser}
        onSaveUser={onSaveNewUser}
      />

      <UsersTable
        displayedUsers={displayedUsers}
        assignableRoles={assignableRoles}
        unconfirmedEmails={unconfirmedEmails}
        invitingUserId={invitingUserId}
        isSuperAdmin={isSuperAdmin}
        searchQuery={searchQuery}
        filterBranch={filterBranch}
        onUpdateUserRole={onUpdateUserRole}
        onResendInvite={onResendInvite}
        onRemoveUser={onRemoveUser}
      />

      <div className="bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200/70 dark:border-amber-900/50 rounded-xl p-4 flex gap-3 shadow-2xs">
        <i className="ri-information-line text-amber-500 dark:text-amber-400 text-lg shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">Branch & Role Management</p>
          <p className="text-xs text-amber-750 dark:text-amber-300/80 mt-1 leading-relaxed">
            Super Admins can view and manage users across all branches or filter by a specific branch. Users are matched by their email and automatically inherit their assigned branch from the Employee Directory.
          </p>
        </div>
      </div>
    </div>
  );
});
