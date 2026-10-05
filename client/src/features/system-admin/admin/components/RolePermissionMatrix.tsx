import { memo, useState, useMemo, useCallback, Fragment } from "react";
import type { AppRole, UserAssignment } from "../types";
import { ALL_MODULES, MODULE_GROUPS, type ModuleConfig } from "../modulesConfig";
import {
  ROLE_CATEGORIES,
  type RoleCategoryDefinition,
  getRoleCategoryKey,
  isDefaultCanonicalRole,
} from "../constants";
import { supabase } from "@/lib/supabase";
import { invalidatePermissionsCache } from "@/hooks/usePermissions";

interface RolePermissionMatrixProps {
  roles: AppRole[];
  users: UserAssignment[];
  canManageRoles?: boolean;
  onOpenNewRole: (categoryKey?: string) => void;
  onOpenEditRole: (role: AppRole) => void;
  onCloneRole?: (role: AppRole) => void;
  onDeleteRole: (id: number) => void;
  onNavigateToUsers?: (roleName?: string) => void;
  showToast?: (msg: string, type?: "ok" | "err") => void;
}

export const RolePermissionMatrix = memo(function RolePermissionMatrix({
  roles = [],
  users = [],
  canManageRoles = true,
  onOpenNewRole,
  onOpenEditRole,
  onCloneRole,
  onDeleteRole,
  onNavigateToUsers,
  showToast,
}: RolePermissionMatrixProps) {
  const [searchPermission, setSearchPermission] = useState("");
  const [selectedCategoryKey, setSelectedCategoryKey] = useState<string>("all");
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [activeMenuKey, setActiveMenuKey] = useState<string | number | null>(null);

  // Local state for modified permissions (roleId -> allowed_modules array)
  const [dirtyPermissions, setDirtyPermissions] = useState<Record<number, string[]>>({});
  const [isSaving, setIsSaving] = useState(false);

  const totalSystemModules = ALL_MODULES.length;

  // Helper to get active allowed_modules for a role (including dirty changes)
  const getRoleModules = useCallback(
    (role: AppRole): string[] => {
      if (dirtyPermissions[role.id] !== undefined) {
        return dirtyPermissions[role.id];
      }
      return role.allowed_modules || [];
    },
    [dirtyPermissions]
  );

  // Group roles by canonical categories
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
        totalPositions: categoryRoles.length,
      };
    });
  }, [roles, users]);

  // When "all" is selected: show ONLY the 5 default categories as columns
  // When a specific category is selected: show all roles in that category
  const displayedColumns = useMemo(() => {
    if (selectedCategoryKey === "all") {
      return categoryGroups
        .map((g) => {
          if (!g.defaultRole) return null;
          return {
            role: g.defaultRole,
            meta: g.meta,
            categoryRoles: g.categoryRoles,
            customPositions: g.customPositions,
            categoryUsers: g.categoryUsers,
            totalPositions: g.categoryRoles.length,
            isCategoryDefaultView: true,
          };
        })
        .filter(Boolean) as {
          role: AppRole;
          meta: RoleCategoryDefinition;
          categoryRoles: AppRole[];
          customPositions: AppRole[];
          categoryUsers: UserAssignment[];
          totalPositions: number;
          isCategoryDefaultView: boolean;
        }[];
    } else {
      const g = categoryGroups.find((grp) => grp.meta.key === selectedCategoryKey);
      if (!g) return [];
      return g.categoryRoles.map((r) => ({
        role: r,
        meta: g.meta,
        categoryRoles: g.categoryRoles,
        customPositions: g.customPositions,
        categoryUsers: g.categoryUsers.filter((u) => u.role_id === r.id),
        totalPositions: g.categoryRoles.length,
        isCategoryDefaultView: false,
      }));
    }
  }, [categoryGroups, selectedCategoryKey]);

  // Filter modules/permissions by search input
  const filteredModulesByGroup = useMemo(() => {
    const q = searchPermission.toLowerCase().trim();
    const map: Record<string, ModuleConfig[]> = {};

    MODULE_GROUPS.forEach((group) => {
      const list = ALL_MODULES.filter((m) => m.group === group);
      if (!q) {
        map[group] = list;
      } else {
        map[group] = list.filter(
          (m) =>
            m.label.toLowerCase().includes(q) ||
            m.key.toLowerCase().includes(q) ||
            (m.description || "").toLowerCase().includes(q)
        );
      }
    });

    return map;
  }, [searchPermission]);

  const toggleGroupCollapse = (group: string) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [group]: !prev[group],
    }));
  };

  const expandAllGroups = () => setCollapsedGroups({});
  const collapseAllGroups = () => {
    const all: Record<string, boolean> = {};
    MODULE_GROUPS.forEach((g) => {
      all[g] = true;
    });
    setCollapsedGroups(all);
  };

  // Toggle single permission for a role
  const handleTogglePermission = useCallback(
    (role: AppRole, moduleKey: string) => {
      if (!canManageRoles) return;

      const current = getRoleModules(role);
      const isWildcard = current.includes("*");
      const hasMod = isWildcard || current.includes(moduleKey);

      let next: string[];
      if (isWildcard) {
        next = ALL_MODULES.map((m) => m.key).filter((k) => k !== moduleKey);
      } else if (hasMod) {
        next = current.filter((k) => k !== moduleKey);
      } else {
        next = [...current, moduleKey];
        if (next.length >= ALL_MODULES.length) {
          next = ["*"];
        }
      }

      setDirtyPermissions((prev) => ({
        ...prev,
        [role.id]: next,
      }));
    },
    [canManageRoles, getRoleModules]
  );

  // Toggle all permissions in a group for a role
  const handleToggleGroup = useCallback(
    (role: AppRole, groupName: string) => {
      if (!canManageRoles) return;

      const groupModules = ALL_MODULES.filter((m) => m.group === groupName).map((m) => m.key);
      const current = getRoleModules(role);
      const isWildcard = current.includes("*");
      const isAllChecked =
        isWildcard || groupModules.every((k) => current.includes(k));

      let next: string[];
      if (isAllChecked) {
        if (isWildcard) {
          next = ALL_MODULES.map((m) => m.key).filter((k) => !groupModules.includes(k));
        } else {
          next = current.filter((k) => !groupModules.includes(k));
        }
      } else {
        if (isWildcard) {
          next = ["*"];
        } else {
          const set = new Set([...current, ...groupModules]);
          next = Array.from(set);
          if (next.length >= ALL_MODULES.length) {
            next = ["*"];
          }
        }
      }

      setDirtyPermissions((prev) => ({
        ...prev,
        [role.id]: next,
      }));
    },
    [canManageRoles, getRoleModules]
  );

  // Save all modified permissions to Supabase
  const dirtyCount = Object.keys(dirtyPermissions).length;

  const handleSaveChanges = async () => {
    if (dirtyCount === 0) return;
    setIsSaving(true);

    try {
      const updates = Object.entries(dirtyPermissions).map(async ([roleIdStr, allowed_modules]) => {
        const roleId = Number(roleIdStr);
        return supabase
          .from("app_roles")
          .update({
            allowed_modules,
            updated_at: new Date().toISOString(),
          })
          .eq("id", roleId);
      });

      const results = await Promise.all(updates);
      const hasError = results.some((r) => r.error);

      if (hasError) {
        if (showToast) showToast("Some changes could not be saved. Please retry.", "err");
      } else {
        if (showToast) showToast(`Successfully saved permissions for ${dirtyCount} role${dirtyCount > 1 ? "s" : ""}!`, "ok");
        setDirtyPermissions({});
        invalidatePermissionsCache();
      }
    } catch (err: any) {
      if (showToast) showToast(err?.message || "Failed to save permissions", "err");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscardChanges = () => {
    setDirtyPermissions({});
    if (showToast) showToast("Discarded unsaved matrix changes", "ok");
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-gray-200/90 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
      {/* Top Header matching reference screen */}
      <div className="p-4 sm:p-5 border-b border-gray-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-slate-900">
        {/* Left: Back Icon + Title + Subtabs (Users | Permissions) */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onNavigateToUsers && onNavigateToUsers()}
            className="w-8 h-8 rounded-lg flex items-center justify-center border border-gray-200 dark:border-slate-700 text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Go to User Management"
          >
            <i className="ri-arrow-left-s-line text-lg" />
          </button>

          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100">
              Roles
            </h2>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300">
              {totalSystemModules} Total Modules
            </span>
          </div>

          {/* Subtabs Segmented Control */}
          <div className="flex items-center bg-gray-100 dark:bg-slate-800 p-1 rounded-xl border border-gray-200/70 dark:border-slate-700 ml-1">
            <button
              type="button"
              onClick={() => onNavigateToUsers && onNavigateToUsers()}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white transition-all cursor-pointer"
            >
              Users
            </button>
            <button
              type="button"
              className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-slate-900 text-[#253C7D] dark:text-sky-400 shadow-xs cursor-default"
            >
              Permissions
            </button>
          </div>
        </div>

        {/* Right Action Buttons: + Add New Role & Save Changes */}
        <div className="flex items-center gap-2.5">
          {dirtyCount > 0 && (
            <button
              type="button"
              onClick={handleDiscardChanges}
              disabled={isSaving}
              className="px-3.5 py-2 rounded-xl border border-gray-300 dark:border-slate-700 text-xs font-semibold text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Discard
            </button>
          )}

          {canManageRoles && (
            <button
              type="button"
              onClick={() => onOpenNewRole(selectedCategoryKey !== "all" ? selectedCategoryKey : undefined)}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-50 dark:bg-sky-950/60 border border-blue-200 dark:border-sky-800/60 text-[#253C7D] dark:text-sky-300 hover:bg-blue-100 dark:hover:bg-sky-900/60 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
            >
              <i className="ri-add-circle-line text-sm" />
              <span>Add New Role</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleSaveChanges}
            disabled={dirtyCount === 0 || isSaving}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs ${
              dirtyCount > 0
                ? "bg-[#253C7D] hover:bg-[#1d3064] text-white cursor-pointer"
                : "bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-slate-600 cursor-not-allowed border border-gray-200/60 dark:border-slate-700/60"
            }`}
          >
            {isSaving ? (
              <>
                <i className="ri-loader-4-line animate-spin text-sm" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <i className="ri-save-line text-sm" />
                <span>Save Changes {dirtyCount > 0 ? `(${dirtyCount})` : ""}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Category Filter Toolbar: Clean Dropdown Filter + Expand/Collapse */}
      <div className="px-4 sm:px-5 py-2.5 border-b border-gray-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-slate-400 font-medium">
            <i className="ri-filter-3-line text-sm text-[#253C7D] dark:text-sky-400" />
            <span>Category View:</span>
          </div>

          <div className="relative">
            <select
              value={selectedCategoryKey}
              onChange={(e) => setSelectedCategoryKey(e.target.value)}
              className="pl-3 pr-8 py-1.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-gray-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#253C7D] cursor-pointer appearance-none shadow-2xs"
            >
              <option value="all">All Default Categories (5)</option>
              {ROLE_CATEGORIES.map((cat) => {
                const group = categoryGroups.find((g) => g.meta.key === cat.key);
                const count = group ? group.categoryRoles.length : 0;
                return (
                  <option key={cat.key} value={cat.key}>
                    {cat.name} ({count} {count === 1 ? "role" : "roles"})
                  </option>
                );
              })}
            </select>
            <i className="ri-arrow-down-s-line absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-xs" />
          </div>

          {selectedCategoryKey !== "all" && (
            <button
              type="button"
              onClick={() => setSelectedCategoryKey("all")}
              className="text-xs text-[#253C7D] dark:text-sky-400 hover:underline cursor-pointer font-medium ml-1"
            >
              Reset to all
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-slate-400">
          <button
            type="button"
            onClick={expandAllGroups}
            className="hover:text-gray-900 dark:hover:text-white cursor-pointer font-medium"
          >
            Expand All
          </button>
          <span>·</span>
          <button
            type="button"
            onClick={collapseAllGroups}
            className="hover:text-gray-900 dark:hover:text-white cursor-pointer font-medium"
          >
            Collapse All
          </button>
        </div>
      </div>

      {/* The Permission Matrix Table */}
      <div className="w-full overflow-x-auto custom-scrollbar max-h-[calc(100vh-280px)]">
        <table className="w-full border-collapse text-left text-xs min-w-[800px]">
          {/* Table Header Row: Search Box + Default Category Columns */}
          <thead className="bg-white dark:bg-slate-900 sticky top-0 z-20 shadow-2xs border-b border-gray-200 dark:border-slate-800">
            <tr>
              {/* Sticky First Column: Permission Search Input + Total Modules Count */}
              <th className="p-3.5 w-80 min-w-[280px] bg-white dark:bg-slate-900 sticky left-0 z-30 border-r border-gray-200/80 dark:border-slate-800">
                <div className="space-y-1.5">
                  <div className="relative">
                    <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                    <input
                      type="text"
                      value={searchPermission}
                      onChange={(e) => setSearchPermission(e.target.value)}
                      placeholder="Start type permission name..."
                      className="w-full pl-8 pr-7 py-1.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs text-gray-900 dark:text-slate-100 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-[#253C7D]/40 font-normal"
                    />
                    {searchPermission && (
                      <button
                        type="button"
                        onClick={() => setSearchPermission("")}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs cursor-pointer"
                      >
                        <i className="ri-close-circle-fill" />
                      </button>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-gray-400 font-semibold px-0.5">
                    <span>PERMISSIONS & MODULES</span>
                    <span>{totalSystemModules} TOTAL</span>
                  </div>
                </div>
              </th>

              {/* Default Category Role Columns */}
              {displayedColumns.map((col) => {
                const { role, meta, customPositions, categoryUsers, totalPositions, isCategoryDefaultView } = col;
                const isMenuOpen = activeMenuKey === role.id;

                const currentModules = getRoleModules(role);
                const isWildcard = currentModules.includes("*");
                const checkedCount = isWildcard
                  ? totalSystemModules
                  : ALL_MODULES.filter((m) => currentModules.includes(m.key)).length;

                return (
                  <th
                    key={role.id}
                    className="p-3 text-center w-52 min-w-[185px] border-r border-gray-100 dark:border-slate-800/80 align-top relative hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <div className="flex flex-col items-center justify-between min-h-[70px]">
                      {/* Sub-label & 3-dots Action Menu */}
                      <div className="w-full flex items-center justify-between text-[10px] text-gray-400 uppercase tracking-wider font-bold mb-1">
                        <span className="flex items-center gap-1 truncate">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: meta.color || role.color || "#253C7D" }}
                          />
                          {isCategoryDefaultView ? "CATEGORY" : "ROLE"}
                        </span>

                        {/* 3-dots Menu Button */}
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setActiveMenuKey(isMenuOpen ? null : role.id)}
                            className="w-5 h-5 rounded hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-400 hover:text-gray-700 dark:hover:text-slate-200 flex items-center justify-center cursor-pointer transition-colors"
                            title="Category actions"
                          >
                            <i className="ri-more-2-fill text-xs" />
                          </button>

                          {/* Dropdown Menu */}
                          {isMenuOpen && (
                            <div className="absolute right-0 top-6 z-50 w-52 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-lg p-1.5 text-left text-xs font-medium space-y-1">
                              {canManageRoles && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveMenuKey(null);
                                    onOpenEditRole(role);
                                  }}
                                  className="w-full px-2.5 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 flex items-center gap-2 cursor-pointer"
                                >
                                  <i className="ri-edit-line text-xs text-[#253C7D] dark:text-sky-400" />
                                  <span>Edit Default Permissions</span>
                                </button>
                              )}

                              {canManageRoles && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveMenuKey(null);
                                    onOpenNewRole(meta.key);
                                  }}
                                  className="w-full px-2.5 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 flex items-center gap-2 cursor-pointer"
                                >
                                  <i className="ri-add-line text-xs text-emerald-600" />
                                  <span>Add Position in {meta.name}</span>
                                </button>
                              )}

                              {onCloneRole && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveMenuKey(null);
                                    onCloneRole(role);
                                  }}
                                  className="w-full px-2.5 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 flex items-center gap-2 cursor-pointer"
                                >
                                  <i className="ri-file-copy-line text-xs text-amber-500" />
                                  <span>Clone Role</span>
                                </button>
                              )}

                              {/* List of positions created under this category */}
                              {customPositions.length > 0 && (
                                <div className="pt-1.5 mt-1 border-t border-gray-100 dark:border-slate-700">
                                  <span className="text-[10px] uppercase font-bold text-gray-400 px-2 block mb-1">
                                    Custom Positions ({customPositions.length}):
                                  </span>
                                  {customPositions.map((pos) => {
                                    const bIds = pos.branch_ids || (pos.branch_id ? [pos.branch_id] : []);
                                    const scopeText = pos.site_name
                                      ? `Site: ${pos.site_name}`
                                      : pos.branch_name
                                      ? pos.branch_name
                                      : bIds.length === 0
                                      ? "Global (All BUs)"
                                      : `${bIds.length} BUs`;

                                    return (
                                      <div
                                        key={pos.id}
                                        className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700/50 text-[11px]"
                                      >
                                        <div className="flex flex-col min-w-0 pr-1">
                                          <span className="truncate max-w-[130px] font-semibold text-gray-800 dark:text-slate-200">
                                            {pos.name}
                                          </span>
                                          <span className="text-[9px] text-gray-400 dark:text-slate-400 truncate max-w-[130px]">
                                            {scopeText}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-1 shrink-0">
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setActiveMenuKey(null);
                                              onOpenEditRole(pos);
                                            }}
                                            className="p-1 text-gray-400 hover:text-[#253C7D] dark:hover:text-sky-400 cursor-pointer"
                                            title="Edit"
                                          >
                                            <i className="ri-edit-line text-[11px]" />
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setActiveMenuKey(null);
                                              if (confirm(`Delete "${pos.name}"?`)) onDeleteRole(pos.id);
                                            }}
                                            className="p-1 text-gray-400 hover:text-red-600 cursor-pointer"
                                            title="Delete"
                                          >
                                            <i className="ri-delete-bin-line text-[11px]" />
                                          </button>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}

                              {onNavigateToUsers && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveMenuKey(null);
                                    onNavigateToUsers(role.name);
                                  }}
                                  className="w-full px-2.5 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 flex items-center gap-2 cursor-pointer border-t border-gray-100 dark:border-slate-700 pt-1.5"
                                >
                                  <i className="ri-user-line text-xs text-sky-500" />
                                  <span>View Users ({categoryUsers.length})</span>
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Category / Role Name */}
                      <span className="font-bold text-gray-900 dark:text-slate-100 text-xs truncate max-w-[160px] block">
                        {isCategoryDefaultView ? meta.name : role.name}
                      </span>

                      {/* Count of Roles in Category & Count of Checked Modules */}
                      <div className="flex flex-col items-center gap-1 mt-1 w-full">
                        <div className="flex items-center gap-1 text-[10px] text-gray-500 dark:text-slate-400 font-semibold">
                          <span>{totalPositions} Role{totalPositions !== 1 ? "s" : ""}</span>
                          {customPositions.length > 0 && (
                            <span className="text-[9px] px-1 rounded bg-blue-50 text-[#253C7D] dark:bg-sky-950/60 dark:text-sky-300 font-bold border border-blue-200/50">
                              +{customPositions.length} custom
                            </span>
                          )}
                        </div>

                        {/* Checked Modules Count Pill */}
                        <div
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border shadow-2xs ${
                            checkedCount === totalSystemModules
                              ? "bg-indigo-50 text-indigo-700 border-indigo-200/80 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800/50"
                              : checkedCount > 0
                              ? "bg-sky-50 text-sky-700 border-sky-200/80 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800/50"
                              : "bg-gray-100 text-gray-500 border-gray-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
                          }`}
                          title={`${checkedCount} of ${totalSystemModules} system modules enabled for ${role.name}`}
                        >
                          <i className="ri-checkbox-circle-fill text-[11px]" />
                          <span>
                            {checkedCount} / {totalSystemModules} Modules
                          </span>
                        </div>
                      </div>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          {/* Table Body: Module Groups & Permissions */}
          <tbody className="divide-y divide-gray-100 dark:divide-slate-800/60">
            {MODULE_GROUPS.map((groupName) => {
              const modulesInGroup = filteredModulesByGroup[groupName] || [];
              if (modulesInGroup.length === 0) return null;

              const isGroupCollapsed = Boolean(collapsedGroups[groupName]);

              return (
                <Fragment key={groupName}>
                  {/* Expandable Group Header Row */}
                  <tr className="bg-slate-50/80 dark:bg-slate-850/90 font-bold border-y border-gray-200/80 dark:border-slate-800">
                    {/* Left Sticky Header Cell */}
                    <td className="p-3 sticky left-0 z-10 bg-slate-50/90 dark:bg-slate-850/90 border-r border-gray-200/80 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => toggleGroupCollapse(groupName)}
                        className="flex items-center gap-2 text-gray-800 dark:text-slate-200 hover:text-[#253C7D] dark:hover:text-sky-400 transition-colors cursor-pointer w-full text-left"
                      >
                        <i
                          className={`text-xs text-gray-400 transition-transform ${
                            isGroupCollapsed ? "ri-arrow-right-s-line" : "ri-arrow-down-s-line"
                          }`}
                        />
                        <span className="text-xs uppercase tracking-wide">{groupName}</span>
                        <span className="text-[10px] font-semibold px-2 py-0.2 rounded-full bg-gray-200/70 dark:bg-slate-700 text-gray-600 dark:text-slate-300 ml-1">
                          {modulesInGroup.length}
                        </span>
                      </button>
                    </td>

                    {/* Master Checkbox & Group Checked Ratio for each column */}
                    {displayedColumns.map(({ role }) => {
                      const current = getRoleModules(role);
                      const isWildcard = current.includes("*");
                      const groupKeys = modulesInGroup.map((m) => m.key);
                      const activeCount = isWildcard
                        ? groupKeys.length
                        : groupKeys.filter((k) => current.includes(k)).length;

                      const isAll = activeCount === groupKeys.length;
                      const isSome = activeCount > 0 && activeCount < groupKeys.length;

                      return (
                        <td
                          key={role.id}
                          onClick={() => handleToggleGroup(role, groupName)}
                          className="p-3 text-center border-r border-gray-100 dark:border-slate-800/80 align-middle cursor-pointer hover:bg-blue-50/40 dark:hover:bg-slate-800/40"
                        >
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleGroup(role, groupName);
                              }}
                              className={`w-5 h-5 rounded flex items-center justify-center transition-all cursor-pointer ${
                                isAll
                                  ? "bg-[#253C7D] text-white shadow-2xs"
                                  : isSome
                                  ? "bg-[#253C7D]/85 text-white"
                                  : "bg-white dark:bg-slate-800 border-2 border-gray-300 dark:border-slate-600 hover:border-[#253C7D]"
                              }`}
                              title={`Toggle all ${groupName} permissions for ${role.name}`}
                            >
                              {isAll ? (
                                <i className="ri-check-line text-xs font-bold" />
                              ) : isSome ? (
                                <i className="ri-subtract-line text-xs font-bold" />
                              ) : null}
                            </button>
                            <span className="text-[10px] text-gray-400 font-semibold min-w-7 text-left">
                              {activeCount}/{groupKeys.length}
                            </span>
                          </div>
                        </td>
                      );
                    })}
                  </tr>

                  {/* Permission Sub-Rows */}
                  {!isGroupCollapsed &&
                    modulesInGroup.map((mod) => (
                      <tr
                        key={mod.key}
                        className="hover:bg-blue-50/30 dark:hover:bg-slate-800/30 transition-colors"
                      >
                        {/* Sticky Left Column: Permission Name + Info Icon */}
                        <td className="p-3 sticky left-0 z-10 bg-white dark:bg-slate-900 border-r border-gray-200/80 dark:border-slate-800">
                          <div className="flex items-center justify-between gap-2 pl-4">
                            <div className="flex items-center gap-2 min-w-0">
                              <i className={`${mod.icon} text-gray-400 dark:text-slate-500 text-xs`} />
                              <span className="font-medium text-gray-800 dark:text-slate-200 truncate">
                                {mod.label}
                              </span>
                            </div>

                            {/* Info tooltip */}
                            <div className="relative group shrink-0">
                              <i className="ri-information-line text-gray-300 hover:text-gray-600 dark:text-slate-600 dark:hover:text-slate-300 text-xs cursor-help" />
                              {mod.description && (
                                <div className="absolute left-6 top-1/2 -translate-y-1/2 z-40 hidden group-hover:block w-56 p-2 bg-gray-900 text-white dark:bg-slate-800 text-[11px] rounded-lg shadow-xl pointer-events-none">
                                  {mod.description}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Checkbox for each default category column */}
                        {displayedColumns.map(({ role }) => {
                          const current = getRoleModules(role);
                          const isChecked = current.includes("*") || current.includes(mod.key);

                          return (
                            <td
                              key={role.id}
                              onClick={() => handleTogglePermission(role, mod.key)}
                              className="p-3 text-center border-r border-gray-100 dark:border-slate-800/60 align-middle cursor-pointer hover:bg-blue-50/50 dark:hover:bg-slate-800/50"
                            >
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleTogglePermission(role, mod.key);
                                }}
                                className={`w-4.5 h-4.5 rounded flex items-center justify-center mx-auto transition-all cursor-pointer ${
                                  isChecked
                                    ? "bg-[#253C7D] text-white shadow-2xs border border-[#253C7D]"
                                    : "bg-white dark:bg-slate-800 border-2 border-gray-300 dark:border-slate-600 hover:border-[#253C7D]"
                                }`}
                                title={`${isChecked ? "Revoke" : "Grant"} ${mod.label} for ${role.name}`}
                              >
                                {isChecked && <i className="ri-check-line text-[11px] font-bold" />}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-gray-100 dark:border-slate-800 flex flex-wrap items-center justify-between text-xs text-gray-500 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-900/40">
        <div className="flex items-center gap-2">
          <i className="ri-checkbox-circle-line text-[#253C7D] dark:text-sky-400" />
          <span>
            Total: <b>{totalSystemModules} System Modules</b> · Check or uncheck permissions individually or in groups
          </span>
        </div>
        <div className="flex items-center gap-3 font-semibold text-gray-700 dark:text-slate-300">
          <span>5 Canonical Categories · {roles.length} Total Positions</span>
        </div>
      </div>
    </div>
  );
});
