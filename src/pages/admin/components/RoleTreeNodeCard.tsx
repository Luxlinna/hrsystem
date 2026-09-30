import { memo } from "react";
import type { AppRole, UserAssignment } from "../types";
import { type RoleCategoryDefinition, isDefaultCanonicalRole } from "../constants";

export interface CategoryGroupData {
  meta: RoleCategoryDefinition;
  defaultRole: AppRole | null;
  categoryRoles: AppRole[];
  customPositions: AppRole[];
  categoryUsers: UserAssignment[];
}

interface RoleTreeNodeCardProps {
  group: CategoryGroupData;
  levelNumber: number;
  users: UserAssignment[];
  searchTerm: string;
  isCollapsed: boolean;
  canManageRoles: boolean;
  onToggleCollapse: (key: string) => void;
  onOpenNewRole: (categoryKey?: string) => void;
  onOpenEditRole: (role: AppRole) => void;
  onDeleteRole: (id: number) => void;
  onNavigateToUsers?: (roleName: string) => void;
}

export const RoleTreeNodeCard = memo(function RoleTreeNodeCard({
  group,
  levelNumber,
  users,
  searchTerm,
  isCollapsed,
  canManageRoles,
  onToggleCollapse,
  onOpenNewRole,
  onOpenEditRole,
  onDeleteRole,
  onNavigateToUsers,
}: RoleTreeNodeCardProps) {
  const { meta, defaultRole, categoryRoles, categoryUsers } = group;
  const mainRole = defaultRole || categoryRoles[0] || null;

  const matchesSearch =
    searchTerm.trim() !== "" &&
    (meta.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      categoryRoles.some((r) => r.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      categoryUsers.some((u) => (u.display_name || u.email || "").toLowerCase().includes(searchTerm.toLowerCase())));

  return (
    <div
      className={`relative w-80 rounded-2xl border transition-all duration-200 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md ${
        matchesSearch
          ? "ring-2 ring-[#253C7D] border-[#253C7D]"
          : "border-gray-200/80 dark:border-slate-800"
      }`}
    >
      <div
        className="h-1.5 w-full rounded-t-2xl"
        style={{ backgroundColor: meta.color }}
      />

      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-slate-400">
            <span>Level {levelNumber}</span>
            <span>&bull;</span>
            <span>{meta.name}</span>
          </div>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shadow-2xs ${meta.badgeColor}`}>
            {meta.badge}
          </span>
        </div>

        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-2xs"
              style={{ backgroundColor: meta.color + "20" }}
            >
              <i className={`${meta.icon} text-base`} style={{ color: meta.color }} />
            </div>
            <div className="min-w-0">
              <h4 className="text-sm font-bold text-gray-900 dark:text-slate-100 truncate">{meta.name}</h4>
              <p className="text-[11px] text-gray-400 dark:text-slate-500 truncate">{meta.tagline}</p>
            </div>
          </div>

          {canManageRoles && (
            <button
              type="button"
              onClick={() => onOpenNewRole(meta.key)}
              className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-lg bg-[#253C7D] hover:bg-[#1B2B5A] text-white transition-colors cursor-pointer shrink-0 shadow-2xs"
              title={`Add role position under ${meta.name}`}
            >
              <i className="ri-add-line text-xs" />
              <span>Add Position</span>
            </button>
          )}
        </div>

        <p className="text-[11px] text-gray-500 dark:text-slate-400 line-clamp-2">{meta.summary}</p>

        <div className="pt-2.5 border-t border-gray-100 dark:border-slate-800 space-y-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-bold text-gray-700 dark:text-slate-300 flex items-center gap-1">
              <i className="ri-shield-user-line text-xs text-[#253C7D] dark:text-sky-400" />
              Line Positions ({categoryRoles.length})
            </span>
            <span className="text-[10px] text-gray-400 dark:text-slate-500">
              {categoryUsers.length} user{categoryUsers.length !== 1 ? "s" : ""}
            </span>
          </div>

          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-0.5">
            {categoryRoles.map((r) => {
              const isCanonical = isDefaultCanonicalRole(r);
              const posUsers = users.filter((u) => u.role_id === r.id);

              return (
                <div
                  key={r.id}
                  className="flex items-center justify-between p-1.5 px-2 rounded-lg bg-gray-50 dark:bg-slate-800/80 border border-gray-100 dark:border-slate-800 text-[11px] gap-2 hover:border-gray-200 dark:hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: r.color || meta.color }} />
                    <span className="font-bold text-gray-800 dark:text-slate-200 truncate">{r.name}</span>
                    {isCanonical ? (
                      <span className="text-[9px] font-semibold px-1 rounded bg-gray-200/70 dark:bg-slate-700 text-gray-600 dark:text-slate-300">
                        Default
                      </span>
                    ) : (
                      <span className="text-[9px] font-semibold px-1 rounded bg-blue-50 dark:bg-sky-950/60 text-[#253C7D] dark:text-sky-300 border border-blue-200/60">
                        Custom
                      </span>
                    )}
                    {r.branch_name && (
                      <span className="text-[9px] px-1 rounded bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 truncate max-w-[80px]">
                        {r.branch_name}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-[10px] text-gray-400 mr-1">{posUsers.length}</span>
                    {canManageRoles && (
                      <button
                        type="button"
                        onClick={() => onOpenEditRole(r)}
                        className="w-5 h-5 flex items-center justify-center rounded bg-white dark:bg-slate-700 hover:bg-gray-100 dark:hover:bg-slate-600 text-gray-500 dark:text-slate-300 cursor-pointer shadow-2xs"
                        title="Edit position"
                      >
                        <i className="ri-edit-line text-[10px]" />
                      </button>
                    )}
                    {canManageRoles && !isCanonical && (
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Are you sure you want to delete the role position "${r.name}"?`)) {
                            onDeleteRole(r.id);
                          }
                        }}
                        className="w-5 h-5 flex items-center justify-center rounded bg-white dark:bg-slate-700 hover:bg-red-50 text-gray-400 hover:text-red-600 cursor-pointer shadow-2xs"
                        title="Delete custom position"
                      >
                        <i className="ri-delete-bin-line text-[10px]" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="pt-2 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-gray-400 dark:text-slate-500">
          <span>Classified under {meta.name}</span>
          {onNavigateToUsers && (
            <button
              type="button"
              onClick={() => onNavigateToUsers(mainRole?.name || meta.name)}
              className="text-[#253C7D] dark:text-sky-400 hover:underline font-semibold cursor-pointer"
            >
              View Users &rarr;
            </button>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={() => onToggleCollapse(meta.key)}
        className="absolute -bottom-3 left-1/2 -translate-x-1/2 z-10 w-6 h-6 rounded-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-500 dark:text-slate-400 hover:text-[#253C7D] flex items-center justify-center text-xs shadow-xs hover:shadow-md cursor-pointer transition-all"
        title={isCollapsed ? "Expand node" : "Collapse node"}
      >
        <i className={isCollapsed ? "ri-add-line" : "ri-subtract-line"} />
      </button>
    </div>
  );
});
