import { memo } from "react";
import type { RoleFormState } from "../types";
import { ALL_MODULES, MODULE_GROUPS } from "../constants";

interface RoleModulesSectionProps {
  roleForm: RoleFormState;
  setRoleForm: React.Dispatch<React.SetStateAction<RoleFormState>>;
}

export const RoleModulesSection = memo(function RoleModulesSection({
  roleForm,
  setRoleForm,
}: RoleModulesSectionProps) {
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
    <div>
      <div className="flex items-center justify-between mb-3">
        <label className="text-xs font-semibold text-gray-600 dark:text-slate-300">Module Permissions</label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setRoleForm((p) => ({ ...p, allowed_modules: ALL_MODULES.map((m) => m.key) }))}
            className="text-[11px] text-[#253C7D] dark:text-sky-400 font-medium cursor-pointer hover:underline"
          >
            Select All
          </button>
          <span className="text-gray-300 dark:text-slate-600">|</span>
          <button
            type="button"
            onClick={() => setRoleForm((p) => ({ ...p, allowed_modules: [] }))}
            className="text-[11px] text-gray-400 dark:text-slate-400 font-medium cursor-pointer hover:underline"
          >
            Clear
          </button>
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
                  type="button"
                  onClick={() => toggleAllInGroup(group)}
                  className={`w-4 h-4 rounded border-2 flex items-center justify-center cursor-pointer transition-colors ${
                    allSelected ? "bg-[#253C7D] border-[#253C7D] dark:bg-blue-600 dark:border-blue-600" : "border-gray-300 dark:border-slate-600"
                  }`}
                >
                  {allSelected && <i className="ri-check-line text-white text-[10px]" />}
                </button>
                <span className="text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">{group}</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 pl-2">
                {groupModules.map((mod) => {
                  const selected = roleForm.allowed_modules.includes(mod.key);
                  return (
                    <button
                      key={mod.key}
                      type="button"
                      onClick={() => toggleModule(mod.key)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] font-medium transition-all cursor-pointer text-left ${
                        selected
                          ? "bg-[#253C7D]/10 text-[#253C7D] dark:bg-blue-950/60 dark:text-blue-300"
                          : "bg-gray-50 text-gray-600 hover:bg-gray-100 dark:bg-slate-800/60 dark:text-slate-300 dark:hover:bg-slate-800"
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
  );
});
