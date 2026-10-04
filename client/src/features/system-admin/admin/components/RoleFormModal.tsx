import React, { memo, useState } from "react";
import type { AppRole, RoleFormState } from "../types";
import { COLORS, ROLE_CATEGORIES, CATEGORY_PRESETS, isDefaultCanonicalRole } from "../constants";
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
  const [activeTab, setActiveTab] = useState<"general" | "modules" | "approvals">("general");

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

  const isDefaultRole = editingRole ? isDefaultCanonicalRole(editingRole) : false;
  const currentCategory = ROLE_CATEGORIES.find((c) => c.key === roleForm.category) || ROLE_CATEGORIES[3]; // default line_manager

  const handleCategorySelect = (categoryKey: string) => {
    const preset = CATEGORY_PRESETS[categoryKey];
    if (!preset) return;
    setRoleForm((prev) => ({
      ...prev,
      category: categoryKey,
      color: preset.color,
      is_admin: preset.is_admin,
      allowed_modules: [...preset.allowed_modules],
      description: prev.description ? prev.description : preset.description,
      ...preset.scopes,
    }));
  };

  const handleApplyCategoryDefaults = () => {
    const preset = CATEGORY_PRESETS[roleForm.category];
    if (!preset) return;
    setRoleForm((prev) => ({
      ...prev,
      color: preset.color,
      is_admin: preset.is_admin,
      allowed_modules: [...preset.allowed_modules],
      description: preset.description,
      ...preset.scopes,
    }));
  };

  return (
    <>
      {/* Modal Backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-2xs z-50 transition-opacity" onClick={onClose} />

      {/* Modal Container */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
        <div className="bg-white dark:bg-slate-900 rounded-xl w-full max-w-2xl my-auto border border-gray-200 dark:border-slate-800 shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-800">
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-slate-100">
                {editingRole ? "Edit Role Position" : "Create Role Position"}
              </h3>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                Set up role details, business unit assignment, and permission levels.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 cursor-pointer transition-colors"
            >
              <i className="ri-close-line text-lg" />
            </button>
          </div>

          {/* Clean Segmented Navigation Tabs */}
          <div className="flex items-center px-6 pt-2 border-b border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50 gap-6">
            <button
              type="button"
              onClick={() => setActiveTab("general")}
              className={`pb-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "general"
                  ? "border-[#253C7D] text-[#253C7D] dark:border-sky-400 dark:text-sky-400"
                  : "border-transparent text-gray-500 hover:text-gray-800 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              <span>General Details</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("modules")}
              className={`pb-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "modules"
                  ? "border-[#253C7D] text-[#253C7D] dark:border-sky-400 dark:text-sky-400"
                  : "border-transparent text-gray-500 hover:text-gray-800 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              <span>Module Access</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-gray-200/70 dark:bg-slate-800 text-gray-700 dark:text-slate-300 font-medium">
                {roleForm.is_admin ? "All" : roleForm.allowed_modules.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("approvals")}
              className={`pb-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "approvals"
                  ? "border-[#253C7D] text-[#253C7D] dark:border-sky-400 dark:text-sky-400"
                  : "border-transparent text-gray-500 hover:text-gray-800 dark:text-slate-400 dark:hover:text-slate-200"
              }`}
            >
              <span>Approvals & Overrides</span>
            </button>
          </div>

          {/* Modal Content Body */}
          <div className="p-6 space-y-4 overflow-y-auto custom-scrollbar">
            {activeTab === "general" && (
              <div className="space-y-4">
                {/* Role Category Selector */}
                <div>
                  <label className="text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5 block">
                    Base Role Category Archetype <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-1.5">
                    {ROLE_CATEGORIES.map((cat) => {
                      const isSelected = roleForm.category === cat.key;
                      const displayName = cat.key === "chairwoman_and_chairman" ? "Chairwoman & Chair" : cat.name;
                      return (
                        <button
                          key={cat.key}
                          type="button"
                          disabled={isDefaultRole}
                          onClick={() => handleCategorySelect(cat.key)}
                          className={`px-3 py-2 rounded-lg border text-center transition-all cursor-pointer disabled:cursor-not-allowed ${
                            isSelected
                              ? "bg-[#253C7D] text-white border-[#253C7D] shadow-xs"
                              : "bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300 border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-750"
                          }`}
                        >
                          <div className="text-xs font-semibold truncate">{displayName}</div>
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex items-center justify-between mt-1.5 text-[11px] text-gray-500 dark:text-slate-400">
                    <span>
                      Baseline: <strong className="text-gray-700 dark:text-slate-300">{currentCategory.name}</strong> ({currentCategory.badge})
                    </span>
                    {!isDefaultRole && (
                      <button
                        type="button"
                        onClick={handleApplyCategoryDefaults}
                        className="text-[#253C7D] dark:text-sky-400 hover:underline cursor-pointer"
                      >
                        Reset Defaults
                      </button>
                    )}
                  </div>
                </div>

                {/* Role Title and Badge Color */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                  <div className="sm:col-span-2">
                    <label className="text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1 block">
                      Role Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      value={roleForm.name}
                      onChange={(e) => setRoleForm((p) => ({ ...p, name: e.target.value }))}
                      placeholder="e.g. Warehouse Supervisor, HR Executive"
                      className="w-full px-3 py-2 border border-gray-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#253C7D]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1 block">
                      Role Color
                    </label>
                    <div className="flex items-center gap-1.5 h-[34px] px-2 border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800">
                      {COLORS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setRoleForm((p) => ({ ...p, color: c }))}
                          className={`w-4 h-4 rounded-full cursor-pointer transition-transform ${
                            roleForm.color === c ? "ring-2 ring-offset-1 ring-gray-600 scale-115" : "opacity-80 hover:opacity-100"
                          }`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* BU & Site Assignment */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1 block">
                      Business Unit (BU) <span className="text-red-500">*</span>
                    </label>
                    {isSuperAdmin ? (
                      <select
                        value={roleForm.branch_id || ""}
                        onChange={(e) => {
                          const nextBranch = e.target.value || null;
                          setRoleForm((p) => ({
                            ...p,
                            branch_id: nextBranch,
                            work_location_id: null,
                          }));
                        }}
                        className="w-full px-3 py-2 border border-gray-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#253C7D] cursor-pointer"
                      >
                        <option value="">Global (All Business Units)</option>
                        {pureBranches.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-xs font-medium text-gray-700 dark:text-slate-300">
                        {userBranchName || "Your Business Unit"}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1 block">
                      BU Site (Sub-scope)
                    </label>
                    <select
                      value={roleForm.work_location_id || ""}
                      onChange={(e) =>
                        setRoleForm((p) => ({ ...p, work_location_id: e.target.value || null }))
                      }
                      disabled={!effectiveBranchId}
                      className="w-full px-3 py-2 border border-gray-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#253C7D] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="">
                        {effectiveBranchId ? "All Sites in this BU" : "Select a BU first"}
                      </option>
                      {availableSites.map((s) => {
                        const cleanId = s.id.replace("site:", "");
                        return (
                          <option key={cleanId} value={cleanId}>
                            {s.name}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1 block">
                    Description
                  </label>
                  <textarea
                    rows={2}
                    value={roleForm.description}
                    onChange={(e) => setRoleForm((p) => ({ ...p, description: e.target.value }))}
                    placeholder="Brief description of responsibilities and scope..."
                    className="w-full px-3 py-2 border border-gray-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#253C7D] resize-none"
                  />
                </div>
              </div>
            )}

            {/* Tab 2: Module Access */}
            {activeTab === "modules" && (
              <div>
                <RoleModulesSection roleForm={roleForm} setRoleForm={setRoleForm} />
              </div>
            )}

            {/* Tab 3: Approvals & Workflows */}
            {activeTab === "approvals" && (
              <div>
                <RoleScopeSection roleForm={roleForm} setRoleForm={setRoleForm} />
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 px-6 py-3.5 border-t border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition-colors"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={onSaveRole}
              disabled={savingRole}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#253C7D] dark:bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-[#1F336A] dark:hover:bg-blue-700 disabled:opacity-60 cursor-pointer shadow-xs transition-colors"
            >
              {savingRole ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>{editingRole ? "Save Changes" : "Create Role"}</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
});
