import { memo } from "react";
import type { RoleFormState } from "../types";
import { COLORS, ROLE_CATEGORIES, CATEGORY_PRESETS } from "../constants";
import { RoleBuScopeSelector } from "./RoleBuScopeSelector";

interface BranchOption {
  id: string;
  name: string;
  is_site?: boolean;
  branch_id?: string;
}

interface Props {
  roleForm: RoleFormState;
  setRoleForm: React.Dispatch<React.SetStateAction<RoleFormState>>;
  isDefaultRole: boolean;
  isSuperAdmin: boolean;
  pureBranches: BranchOption[];
  availableSites: BranchOption[];
  userBranchName?: string | null;
}

export const RoleGeneralDetailsTab = memo(function RoleGeneralDetailsTab({
  roleForm,
  setRoleForm,
  isDefaultRole,
  isSuperAdmin,
  pureBranches,
  availableSites,
  userBranchName,
}: Props) {
  const currentCategory = ROLE_CATEGORIES.find((c) => c.key === roleForm.category) || ROLE_CATEGORIES[3];

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
    <div className="space-y-4">
      {/* 1. Role Category Selector */}
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

      {/* 2. Role Title and Badge Color */}
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

      {/* 3. BU & Site Assignment (Supports Global, 1 BU, or 2-3+ Multi-BUs) */}
      <RoleBuScopeSelector
        isSuperAdmin={isSuperAdmin}
        pureBranches={pureBranches}
        availableSites={availableSites}
        userBranchName={userBranchName}
        roleForm={roleForm}
        setRoleForm={setRoleForm}
      />

      {/* 4. Description */}
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
  );
});
