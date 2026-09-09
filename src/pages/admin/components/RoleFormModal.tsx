import React, { memo } from "react";
import type { AppRole, RoleFormState } from "../types";
import { COLORS } from "../constants";
import { RoleScopeSection } from "./RoleScopeSection";
import { RoleModulesSection } from "./RoleModulesSection";

interface BranchOption {
  id: string;
  name: string;
  is_site?: boolean;
  branch_id?: string;
}

interface RoleFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingRole: AppRole | null;
  roleForm: RoleFormState;
  setRoleForm: React.Dispatch<React.SetStateAction<RoleFormState>>;
  savingRole: boolean;
  isSuperAdmin?: boolean;
  branches?: BranchOption[];
  userBranchId?: string | null;
  userBranchName?: string | null;
  onSaveRole: () => void;
}

export const RoleFormModal = memo(function RoleFormModal({
  isOpen,
  onClose,
  editingRole,
  roleForm,
  setRoleForm,
  savingRole,
  isSuperAdmin = true,
  branches = [],
  userBranchId,
  userBranchName,
  onSaveRole,
}: RoleFormModalProps) {
  if (!isOpen) return null;

  const pureBranches = branches.filter((b) => !b.is_site);
  const effectiveBranchId = isSuperAdmin ? (roleForm.branch_id || "") : (userBranchId || "");
  const availableSites = branches.filter(
    (b) => b.is_site && b.branch_id === effectiveBranchId
  );

  const selectedBranchObj = pureBranches.find((b) => b.id === effectiveBranchId);
  const selectedSiteObj = availableSites.find(
    (s) => s.id.replace("site:", "") === (roleForm.work_location_id || "")
  );

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-50" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto">
        <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl my-8 border border-transparent dark:border-slate-800 shadow-2xl">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-800">
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-slate-100">
                {editingRole ? "Edit Role" : "Create New Role"}
              </h3>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                Configure role permissions belonging to a specific Business Unit or Site
              </p>
            </div>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400 dark:text-slate-400 cursor-pointer">
              <i className="ri-close-line" />
            </button>
          </div>
          <div className="p-6 space-y-5">
            {/* Scope Target (BU and Site) */}
            <div className="p-4 bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 rounded-xl space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-800 dark:text-slate-200 flex items-center gap-1.5 uppercase tracking-wider">
                  <i className="ri-shield-keyhole-line text-[#253C7D] dark:text-sky-400" />
                  Role Ownership & Scope
                </span>
                {effectiveBranchId ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-sky-950/60 text-[#253C7D] dark:text-sky-300 border border-blue-200/60 dark:border-sky-800/40">
                    BU-Specific Role
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/40">
                    Global System Role
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* BU Selector */}
                <div>
                  <label className="text-[11px] font-semibold text-gray-600 dark:text-slate-300 mb-1 block">
                    Business Unit (BU) *
                  </label>
                  {isSuperAdmin ? (
                    <select
                      value={roleForm.branch_id || ""}
                      onChange={(e) => {
                        const nextBranch = e.target.value || null;
                        setRoleForm((p) => ({
                          ...p,
                          branch_id: nextBranch,
                          // Reset work location if branch changed
                          work_location_id: null,
                        }));
                      }}
                      className="w-full px-3 py-2 border border-gray-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#253C7D]/30 cursor-pointer"
                    >
                      <option value="">Global (All Business Units)</option>
                      {pureBranches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="px-3 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-gray-800 dark:text-slate-200 flex items-center gap-2">
                      <i className="ri-building-line text-[#253C7D] dark:text-sky-400 shrink-0" />
                      <span className="truncate">{userBranchName || "Your Business Unit"}</span>
                      <span className="text-[10px] text-gray-400 dark:text-slate-500 font-normal ml-auto">(Assigned)</span>
                    </div>
                  )}
                </div>

                {/* Site Selector (Only available if a BU is selected) */}
                <div>
                  <label className="text-[11px] font-semibold text-gray-600 dark:text-slate-300 mb-1 block">
                    BU Site (Location Sub-scope)
                  </label>
                  <select
                    value={roleForm.work_location_id || ""}
                    onChange={(e) =>
                      setRoleForm((p) => ({ ...p, work_location_id: e.target.value || null }))
                    }
                    disabled={!effectiveBranchId}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#253C7D]/30 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">
                      {effectiveBranchId ? "All Sites in this BU (General BU Role)" : "Select a BU first"}
                    </option>
                    {availableSites.map((s) => {
                      const cleanId = s.id.replace("site:", "");
                      return (
                        <option key={cleanId} value={cleanId}>
                          ↳ {s.name} (Site)
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              <p className="text-[11px] text-gray-500 dark:text-slate-400">
                {selectedSiteObj
                  ? `This role and permissions will belong strictly to site "${selectedSiteObj.name}" inside ${selectedBranchObj?.name || userBranchName || "this BU"}.`
                  : selectedBranchObj || !isSuperAdmin
                  ? `This role and permissions will belong strictly to Business Unit "${selectedBranchObj?.name || userBranchName}". Users in other BUs will not have this role.`
                  : "Global roles apply across all Business Units unless overridden by a BU-specific role."}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-600 dark:text-slate-300 mb-1.5 block">Role Name *</label>
                <input
                  value={roleForm.name}
                  onChange={(e) => setRoleForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Branch Supervisor, Site Lead"
                  className="w-full px-3 py-2 border border-gray-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#253C7D]/30"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 dark:text-slate-300 mb-1.5 block">Color</label>
                <div className="flex flex-wrap gap-2">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setRoleForm((p) => ({ ...p, color: c }))}
                      className={`w-7 h-7 rounded-lg cursor-pointer transition-all ${roleForm.color === c ? "ring-2 ring-offset-1 ring-gray-400 dark:ring-offset-slate-900 scale-110" : ""}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 dark:text-slate-300 mb-1.5 block">Description</label>
              <input
                value={roleForm.description}
                onChange={(e) => setRoleForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="Brief description of this role..."
                className="w-full px-3 py-2 border border-gray-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-500 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#253C7D]/30"
              />
            </div>
            {isSuperAdmin && !effectiveBranchId && (
              <div className="flex items-center gap-3 p-3 bg-[#253C7D]/5 dark:bg-[#253C7D]/20 border border-transparent dark:border-blue-900/40 rounded-xl">
                <input
                  type="checkbox"
                  id="is_admin"
                  checked={roleForm.is_admin}
                  onChange={(e) => setRoleForm((p) => ({ ...p, is_admin: e.target.checked }))}
                  className="w-4 h-4 rounded cursor-pointer accent-[#253C7D]"
                />
                <label htmlFor="is_admin" className="text-sm font-medium text-gray-800 dark:text-slate-200 cursor-pointer">
                  Super Admin — grant full access to ALL modules across all branches
                </label>
              </div>
            )}

            {!roleForm.is_admin && <RoleScopeSection roleForm={roleForm} setRoleForm={setRoleForm} />}

            {!roleForm.is_admin && <RoleModulesSection roleForm={roleForm} setRoleForm={setRoleForm} />}

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
              >Cancel</button>
              <button
                type="button"
                onClick={onSaveRole}
                disabled={savingRole}
                className="flex items-center gap-2 px-5 py-2 bg-[#253C7D] dark:bg-blue-600 text-white rounded-lg text-sm hover:bg-[#1F336A] dark:hover:bg-blue-700 disabled:opacity-60 cursor-pointer whitespace-nowrap"
              >
                {savingRole ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <i className="ri-save-line" />}
                {editingRole ? "Update Role" : "Create Role"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
});
