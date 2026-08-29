import React, { memo, useMemo } from "react";
import type { AppRole, DirectoryEmployee, NewUserState, UserAssignment } from "../types";
import { AddUserForm } from "./AddUserForm";

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
  users,
  roles,
  employees,
  branches,
  filterBranch,
  setFilterBranch,
  searchQuery,
  setSearchQuery,
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
  const assignableRoles = useMemo(() => {
    return isSuperAdmin ? roles : roles.filter((r) => !r.is_admin && r.name !== "Super Admin");
  }, [roles, isSuperAdmin]);

  // Filter users by search and branch
  const displayedUsers = useMemo(() => {
    return users.filter((u) => {
      // Branch filter (if specific branch or site selected)
      if (filterBranch !== "all") {
        if (filterBranch.startsWith("site:")) {
          const sId = filterBranch.substring(5);
          if (u.default_work_location_id !== sId) return false;
        } else {
          // Check branch id match or branch name match
          const targetB = branches.find((b) => b.id === filterBranch);
          const isDirectMatch = u.branch_id === filterBranch;
          const isNameMatch = targetB && u.branch_name && u.branch_name.toLowerCase() === targetB.name.toLowerCase();
          if (!isDirectMatch && !isNameMatch) return false;
        }
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const name = (u.display_name || "").toLowerCase();
        const email = (u.email || "").toLowerCase();
        const role = (u.app_roles?.name || "").toLowerCase();
        const branch = (u.branch_name || "").toLowerCase();
        const site = (u.site_name || "").toLowerCase();
        return name.includes(q) || email.includes(q) || role.includes(q) || branch.includes(q) || site.includes(q);
      }

      return true;
    });
  }, [users, filterBranch, searchQuery, branches]);

  // Branch user counts
  const branchCounts = useMemo(() => {
    const map: Record<string, number> = {};
    users.forEach((u) => {
      if (u.branch_id) {
        map[u.branch_id] = (map[u.branch_id] || 0) + 1;
      }
      if (u.default_work_location_id) {
        const sKey = `site:${u.default_work_location_id}`;
        map[sKey] = (map[sKey] || 0) + 1;
      }
      // Also fallback by branch_name if branch_id is null
      if (!u.branch_id && u.branch_name) {
        const matched = branches.find((b) => !b.is_site && b.name.toLowerCase() === u.branch_name?.toLowerCase());
        if (matched) {
          map[matched.id] = (map[matched.id] || 0) + 1;
        }
      }
    });
    return map;
  }, [users, branches]);

  return (
    <div className="space-y-4">
      {/* Top Header & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-gray-900">
            {displayedUsers.length} {displayedUsers.length === 1 ? "User" : "Users"} Listed
            {filterBranch !== "all" && (
              <span className="text-xs font-normal text-gray-500 ml-1.5">
                (filtered from {users.length} total)
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onAddCurrentUser}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gray-100 text-gray-700 rounded-xl text-xs font-semibold hover:bg-gray-200 transition-colors cursor-pointer whitespace-nowrap"
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
            className="flex items-center gap-1.5 px-4 py-2 bg-[#253C7D] text-white rounded-xl text-xs font-semibold hover:bg-[#1F336A] shadow-xs hover:shadow-sm transition-all cursor-pointer whitespace-nowrap"
          >
            <i className="ri-add-line" />
            Add User
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-gray-200/80 rounded-2xl p-3.5 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Search Box */}
          <div className="relative flex-1 w-full">
            <i className="ri-search-line absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search user by name, email, role, or branch..."
              className="w-full pl-9 pr-8 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#253C7D]/20 focus:border-[#253C7D] transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5"
              >
                <i className="ri-close-line text-sm" />
              </button>
            )}
          </div>

          {/* Branch Filter Selector (for Super Admin) */}
          {isSuperAdmin && branches.length > 0 && (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs font-semibold text-gray-500 whitespace-nowrap hidden md:inline">
                <i className="ri-building-line mr-1 text-[#253C7D]" /> Branch:
              </span>
              <select
                value={filterBranch}
                onChange={(e) => setFilterBranch(e.target.value)}
                className="w-full sm:w-auto px-3 py-2 border border-gray-200 rounded-xl text-xs font-medium text-gray-700 bg-gray-50/50 hover:bg-white focus:outline-none focus:ring-2 focus:ring-[#253C7D]/20 focus:border-[#253C7D] transition-all cursor-pointer"
              >
                <option value="all">🏢 All Branches ({users.length})</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.is_site ? `↳ ${b.name} (Site)` : `📍 ${b.name}`} ({branchCounts[b.id] || 0})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Quick Branch Filter Pills */}
        {isSuperAdmin && branches.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 scrollbar-none">
            <button
              onClick={() => setFilterBranch("all")}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                filterBranch === "all"
                  ? "bg-[#253C7D] text-white shadow-2xs"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200/80"
              }`}
            >
              <span>All</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  filterBranch === "all"
                    ? "bg-white/20 text-white"
                    : "bg-gray-200/80 text-gray-500"
                }`}
              >
                {users.length}
              </span>
            </button>
            {branches.map((b) => {
              const count = branchCounts[b.id] || 0;
              const isSelected = filterBranch === b.id;
              return (
                <button
                  key={b.id}
                  onClick={() => setFilterBranch(b.id)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? "bg-[#253C7D] text-white shadow-2xs"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200/80"
                  }`}
                >
                  <span>{b.is_site ? `↳ ${b.name}` : b.name}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      isSelected
                        ? "bg-white/20 text-white"
                        : "bg-gray-200/80 text-gray-500"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}
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
      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-2xs">
        {displayedUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400 p-6 text-center">
            <i className="ri-team-line text-4xl mb-2 text-gray-300" />
            <p className="text-sm font-semibold text-gray-700">No users found</p>
            <p className="text-xs text-gray-400 mt-1">
              {searchQuery || filterBranch !== "all"
                ? "Try clearing your branch filter or search query."
                : "Click \"Add User\" to provision a new user account."}
            </p>
          </div>
        ) : (
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
                      {/* Branch Badge */}
                      <span className="text-[10px] font-medium text-[#253C7D] bg-blue-50/80 border border-blue-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <i className="ri-building-line text-[9px]" />
                        {user.branch_name || "Headquarters"}
                      </span>
                      {/* Site Badge */}
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
                    {/* Pending badge */}
                    {user.user_id && isUnconfirmed && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 shrink-0 whitespace-nowrap">
                        Pending
                      </span>
                    )}
                    {/* Resend invite */}
                    {(!user.user_id || isUnconfirmed) && canModifyUser && (
                      <button
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
        )}
      </div>

      {/* Info box */}
      <div className="bg-amber-50/70 border border-amber-100 rounded-xl p-4 flex gap-3">
        <i className="ri-information-line text-amber-500 text-lg shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-amber-800">Branch & Role Management</p>
          <p className="text-xs text-amber-700 mt-1">
            Super Admins can view and manage users across all branches or filter by a specific branch. Users are matched by their email and automatically inherit their assigned branch from the Employee Directory.
          </p>
        </div>
      </div>
    </div>
  );
});
