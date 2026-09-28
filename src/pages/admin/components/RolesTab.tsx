import { memo, useState, useMemo } from "react";
import type { AppRole, UserAssignment } from "../types";
import {
  ALL_MODULES,
  ROLE_CATEGORIES,
  type RoleCategoryDefinition,
  getRoleCategoryKey,
  isDefaultCanonicalRole,
} from "../constants";
import { RoleTreeOrgChart } from "./RoleTreeOrgChart";

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
  onOpenNewRole: (categoryKey?: string) => void;
  onOpenEditRole: (role: AppRole) => void;
  onCloneRole?: (role: AppRole) => void;
  onDeleteRole: (id: number) => void;
  onNavigateToUsers?: (roleName: string) => void;
}

export const RolesTab = memo(function RolesTab({
  roles = [],
  users = [],
  isSuperAdmin = true,
  canManageRoles = true,
  onOpenNewRole,
  onOpenEditRole,
  onDeleteRole,
  onNavigateToUsers,
}: RolesTabProps) {
  const [roleSearch, setRoleSearch] = useState("");
  const [selectedCategoryKey, setSelectedCategoryKey] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"tree" | "cards">("tree");

  // Group roles strictly under the 5 canonical categories:
  // Super Admin -> Admin -> Chairwoman & Chairman -> Line Manager -> Employee
  const categoryGroups = useMemo(() => {
    return ROLE_CATEGORIES.map((meta: RoleCategoryDefinition) => {
      const categoryRoles = roles.filter((r) => getRoleCategoryKey(r) === meta.key);
      const defaultRole = categoryRoles.find((r) => isDefaultCanonicalRole(r)) || categoryRoles[0] || null;
      const customPositions = categoryRoles.filter((r) => !isDefaultCanonicalRole(r));
      const categoryUsers = users.filter((u) => categoryRoles.some((r) => r.id === u.role_id));

      return {
        meta,
        defaultRole,
        categoryRoles,
        customPositions,
        categoryUsers,
      };
    });
  }, [roles, users]);

  // Filter categories by category filter tab & search query
  const displayedCategories = useMemo(() => {
    return categoryGroups.filter(({ meta, categoryRoles }) => {
      if (selectedCategoryKey !== "all" && meta.key !== selectedCategoryKey) {
        return false;
      }
      if (roleSearch.trim()) {
        const q = roleSearch.toLowerCase().trim();
        const matchMeta =
          meta.name.toLowerCase().includes(q) ||
          meta.summary.toLowerCase().includes(q) ||
          meta.badge.toLowerCase().includes(q) ||
          meta.tagline.toLowerCase().includes(q);

        const matchAnyRole = categoryRoles.some(
          (r) =>
            (r.name || "").toLowerCase().includes(q) ||
            (r.description || "").toLowerCase().includes(q) ||
            (r.branch_name || "").toLowerCase().includes(q)
        );

        if (!matchMeta && !matchAnyRole) {
          return false;
        }
      }
      return true;
    });
  }, [categoryGroups, selectedCategoryKey, roleSearch]);

  const totalPositions = roles.length;

  return (
    <div className="space-y-4">
      {/* Header with Title and Create Button */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2">
            <span>Roles & Permissions</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300">
              5 categories · {totalPositions} position{totalPositions !== 1 ? "s" : ""}
            </span>
          </h2>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
            5 standard role categories governing operational authority. Create and configure role positions in line with each category default.
          </p>
        </div>

        {canManageRoles && (
          <button
            type="button"
            onClick={() => onOpenNewRole()}
            className="flex items-center gap-2 px-4 py-2 bg-[#253C7D] hover:bg-[#1F336A] text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shadow-2xs"
          >
            <i className="ri-add-line text-sm" />
            New Role Position
          </button>
        )}
      </div>

      {/* Scope / Category Filter Bar */}
      <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-3 shadow-2xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Quick Category Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setSelectedCategoryKey("all")}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                selectedCategoryKey === "all"
                  ? "bg-[#253C7D] text-white shadow-2xs"
                  : "bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700"
              }`}
            >
              All Categories ({ROLE_CATEGORIES.length})
            </button>
            {ROLE_CATEGORIES.map((cat) => {
              const group = categoryGroups.find((g) => g.meta.key === cat.key);
              const count = group ? group.categoryRoles.length : 0;
              const isSelected = selectedCategoryKey === cat.key;
              return (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => setSelectedCategoryKey(cat.key)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? "bg-[#253C7D] text-white shadow-2xs"
                      : "bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700"
                  }`}
                >
                  <i className={`${cat.icon} text-xs`} />
                  <span>{cat.name}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
                      isSelected
                        ? "bg-white/20 text-white"
                        : "bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-slate-300"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center bg-gray-100 dark:bg-slate-800 p-0.5 rounded-xl border border-gray-200/60 dark:border-slate-700/60 shrink-0">
            <button
              type="button"
              onClick={() => setViewMode("tree")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === "tree"
                  ? "bg-white dark:bg-slate-900 text-[#253C7D] dark:text-sky-400 shadow-2xs"
                  : "text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200"
              }`}
              title="View role permissions as hierarchical tree org chart"
            >
              <i className="ri-organization-chart text-xs" />
              <span>Org Tree</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("cards")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === "cards"
                  ? "bg-white dark:bg-slate-900 text-[#253C7D] dark:text-sky-400 shadow-2xs"
                  : "text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200"
              }`}
              title="View role categories as cards grid"
            >
              <i className="ri-layout-grid-fill text-xs" />
              <span>Category Cards</span>
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 text-xs" />
          <input
            type="text"
            value={roleSearch}
            onChange={(e) => setRoleSearch(e.target.value)}
            placeholder="Search roles by title, position, description, or capability..."
            className="w-full pl-8 pr-3 py-1.5 bg-gray-50 dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700 rounded-xl text-xs text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-[#253C7D]/30"
          />
        </div>
      </div>

      {/* Main View: Org Tree View vs Category Cards Grid */}
      {viewMode === "tree" ? (
        <RoleTreeOrgChart
          categoryGroups={categoryGroups}
          users={users}
          searchTerm={roleSearch}
          canManageRoles={canManageRoles}
          onOpenNewRole={onOpenNewRole}
          onOpenEditRole={onOpenEditRole}
          onDeleteRole={onDeleteRole}
          onNavigateToUsers={onNavigateToUsers}
        />
      ) : displayedCategories.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-8 text-center">
          <i className="ri-shield-line text-4xl text-gray-300 dark:text-slate-600 mb-2 block" />
          <p className="text-sm font-bold text-gray-800 dark:text-slate-200">No categories match your filter</p>
          <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">
            Try clearing your search or switching category filter tabs.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {displayedCategories.map(({ meta, defaultRole, categoryRoles, categoryUsers }) => {
            const isSuper = meta.key === "super_admin";
            const mainRole = defaultRole || categoryRoles[0];

            return (
              <div
                key={meta.key}
                className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-5 shadow-2xs flex flex-col justify-between hover:border-gray-200 dark:hover:border-slate-700 transition-all"
              >
                <div>
                  {/* Top Scope / Category Badge & Access Level Badge */}
                  <div className="mb-3 flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/40 flex items-center gap-1 shrink-0">
                      <i className={`${meta.icon} text-xs`} />
                      {meta.name}
                    </span>

                    {/* Role Access Level Indicator */}
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shadow-2xs ${meta.badgeColor}`}>
                      {meta.badge}
                    </span>
                  </div>

                  {/* Category Title & Icon & Action Buttons */}
                  <div className="flex items-start justify-between mb-3 gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-2xs"
                        style={{ backgroundColor: meta.color + "20" }}
                      >
                        <i
                          className={`${meta.icon} text-lg`}
                          style={{ color: meta.color }}
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-900 dark:text-slate-100 truncate">
                          {meta.name}
                        </p>
                        <p className="text-[11px] text-gray-400 dark:text-slate-500 truncate">
                          {meta.tagline}
                        </p>
                      </div>
                    </div>

                    {/* Add Position Header Button */}
                    <div className="flex items-center gap-1 shrink-0">
                      {canManageRoles && (
                        <button
                          type="button"
                          onClick={() => onOpenNewRole(meta.key)}
                          className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-[#253C7D]/10 hover:bg-[#253C7D] text-[#253C7D] hover:text-white dark:bg-slate-800 dark:text-sky-300 dark:hover:bg-sky-600 dark:hover:text-white transition-colors cursor-pointer"
                          title={`Create new role position under ${meta.name}`}
                        >
                          <i className="ri-add-line text-xs" />
                          <span>Add Position</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Category Short Description */}
                  <p className="text-xs text-gray-500 dark:text-slate-400 mb-3 line-clamp-2">
                    {meta.summary}
                  </p>

                  {/* Modules tags */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {isSuper ? (
                      <span className="text-[10px] bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/50 px-2 py-0.5 rounded-md font-medium flex items-center gap-1">
                        <i className="ri-sparkling-fill text-amber-500 text-[10px]" />
                        All 35 System Modules
                      </span>
                    ) : (
                      <>
                        {(mainRole?.allowed_modules || []).slice(0, 6).map((m) => {
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
                        {(mainRole?.allowed_modules || []).length > 6 && (
                          <span className="text-[10px] text-gray-400 dark:text-slate-500 font-medium self-center">
                            +{(mainRole?.allowed_modules || []).length - 6} more
                          </span>
                        )}
                      </>
                    )}
                  </div>

                  {/* Role Positions in this Category */}
                  <div className="pt-3 border-t border-gray-100 dark:border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-gray-800 dark:text-slate-200 flex items-center gap-1.5">
                        <i className="ri-shield-user-line text-[#253C7D] dark:text-sky-400" />
                        Role Positions ({categoryRoles.length})
                      </span>
                      {canManageRoles && (
                        <button
                          type="button"
                          onClick={() => onOpenNewRole(meta.key)}
                          className="text-[11px] font-semibold text-[#253C7D] dark:text-sky-400 hover:underline flex items-center gap-0.5 cursor-pointer"
                        >
                          <i className="ri-add-line text-xs" />
                          <span>Add</span>
                        </button>
                      )}
                    </div>

                    {categoryRoles.length === 0 ? (
                      <p className="text-[11px] text-gray-400 italic py-1">
                        No positions configured in this category yet.
                      </p>
                    ) : (
                      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-0.5">
                        {categoryRoles.map((r) => {
                          const isCanonical = isDefaultCanonicalRole(r);
                          const posUsers = users.filter((u) => u.role_id === r.id);

                          return (
                            <div
                              key={r.id}
                              className="flex items-center justify-between p-2 rounded-xl bg-gray-50/80 dark:bg-slate-800/60 border border-gray-100 dark:border-slate-800 text-xs hover:border-gray-200 dark:hover:border-slate-700 transition-all gap-2"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span
                                  className="w-2.5 h-2.5 rounded-full shrink-0"
                                  style={{ backgroundColor: r.color || meta.color }}
                                />
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="font-bold text-gray-900 dark:text-slate-100 truncate">
                                      {r.name}
                                    </span>
                                    {isCanonical ? (
                                      <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-gray-200/70 dark:bg-slate-700 text-gray-600 dark:text-slate-300">
                                        Default
                                      </span>
                                    ) : (
                                      <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-blue-50 dark:bg-sky-950/60 text-[#253C7D] dark:text-sky-300 border border-blue-200/60 dark:border-sky-800/40">
                                        Custom Position
                                      </span>
                                    )}
                                    {r.branch_name && (
                                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 truncate max-w-[120px]">
                                        {r.branch_name}
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[10px] text-gray-400 dark:text-slate-500">
                                    {posUsers.length} user{posUsers.length !== 1 ? "s" : ""}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-1 shrink-0">
                                {canManageRoles && (
                                  <button
                                    type="button"
                                    onClick={() => onOpenEditRole(r)}
                                    className="w-6 h-6 flex items-center justify-center rounded-lg bg-white dark:bg-slate-700 hover:bg-gray-100 dark:hover:bg-slate-600 text-gray-500 dark:text-slate-300 cursor-pointer shadow-2xs transition-colors"
                                    title="Edit role permissions"
                                  >
                                    <i className="ri-edit-line text-xs" />
                                  </button>
                                )}
                                {canManageRoles && !isCanonical && onDeleteRole && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (confirm(`Are you sure you want to delete the role position "${r.name}"?`)) {
                                        onDeleteRole(r.id);
                                      }
                                    }}
                                    className="w-6 h-6 flex items-center justify-center rounded-lg bg-white dark:bg-slate-700 hover:bg-red-50 dark:hover:bg-red-950/50 text-gray-400 hover:text-red-600 dark:hover:text-red-400 cursor-pointer shadow-2xs transition-colors"
                                    title="Delete custom role position"
                                  >
                                    <i className="ri-delete-bin-line text-xs" />
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Inline Create Button */}
                    {canManageRoles && (
                      <button
                        type="button"
                        onClick={() => onOpenNewRole(meta.key)}
                        className="w-full mt-2 py-1.5 border border-dashed border-[#253C7D]/30 dark:border-sky-800/60 hover:border-[#253C7D] dark:hover:border-sky-500 rounded-xl text-xs font-semibold text-[#253C7D] dark:text-sky-400 hover:bg-[#253C7D]/5 dark:hover:bg-sky-950/30 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      >
                        <i className="ri-add-line text-xs" />
                        <span>Create Role Position in {meta.name}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Bottom Footer: User Count & Navigation */}
                <div className="mt-4 pt-3 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-gray-400 dark:text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <i className="ri-user-line text-xs" />
                    <span>
                      {categoryUsers.length} user{categoryUsers.length !== 1 ? "s" : ""} across {categoryRoles.length} position{categoryRoles.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  {onNavigateToUsers ? (
                    <button
                      type="button"
                      onClick={() => onNavigateToUsers(mainRole?.name || meta.name)}
                      className="text-[10px] font-semibold text-[#253C7D] dark:text-sky-400 hover:underline cursor-pointer"
                    >
                      Manage Users →
                    </button>
                  ) : (
                    <span className="text-[10px] text-purple-600 dark:text-purple-400 font-medium">
                      Standard Category
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
