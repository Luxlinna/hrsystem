import { memo, useState, useMemo } from "react";
import type { AppRole, UserAssignment } from "../types";
import { ALL_MODULES } from "../constants";

interface BranchOption {
  id: string;
  name: string;
  is_site?: boolean;
  branch_id?: string;
}

interface RolesTabProps {
  roles: AppRole[];
  users: UserAssignment[];
  branches?: BranchOption[];
  filterBranch?: string;
  setFilterBranch?: (branchId: string) => void;
  userBranchId?: string | null;
  userBranchName?: string | null;
  isSuperAdmin?: boolean;
  canManageRoles?: boolean;
  onOpenNewRole: () => void;
  onOpenEditRole: (role: AppRole) => void;
  onCloneRole?: (role: AppRole) => void;
  onDeleteRole: (id: number) => void;
}

export const RolesTab = memo(function RolesTab({
  roles = [],
  users = [],
  branches = [],
  filterBranch = "all",
  setFilterBranch,
  userBranchId,
  userBranchName,
  isSuperAdmin = true,
  canManageRoles = true,
  onOpenNewRole,
  onOpenEditRole,
  onCloneRole,
  onDeleteRole,
}: RolesTabProps) {
  const [roleSearch, setRoleSearch] = useState("");
  const [scopeFilter, setScopeFilter] = useState<string>("all");

  const pureBranches = useMemo(() => branches.filter((b) => !b.is_site), [branches]);
  const sites = useMemo(() => branches.filter((b) => b.is_site), [branches]);

  // Filter roles by search and scope filter
  const displayedRoles = useMemo(() => {
    return roles.filter((r) => {
      // 1. Search text
      if (roleSearch.trim()) {
        const q = roleSearch.toLowerCase().trim();
        const matchName = (r.name || "").toLowerCase().includes(q);
        const matchDesc = (r.description || "").toLowerCase().includes(q);
        const matchBranch = (r.branch_name || "").toLowerCase().includes(q);
        const matchSite = (r.site_name || "").toLowerCase().includes(q);
        if (!matchName && !matchDesc && !matchBranch && !matchSite) return false;
      }

      // 2. Scope filter
      if (scopeFilter === "global") {
        return !r.branch_id && !r.work_location_id;
      }
      if (scopeFilter === "bu-only") {
        return Boolean(r.branch_id && !r.work_location_id);
      }
      if (scopeFilter === "site-only") {
        return Boolean(r.work_location_id);
      }
      if (scopeFilter.startsWith("branch:")) {
        const bId = scopeFilter.substring(7);
        return r.branch_id === bId;
      }
      if (scopeFilter.startsWith("site:")) {
        const sId = scopeFilter.substring(5);
        return r.work_location_id === sId;
      }

      return true;
    });
  }, [roles, roleSearch, scopeFilter]);

  // Counts for pills
  const globalCount = useMemo(() => roles.filter((r) => !r.branch_id && !r.work_location_id).length, [roles]);
  const buCount = useMemo(() => roles.filter((r) => Boolean(r.branch_id && !r.work_location_id)).length, [roles]);
  const siteCount = useMemo(() => roles.filter((r) => Boolean(r.work_location_id)).length, [roles]);

  return (
    <div className="space-y-4">
      {/* Header with Search and Create Button */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2">
            <span>Roles & Permissions</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300">
              {displayedRoles.length} {displayedRoles.length === 1 ? "role" : "roles"}
            </span>
          </h2>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
            {isSuperAdmin
              ? "Manage system-wide global roles, BU-specific roles, and location sub-site permissions."
              : `Manage roles and permissions customized for your Business Unit: ${userBranchName || "Your BU"}.`}
          </p>
        </div>

        {canManageRoles && (
          <button
            type="button"
            onClick={onOpenNewRole}
            className="flex items-center gap-2 px-4 py-2 bg-[#253C7D] hover:bg-[#1F336A] text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shadow-2xs"
          >
            <i className="ri-add-line text-sm" />
            {isSuperAdmin ? "New Role" : `New ${userBranchName || "BU"} Role`}
          </button>
        )}
      </div>

      {/* Scope Filter Bar */}
      <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-3 shadow-2xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Quick Scope Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setScopeFilter("all")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                scopeFilter === "all"
                  ? "bg-[#253C7D] text-white shadow-2xs"
                  : "bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700"
              }`}
            >
              All Roles ({roles.length})
            </button>
            <button
              type="button"
              onClick={() => setScopeFilter("global")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                scopeFilter === "global"
                  ? "bg-purple-600 text-white shadow-2xs"
                  : "bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/50"
              }`}
            >
              <i className="ri-global-line text-xs" />
              Global Roles ({globalCount})
            </button>
            <button
              type="button"
              onClick={() => setScopeFilter("bu-only")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                scopeFilter === "bu-only"
                  ? "bg-blue-600 text-white shadow-2xs"
                  : "bg-blue-50 dark:bg-sky-950/40 text-[#253C7D] dark:text-sky-300 hover:bg-blue-100 dark:hover:bg-sky-900/50"
              }`}
            >
              <i className="ri-building-line text-xs" />
              BU Roles ({buCount})
            </button>
            {siteCount > 0 && (
              <button
                type="button"
                onClick={() => setScopeFilter("site-only")}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                  scopeFilter === "site-only"
                    ? "bg-emerald-600 text-white shadow-2xs"
                    : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50"
                }`}
              >
                <i className="ri-map-pin-2-line text-xs" />
                Site Roles ({siteCount})
              </button>
            )}
          </div>

          {/* Specific BU Dropdown (For Super Admin) */}
          {isSuperAdmin && pureBranches.length > 1 && (
            <div className="flex items-center gap-2">
              <label className="text-[11px] font-semibold text-gray-500 dark:text-slate-400">
                Filter BU:
              </label>
              <select
                value={scopeFilter.startsWith("branch:") ? scopeFilter : ""}
                onChange={(e) => setScopeFilter(e.target.value || "all")}
                className="px-2.5 py-1.5 text-xs font-semibold border border-gray-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="">All Business Units</option>
                {pureBranches.map((b) => (
                  <option key={b.id} value={`branch:${b.id}`}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Search Bar */}
        <div className="relative">
          <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 text-xs" />
          <input
            type="text"
            value={roleSearch}
            onChange={(e) => setRoleSearch(e.target.value)}
            placeholder="Search roles by title, module, or Business Unit..."
            className="w-full pl-8 pr-3 py-1.5 bg-gray-50 dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700 rounded-xl text-xs text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-[#253C7D]/30"
          />
        </div>
      </div>

      {/* Role Cards Grid */}
      {displayedRoles.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-8 text-center">
          <i className="ri-shield-line text-4xl text-gray-300 dark:text-slate-600 mb-2 block" />
          <p className="text-sm font-bold text-gray-800 dark:text-slate-200">No roles match your filter</p>
          <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">
            Try clearing your search or switching scope filter tabs.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {displayedRoles.map((role) => {
            const isSuperRole = role.is_admin || role.name === "Super Admin";
            const isGlobalRole = !role.branch_id && !role.work_location_id;
            const belongsToMyBranch = Boolean(
              userBranchId && role.branch_id && role.branch_id === userBranchId
            );
            const canEditThisRole =
              canManageRoles && (isSuperAdmin || (belongsToMyBranch && !isSuperRole));
            const canDeleteThisRole =
              canManageRoles &&
              !isSuperRole &&
              (isSuperAdmin || (belongsToMyBranch && !isGlobalRole));

            return (
              <div
                key={role.id}
                className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-5 shadow-2xs flex flex-col justify-between hover:border-gray-200 dark:hover:border-slate-700 transition-all"
              >
                <div>
                  {/* Top Scope Badge */}
                  <div className="mb-3 flex items-center justify-between gap-2 flex-wrap">
                    {role.work_location_id ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40 flex items-center gap-1 shrink-0">
                        <i className="ri-map-pin-2-fill text-xs" />
                        Site: {role.site_name || "Branch Site"}
                        {role.branch_name && (
                          <span className="text-emerald-600/75 dark:text-emerald-400/75 font-normal">
                            ({role.branch_name})
                          </span>
                        )}
                      </span>
                    ) : role.branch_id ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-sky-950/60 text-[#253C7D] dark:text-sky-300 border border-blue-200/60 dark:border-sky-800/40 flex items-center gap-1 shrink-0">
                        <i className="ri-building-2-fill text-xs" />
                        BU: {role.branch_name || "Business Unit"}
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/40 flex items-center gap-1 shrink-0">
                        <i className="ri-global-line text-xs" />
                        Global System Role
                      </span>
                    )}

                    {/* Role Access Level Indicator */}
                    {role.is_admin ? (
                      <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-200/60 dark:border-amber-800/40">
                        Full Access
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium text-gray-400 dark:text-slate-500">
                        {role.allowed_modules.length} modules
                      </span>
                    )}
                  </div>

                  {/* Role Name & Icon & Action Buttons */}
                  <div className="flex items-start justify-between mb-3 gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-2xs"
                        style={{ backgroundColor: (role.color || "#253C7D") + "20" }}
                      >
                        <i
                          className={`${
                            role.is_admin ? "ri-shield-star-line" : "ri-shield-user-line"
                          } text-lg`}
                          style={{ color: role.color || "#253C7D" }}
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-900 dark:text-slate-100 truncate">
                          {role.name}
                        </p>
                        <p className="text-[11px] text-gray-400 dark:text-slate-500 truncate">
                          {role.branch_name
                            ? role.site_name
                              ? `${role.branch_name} · ${role.site_name}`
                              : role.branch_name
                            : "Available across all BUs"}
                        </p>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1 shrink-0">
                      {canEditThisRole ? (
                        <>
                          <button
                            type="button"
                            onClick={() => onOpenEditRole(role)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500 dark:text-slate-400 cursor-pointer transition-colors"
                            title="Edit role permissions"
                          >
                            <i className="ri-edit-line text-sm" />
                          </button>
                          {canDeleteThisRole && (
                            <button
                              type="button"
                              onClick={() => onDeleteRole(role.id)}
                              className="w-7 h-7 flex items-center justify-center rounded-lg bg-red-50 dark:bg-rose-950/40 hover:bg-red-100 dark:hover:bg-rose-900/40 text-red-500 dark:text-rose-400 cursor-pointer transition-colors"
                              title="Delete role"
                            >
                              <i className="ri-delete-bin-line text-sm" />
                            </button>
                          )}
                        </>
                      ) : !isSuperAdmin && isGlobalRole && onCloneRole ? (
                        <button
                          type="button"
                          onClick={() => onCloneRole(role)}
                          className="px-2 py-1 text-[10px] font-bold text-[#253C7D] dark:text-sky-300 bg-[#253C7D]/10 dark:bg-sky-950/60 hover:bg-[#253C7D]/20 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                          title="Create a customized version of this role for your BU"
                        >
                          <i className="ri-file-copy-line text-xs" />
                          Customize for BU
                        </button>
                      ) : isSuperRole && !isSuperAdmin ? (
                        <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/60 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <i className="ri-lock-fill text-[11px]" />
                          Protected
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {role.description && (
                    <p className="text-xs text-gray-500 dark:text-slate-400 mb-3 line-clamp-2">
                      {role.description}
                    </p>
                  )}

                  {/* Modules tags */}
                  {!role.is_admin && role.allowed_modules.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {role.allowed_modules.slice(0, 6).map((m) => {
                        const mod = ALL_MODULES.find((x) => x.key === m);
                        return (
                          <span
                            key={m}
                            className="text-[10px] bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-slate-300 border border-transparent dark:border-slate-700 px-2 py-0.5 rounded-md font-medium"
                          >
                            {mod?.label || m}
                          </span>
                        );
                      })}
                      {role.allowed_modules.length > 6 && (
                        <span className="text-[10px] text-gray-400 dark:text-slate-500 font-medium">
                          +{role.allowed_modules.length - 6} more
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Bottom Footer: User Count */}
                <div className="mt-3 pt-3 border-t border-gray-50 dark:border-slate-800 flex items-center justify-between text-[11px] text-gray-400 dark:text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <i className="ri-user-line text-xs" />
                    <span>
                      {users.filter((u) => u.role_id === role.id).length} user
                      {users.filter((u) => u.role_id === role.id).length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  {isGlobalRole && (
                    <span className="text-[10px] text-purple-600 dark:text-purple-400 font-medium">
                      Global Template
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
});
