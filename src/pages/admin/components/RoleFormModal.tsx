import React, { memo } from "react";
import type { AppRole, RoleFormState } from "../types";
import { COLORS } from "../constants";
import { RoleScopeSection } from "./RoleScopeSection";
import { RoleModulesSection } from "./RoleModulesSection";

interface RoleFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingRole: AppRole | null;
  roleForm: RoleFormState;
  setRoleForm: React.Dispatch<React.SetStateAction<RoleFormState>>;
  savingRole: boolean;
  isSuperAdmin?: boolean;
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
  onSaveRole,
}: RoleFormModalProps) {
  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-50" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto">
        <div className="bg-white rounded-2xl w-full max-w-2xl my-8">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h3 className="text-base font-bold text-gray-900">{editingRole ? "Edit Role" : "Create New Role"}</h3>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 cursor-pointer">
              <i className="ri-close-line" />
            </button>
          </div>
          <div className="p-6 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Role Name *</label>
                <input
                  value={roleForm.name}
                  onChange={(e) => setRoleForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. HR Analyst"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#253C7D]/30"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Color</label>
                <div className="flex flex-wrap gap-2">
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setRoleForm((p) => ({ ...p, color: c }))}
                      className={`w-7 h-7 rounded-lg cursor-pointer transition-all ${roleForm.color === c ? "ring-2 ring-offset-1 ring-gray-400 scale-110" : ""}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Description</label>
              <input
                value={roleForm.description}
                onChange={(e) => setRoleForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="Brief description of this role..."
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#253C7D]/30"
              />
            </div>
            {isSuperAdmin && (
              <div className="flex items-center gap-3 p-3 bg-[#253C7D]/5 rounded-xl">
                <input
                  type="checkbox"
                  id="is_admin"
                  checked={roleForm.is_admin}
                  onChange={(e) => setRoleForm((p) => ({ ...p, is_admin: e.target.checked }))}
                  className="w-4 h-4 rounded cursor-pointer accent-[#253C7D]"
                />
                <label htmlFor="is_admin" className="text-sm font-medium text-gray-800 cursor-pointer">
                  Super Admin — grant full access to ALL modules across all branches
                </label>
              </div>
            )}

            {!roleForm.is_admin && <RoleScopeSection roleForm={roleForm} setRoleForm={setRoleForm} />}

            {!roleForm.is_admin && <RoleModulesSection roleForm={roleForm} setRoleForm={setRoleForm} />}

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg cursor-pointer"
              >Cancel</button>
              <button
                type="button"
                onClick={onSaveRole}
                disabled={savingRole}
                className="flex items-center gap-2 px-5 py-2 bg-[#253C7D] text-white rounded-lg text-sm hover:bg-[#1F336A] disabled:opacity-60 cursor-pointer whitespace-nowrap"
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
