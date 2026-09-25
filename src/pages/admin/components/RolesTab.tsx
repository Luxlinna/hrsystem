import { memo, useState, useMemo } from "react";
import type { AppRole, UserAssignment } from "../types";
import { ALL_MODULES, ROLE_CATEGORIES, type RoleCategoryDefinition } from "../constants";

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
  onNavigateToUsers?: (roleName: string) => void;
}

export const RolesTab = memo(function RolesTab({
  roles = [],
  users = [],
  isSuperAdmin = true,
  canManageRoles = true,
  onOpenNewRole,
  onOpenEditRole,
  onNavigateToUsers,
}: RolesTabProps) {
  const [roleSearch, setRoleSearch] = useState("");
  const [selectedCategoryKey, setSelectedCategoryKey] = useState<string>("all");

  // Match role to its canonical category definition
  const getCategoryMeta = (role: AppRole): RoleCategoryDefinition => {
    if (role.is_admin || role.name === "Super Admin") {
      return ROLE_CATEGORIES.find((c) => c.key === "super_admin") || ROLE_CATEGORIES[0];
    }
    const n = (role.name || "").toLowerCase();
    if (/chair/i.test(n)) {
      return ROLE_CATEGORIES.find((c) => c.key === "chairperson") || ROLE_CATEGORIES[2];
    }
    if (/line\s*manager|supervisor/i.test(n)) {
      return ROLE_CATEGORIES.find((c) => c.key === "line_manager") || ROLE_CATEGORIES[3];
    }
    if (/employee|staff/i.test(n) && !/admin|manager/i.test(n)) {
      return ROLE_CATEGORIES.find((c) => c.key === "employee") || ROLE_CATEGORIES[4];
    }
    return ROLE_CATEGORIES.find((c) => c.key === "admin") || ROLE_CATEGORIES[1];
  };

  // Group and sort roles strictly in canonical hierarchy: Super Admin -> Admin -> Chairwoman & Chairman -> Line Manager -> Employee
  const categoryCards = useMemo(() => {
    const cards = roles.map((role) => {
      const meta = getCategoryMeta(role);
      const assignedUsers = users.filter((u) => u.role_id === role.id);
      return {
        role,
        meta,
        assignedUsers,
      };
    });

    return cards.sort((a, b) => a.meta.order - b.meta.order);
  }, [roles, users]);

  // Filter roles by category filter & search query
  const displayedCards = useMemo(() => {
    return categoryCards.filter(({ role, meta }) => {
      if (selectedCategoryKey !== "all" && meta.key !== selectedCategoryKey) {
        return false;
      }
      if (roleSearch.trim()) {
        const q = roleSearch.toLowerCase().trim();
        const matchName = (role.name || "").toLowerCase().includes(q);
        const matchMetaName = meta.name.toLowerCase().includes(q);
        const matchDesc = (role.description || "").toLowerCase().includes(q);
        const matchSummary = meta.summary.toLowerCase().includes(q);
        const matchBadge = meta.badge.toLowerCase().includes(q);
        if (!matchName && !matchMetaName && !matchDesc && !matchSummary && !matchBadge) {
          return false;
        }
      }
      return true;
    });
  }, [categoryCards, selectedCategoryKey, roleSearch]);

  return (
    <div className="space-y-4">
      {/* Header with Title and Create Button */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2">
            <span>Roles & Permissions</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300">
              {displayedCards.length} {displayedCards.length === 1 ? "category" : "categories"}
            </span>
          </h2>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
            5 standard role categories governing operational authority, salary visibility, and supervisory boundaries.
          </p>
        </div>

        {canManageRoles && isSuperAdmin && (
          <button
            type="button"
            onClick={onOpenNewRole}
            className="flex items-center gap-2 px-4 py-2 bg-[#253C7D] hover:bg-[#1F336A] text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shadow-2xs"
          >
            <i className="ri-add-line text-sm" />
            New Role
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
              All Categories ({roles.length})
            </button>
            {ROLE_CATEGORIES.map((cat) => {
              const count = roles.filter((r) => getCategoryMeta(r).key === cat.key).length;
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
        </div>

        {/* Search Bar */}
        <div className="relative">
          <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 text-xs" />
          <input
            type="text"
            value={roleSearch}
            onChange={(e) => setRoleSearch(e.target.value)}
            placeholder="Search roles by title, description, or capability..."
            className="w-full pl-8 pr-3 py-1.5 bg-gray-50 dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700 rounded-xl text-xs text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-[#253C7D]/30"
          />
        </div>
      </div>

      {/* Role Cards Grid */}
      {displayedCards.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-8 text-center">
          <i className="ri-shield-line text-4xl text-gray-300 dark:text-slate-600 mb-2 block" />
          <p className="text-sm font-bold text-gray-800 dark:text-slate-200">No categories match your filter</p>
          <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">
            Try clearing your search or switching category filter tabs.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {displayedCards.map(({ role, meta, assignedUsers }) => {
            const isSuper = role.is_admin || role.name === "Super Admin";

            return (
              <div
                key={role.id}
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

                  {/* Role Name & Icon & Action Buttons */}
                  <div className="flex items-start justify-between mb-3 gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-2xs"
                        style={{ backgroundColor: (role.color || meta.color || "#253C7D") + "20" }}
                      >
                        <i
                          className={`${meta.icon} text-lg`}
                          style={{ color: role.color || meta.color || "#253C7D" }}
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-900 dark:text-slate-100 truncate">
                          {role.name}
                        </p>
                        <p className="text-[11px] text-gray-400 dark:text-slate-500 truncate">
                          {meta.tagline}
                        </p>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1 shrink-0">
                      {canManageRoles && (
                        <button
                          type="button"
                          onClick={() => onOpenEditRole(role)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500 dark:text-slate-400 cursor-pointer transition-colors"
                          title="Edit role permissions"
                        >
                          <i className="ri-edit-line text-sm" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Short Description */}
                  <p className="text-xs text-gray-500 dark:text-slate-400 mb-3 line-clamp-2">
                    {role.description || meta.summary}
                  </p>

                  {/* Modules tags */}
                  <div className="flex flex-wrap gap-1.5">
                    {isSuper ? (
                      <span className="text-[10px] bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/50 px-2 py-0.5 rounded-md font-medium flex items-center gap-1">
                        <i className="ri-sparkling-fill text-amber-500 text-[10px]" />
                        All 35 System Modules
                      </span>
                    ) : (
                      <>
                        {(role.allowed_modules || []).slice(0, 6).map((m) => {
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
                        {(role.allowed_modules || []).length > 6 && (
                          <span className="text-[10px] text-gray-400 dark:text-slate-500 font-medium self-center">
                            +{(role.allowed_modules || []).length - 6} more
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Bottom Footer: User Count & Navigation */}
                <div className="mt-3 pt-3 border-t border-gray-50 dark:border-slate-800 flex items-center justify-between text-[11px] text-gray-400 dark:text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <i className="ri-user-line text-xs" />
                    <span>
                      {assignedUsers.length} user{assignedUsers.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                  {onNavigateToUsers ? (
                    <button
                      type="button"
                      onClick={() => onNavigateToUsers(role.name)}
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
