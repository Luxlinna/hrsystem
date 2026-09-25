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
}

export const RolesTab = memo(function RolesTab({
  roles = [],
  users = [],
  isSuperAdmin = true,
  canManageRoles = true,
  onOpenNewRole,
  onOpenEditRole,
  onDeleteRole,
}: RolesTabProps) {
  const [search, setSearch] = useState("");
  const [selectedCategoryKey, setSelectedCategoryKey] = useState<string>("all");
  const [expandedUsersMap, setExpandedUsersMap] = useState<Record<number, boolean>>({});

  // Helper to match an AppRole to its category definition
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

  // Group roles by category or display the 5 primary category cards
  const categoryCards = useMemo(() => {
    return roles.map((role) => {
      const meta = getCategoryMeta(role);
      const assignedUsers = users.filter((u) => u.role_id === role.id);
      return {
        role,
        meta,
        assignedUsers,
      };
    });
  }, [roles, users]);

  // Filter cards by category selector and search query
  const filteredCards = useMemo(() => {
    return categoryCards.filter(({ role, meta }) => {
      if (selectedCategoryKey !== "all" && meta.key !== selectedCategoryKey) {
        return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matchName = role.name.toLowerCase().includes(q);
        const matchMetaName = meta.name.toLowerCase().includes(q);
        const matchDesc = (role.description || "").toLowerCase().includes(q);
        const matchSummary = meta.summary.toLowerCase().includes(q);
        const matchHighlights = meta.highlights.some((h) => h.toLowerCase().includes(q));
        const matchRestrictions = meta.restrictions.some((r) => r.toLowerCase().includes(q));
        if (!matchName && !matchMetaName && !matchDesc && !matchSummary && !matchHighlights && !matchRestrictions) {
          return false;
        }
      }
      return true;
    });
  }, [categoryCards, selectedCategoryKey, search]);

  const toggleUsersExpand = (roleId: number) => {
    setExpandedUsersMap((prev) => ({ ...prev, [roleId]: !prev[roleId] }));
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#1E2E5D] via-[#253C7D] to-[#1E2E5D] rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/10 to-transparent pointer-events-none" />
        
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wider uppercase bg-white/20 text-white backdrop-blur-xs">
                Role Permission Architecture
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                5 Core Categories Active
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <i className="ri-shield-keyhole-line text-yellow-300" />
              Role Permission Categories
            </h1>
            <p className="text-xs sm:text-sm text-blue-100/90 mt-1 leading-relaxed">
              System access is structured into 5 standard role permission categories. Each category defines exact operational rights, salary visibility limits, and supervisory boundaries.
            </p>
          </div>

          {canManageRoles && isSuperAdmin && (
            <button
              type="button"
              onClick={onOpenNewRole}
              className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-gray-100 text-[#253C7D] font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer whitespace-nowrap active:scale-95"
            >
              <i className="ri-add-line text-base font-bold" />
              Add Custom Role
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-4 shadow-2xs space-y-3">
        {/* Quick Category Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setSelectedCategoryKey("all")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedCategoryKey === "all"
                ? "bg-[#253C7D] text-white shadow-2xs"
                : "bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700"
            }`}
          >
            All Categories ({roles.length})
          </button>

          {ROLE_CATEGORIES.map((cat) => {
            const count = categoryCards.filter((c) => c.meta.key === cat.key).length;
            const isSelected = selectedCategoryKey === cat.key;
            return (
              <button
                key={cat.key}
                type="button"
                onClick={() => setSelectedCategoryKey(cat.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isSelected
                    ? "bg-[#253C7D] text-white shadow-2xs"
                    : "bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700"
                }`}
              >
                <i className={`${cat.icon} text-sm`} style={{ color: isSelected ? "white" : cat.color }} />
                <span>{cat.name}</span>
                <span className="text-[10px] opacity-75 font-normal">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Search input */}
        <div className="relative">
          <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 text-sm" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search categories by name, capability (e.g. salary, edit, supervisor, attendance), or module..."
            className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700 rounded-xl text-xs text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#253C7D]/30"
          />
        </div>
      </div>

      {/* Category Cards Grid */}
      {filteredCards.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-10 text-center">
          <i className="ri-shield-line text-4xl text-gray-300 dark:text-slate-600 mb-2 block" />
          <p className="text-sm font-bold text-gray-800 dark:text-slate-200">No categories match your search</p>
          <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">
            Try clearing the search box or selecting "All Categories".
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filteredCards.map(({ role, meta, assignedUsers }) => {
            const isSuper = role.is_admin || role.name === "Super Admin";
            const isUsersExpanded = Boolean(expandedUsersMap[role.id]);

            return (
              <div
                key={role.id}
                className="bg-white dark:bg-slate-900 border border-gray-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Top Category Badge & Actions */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-xl shadow-md shrink-0"
                        style={{ backgroundColor: meta.color }}
                      >
                        <i className={meta.icon} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-base font-bold text-gray-900 dark:text-slate-100">
                            {role.name}
                          </h3>
                          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${meta.badgeColor}`}>
                            {meta.badge}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-0.5">
                          {meta.scopeSummary}
                        </p>
                      </div>
                    </div>

                    {/* Configure Permissions Button */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {canManageRoles && (
                        <button
                          type="button"
                          onClick={() => onOpenEditRole(role)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-slate-800 hover:bg-[#253C7D] hover:text-white dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 text-xs font-semibold transition-all cursor-pointer shadow-2xs"
                          title="Configure module permissions and action overrides"
                        >
                          <i className="ri-settings-4-line text-sm" />
                          <span>Configure</span>
                        </button>
                      )}
                      {!isSuper && canManageRoles && isSuperAdmin && (
                        <button
                          type="button"
                          onClick={() => onDeleteRole(role.id)}
                          className="w-8 h-8 flex items-center justify-center rounded-xl bg-red-50 dark:bg-rose-950/40 hover:bg-red-100 dark:hover:bg-rose-900/50 text-red-500 dark:text-rose-400 transition-colors cursor-pointer"
                          title="Delete role"
                        >
                          <i className="ri-delete-bin-line text-sm" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="bg-gray-50/80 dark:bg-slate-800/50 rounded-xl p-3 mb-4 border border-gray-100 dark:border-slate-800">
                    <p className="text-xs text-gray-700 dark:text-slate-300 leading-relaxed font-medium">
                      {role.description || meta.summary}
                    </p>
                  </div>

                  {/* Highlights and Restrictions Section */}
                  <div className="space-y-2.5 mb-4">
                    <span className="text-[10px] font-extrabold text-gray-400 dark:text-slate-500 uppercase tracking-wider block">
                      Category Authority & Boundaries
                    </span>

                    {/* Capabilities (Green checkmarks) */}
                    <div className="space-y-1.5">
                      {meta.highlights.map((h, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-gray-800 dark:text-slate-200">
                          <i className="ri-checkbox-circle-fill text-emerald-500 text-sm shrink-0 mt-0.5" />
                          <span>{h}</span>
                        </div>
                      ))}
                    </div>

                    {/* Restrictions (Amber/Red warnings) */}
                    {meta.restrictions.length > 0 && (
                      <div className="pt-2 border-t border-gray-100 dark:border-slate-800/80 space-y-1.5">
                        {meta.restrictions.map((r, i) => (
                          <div key={i} className="flex items-start gap-2 text-xs text-amber-800 dark:text-amber-300 font-medium">
                            <i className="ri-close-circle-fill text-amber-500 text-sm shrink-0 mt-0.5" />
                            <span>{r}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Module Access Badges */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-extrabold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                        Allowed Modules
                      </span>
                      <span className="text-[10px] font-bold text-gray-500 dark:text-slate-400">
                        {isSuper
                          ? "All System Modules"
                          : `${(role.allowed_modules || []).length} modules enabled`}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {isSuper ? (
                        <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/40">
                          ★ Complete System-Wide Access (All Modules)
                        </span>
                      ) : (
                        (role.allowed_modules || []).slice(0, 7).map((modKey) => {
                          const mod = ALL_MODULES.find((m) => m.key === modKey);
                          return (
                            <span
                              key={modKey}
                              className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 border border-gray-200/60 dark:border-slate-700"
                            >
                              {mod?.label || modKey}
                            </span>
                          );
                        })
                      )}
                      {!isSuper && (role.allowed_modules || []).length > 7 && (
                        <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500 px-1 py-0.5">
                          +{(role.allowed_modules || []).length - 7} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer: User Assignments */}
                <div className="pt-3 border-t border-gray-100 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => toggleUsersExpand(role.id)}
                      className="flex items-center gap-2 text-xs font-bold text-[#253C7D] dark:text-sky-400 hover:underline cursor-pointer"
                    >
                      <i className="ri-user-shared-line text-sm" />
                      <span>
                        {assignedUsers.length} Assigned {assignedUsers.length === 1 ? "User" : "Users"}
                      </span>
                      <i className={`text-xs ${isUsersExpanded ? "ri-arrow-up-s-line" : "ri-arrow-down-s-line"}`} />
                    </button>

                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400">
                      Standard Category
                    </span>
                  </div>

                  {/* Expandable assigned user list */}
                  {isUsersExpanded && (
                    <div className="mt-3 p-3 bg-gray-50 dark:bg-slate-800/60 rounded-xl space-y-2 border border-gray-100 dark:border-slate-800 max-h-48 overflow-y-auto">
                      {assignedUsers.length === 0 ? (
                        <p className="text-xs text-gray-400 dark:text-slate-500 italic text-center py-2">
                          No users currently assigned to this category.
                        </p>
                      ) : (
                        assignedUsers.map((u) => (
                          <div
                            key={u.id}
                            className="flex items-center justify-between gap-2 text-xs py-1 border-b border-gray-200/40 dark:border-slate-700/40 last:border-0"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="w-5 h-5 rounded-full bg-[#253C7D]/20 text-[#253C7D] dark:text-sky-300 text-[10px] font-bold flex items-center justify-center shrink-0">
                                {(u.display_name || u.email || "U").charAt(0).toUpperCase()}
                              </div>
                              <span className="font-semibold text-gray-800 dark:text-slate-200 truncate">
                                {u.display_name || u.email}
                              </span>
                            </div>
                            <span className="text-[10px] text-gray-400 dark:text-slate-500 shrink-0">
                              {u.branch_name || "Headquarters"}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
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
