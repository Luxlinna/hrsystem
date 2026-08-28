import React, { memo } from "react";
import type { AppRole, RoleFormState } from "../types";
import { ALL_MODULES, MODULE_GROUPS, COLORS, SCOPE_OVERRIDES } from "../constants";

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

  const toggleModule = (key: string) => {
    setRoleForm((prev) => ({
      ...prev,
      allowed_modules: prev.allowed_modules.includes(key)
        ? prev.allowed_modules.filter((m) => m !== key)
        : [...prev.allowed_modules, key],
    }));
  };

  const toggleAllInGroup = (group: string) => {
    const groupKeys = ALL_MODULES.filter((m) => m.group === group).map((m) => m.key) as string[];
    const allSelected = groupKeys.every((k) => roleForm.allowed_modules.includes(k));
    if (allSelected) {
      setRoleForm((p) => ({ ...p, allowed_modules: p.allowed_modules.filter((m) => !groupKeys.includes(m)) }));
    } else {
      const merged = Array.from(new Set([...roleForm.allowed_modules, ...groupKeys]));
      setRoleForm((p) => ({ ...p, allowed_modules: merged }));
    }
  };

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

            {!roleForm.is_admin && (
              <div className="space-y-4">
                {([
                  {
                    group: "action",
                    title: "Approval & Action Permissions",
                    caption: "What this role may DO to other people's records. Grant deliberately.",
                  },
                  {
                    group: "visibility",
                    title: "Data Visibility Overrides",
                    caption: "What this role may SEE beyond its own record. Seeing is not deciding.",
                  },
                ] as const).map((section) => {
                  const items = SCOPE_OVERRIDES.filter((o) => o.group === section.group);
                  const grantedCount = items.filter((o) => roleForm[o.key]).length;
                  const isAction = section.group === "action";

                  return (
                    <div key={section.group}>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-semibold text-gray-600">{section.title}</label>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            grantedCount > 0
                              ? "bg-[#253C7D]/10 text-[#253C7D]"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {grantedCount} / {items.length} granted
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 mb-2">{section.caption}</p>

                      <div className={`space-y-2 pr-1 ${isAction ? "" : "max-h-56 overflow-y-auto"}`}>
                        {items.map((o) => {
                          const checked = roleForm[o.key];
                          return (
                            <div
                              key={o.key}
                              className={`flex items-start gap-3 p-3 rounded-xl border transition-colors ${
                                checked
                                  ? "bg-[#253C7D]/5 border-[#253C7D]/25"
                                  : "bg-gray-50 border-gray-200"
                              }`}
                            >
                              <input
                                type="checkbox"
                                id={o.key}
                                checked={checked}
                                onChange={(e) => setRoleForm((p) => ({ ...p, [o.key]: e.target.checked }))}
                                className="w-4 h-4 mt-0.5 rounded cursor-pointer accent-[#253C7D] shrink-0"
                              />
                              <label htmlFor={o.key} className="text-sm font-medium text-gray-800 cursor-pointer">
                                {o.label}
                                <span className="block text-xs font-normal text-gray-500 mt-0.5">{o.hint}</span>
                              </label>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {!roleForm.is_admin && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-semibold text-gray-600">Module Permissions</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setRoleForm((p) => ({ ...p, allowed_modules: ALL_MODULES.map((m) => m.key) }))}
                      className="text-[11px] text-[#253C7D] font-medium cursor-pointer hover:underline"
                    >Select All</button>
                    <span className="text-gray-300">|</span>
                    <button
                      onClick={() => setRoleForm((p) => ({ ...p, allowed_modules: [] }))}
                      className="text-[11px] text-gray-400 font-medium cursor-pointer hover:underline"
                    >Clear</button>
                  </div>
                </div>
                <div className="space-y-4 max-h-64 overflow-y-auto">
                  {MODULE_GROUPS.map((group) => {
                    const groupModules = ALL_MODULES.filter((m) => m.group === group);
                    const allSelected = groupModules.every((m) => roleForm.allowed_modules.includes(m.key));
                    return (
                      <div key={group}>
                        <div className="flex items-center gap-2 mb-2">
                          <button
                            onClick={() => toggleAllInGroup(group)}
                            className={`w-4 h-4 rounded border-2 flex items-center justify-center cursor-pointer transition-colors ${allSelected ? "bg-[#253C7D] border-[#253C7D]" : "border-gray-300"}`}
                          >
                            {allSelected && <i className="ri-check-line text-white text-[10px]" />}
                          </button>
                          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">{group}</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 pl-2">
                          {groupModules.map((mod) => {
                            const selected = roleForm.allowed_modules.includes(mod.key);
                            return (
                              <button
                                key={mod.key}
                                onClick={() => toggleModule(mod.key)}
                                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] font-medium transition-all cursor-pointer text-left ${
                                  selected ? "bg-[#253C7D]/10 text-[#253C7D]" : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                                }`}
                              >
                                <i className={`${mod.icon} text-sm shrink-0`} />
                                <span className="truncate">{mod.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg cursor-pointer"
              >Cancel</button>
              <button
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
