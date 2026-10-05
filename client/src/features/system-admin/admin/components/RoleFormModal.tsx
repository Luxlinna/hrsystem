import React, { memo, useState } from "react";
import type { AppRole, RoleFormState } from "../types";
import { isDefaultCanonicalRole } from "../constants";
import { RoleScopeSection } from "./RoleScopeSection";
import { RoleModulesSection } from "./RoleModulesSection";
import { RoleGeneralDetailsTab } from "./RoleGeneralDetailsTab";

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
  const selectedBUs = roleForm.branch_ids || (roleForm.branch_id ? [roleForm.branch_id] : []);
  const effectiveBranchId = !isSuperAdmin
    ? (userBranchId || "")
    : (selectedBUs.length === 1 ? selectedBUs[0] : "");
  const availableSites = branches.filter(
    (b) => b.is_site && b.branch_id === effectiveBranchId
  );

  const isDefaultRole = editingRole ? isDefaultCanonicalRole(editingRole) : false;

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
              <RoleGeneralDetailsTab
                roleForm={roleForm}
                setRoleForm={setRoleForm}
                isDefaultRole={isDefaultRole}
                isSuperAdmin={isSuperAdmin}
                pureBranches={pureBranches}
                availableSites={availableSites}
                userBranchName={userBranchName}
              />
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
