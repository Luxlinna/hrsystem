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
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-800 pb-2">
        <span className="text-xs font-semibold text-gray-700 dark:text-slate-300">
          Module Access Permissions ({roleForm.allowed_modules.length}/{ALL_MODULES.length})
        </span>
        <div className="flex items-center gap-2 text-xs">
          <button
            type="button"
            onClick={() => setRoleForm((p) => ({ ...p, allowed_modules: ALL_MODULES.map((m) => m.key) }))}
            className="text-[#253C7D] dark:text-sky-400 font-medium cursor-pointer hover:underline text-[11px]"
          >
            Select All
          </button>
          <span className="text-gray-300 dark:text-slate-700">·</span>
          <button
            type="button"
            onClick={() => setRoleForm((p) => ({ ...p, allowed_modules: [] }))}
            className="text-gray-400 dark:text-slate-500 font-medium cursor-pointer hover:underline text-[11px]"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="space-y-4 max-h-[360px] overflow-y-auto pr-1 custom-scrollbar">
        {MODULE_GROUPS.map((group) => {
          const groupModules = ALL_MODULES.filter((m) => m.group === group);
          const allSelected = groupModules.every((m) => roleForm.allowed_modules.includes(m.key));
          return (
            <div key={group} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                  {group}
                </span>
                <button
                  type="button"
                  onClick={() => toggleAllInGroup(group)}
                  className="text-[10px] text-gray-400 hover:text-gray-700 dark:hover:text-slate-200 cursor-pointer"
                >
                  {allSelected ? "Deselect group" : "Select group"}
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {groupModules.map((mod) => {
                  const selected = roleForm.allowed_modules.includes(mod.key);
                  return (
                    <label
                      key={mod.key}
                      onClick={() => toggleModule(mod.key)}
                      className={`flex items-center gap-2 px-2.5 py-2 rounded-lg border text-xs font-medium transition-colors cursor-pointer select-none ${
                        selected
                          ? "bg-slate-50 dark:bg-slate-800 border-[#253C7D]/40 dark:border-sky-500 text-gray-900 dark:text-white"
                          : "bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 text-gray-600 dark:text-slate-400 hover:border-gray-300"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => {}}
                        className="rounded border-gray-300 text-[#253C7D] focus:ring-0 cursor-pointer"
                      />
                      <i className={`${mod.icon} text-sm text-gray-500 dark:text-slate-400 shrink-0`} />
                      <span className="truncate">{mod.label}</span>
                    </label>
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
