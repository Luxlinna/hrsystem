import { memo } from "react";
import type { Branch, VisibleColumns } from "../types";

interface EmployeesAdvancedFiltersProps {
  showFilters: boolean;
  showColumnMenu: boolean;
  setShowColumnMenu: (show: boolean) => void;
  filterBranch: string;
  setFilterBranch: (branch: string) => void;
  filterAccount: string;
  setFilterAccount: (acc: string) => void;
  branches: Branch[];
  workSites?: { id: string; name: string; branch_id: string }[];
  visibleColumns: VisibleColumns;
  setVisibleColumns: React.Dispatch<React.SetStateAction<VisibleColumns>>;
}

export const EmployeesAdvancedFilters = memo(function EmployeesAdvancedFilters({
  showFilters,
  showColumnMenu,
  setShowColumnMenu,
  filterBranch,
  setFilterBranch,
  filterAccount,
  setFilterAccount,
  branches,
  workSites = [],
  visibleColumns,
  setVisibleColumns,
}: EmployeesAdvancedFiltersProps) {
  if (!showFilters && !showColumnMenu) return null;

  return (
    <div className="space-y-3">
      {showFilters && (
        <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 md:grid-cols-4 gap-2.5">
          <select
            value={filterBranch}
            onChange={(e) => setFilterBranch(e.target.value)}
            className="px-3 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-700 focus:outline-none focus:border-[#3498db] cursor-pointer"
          >
            <option value="">All Branches & Sites</option>
            {branches
              .filter((b) => !b.is_site && !b.id.startsWith("site:"))
              .map((b) => {
                const subSites = workSites.filter((s) => s.branch_id === b.id);
                if (subSites.length === 0) {
                  return (
                    <option key={b.id} value={`branch:${b.id}`}>
                      {b.name}
                    </option>
                  );
                }
                return (
                  <optgroup key={b.id} label={b.name}>
                    <option value={`branch:${b.id}`}>
                      {b.name} (All Locations)
                    </option>
                    <option value={`main:${b.id}`}>
                      ↳ Main Office Only
                    </option>
                    {subSites.map((s) => (
                      <option key={s.id} value={`site:${s.id}`}>
                        ↳ {s.name} (Sub-Branch)
                      </option>
                    ))}
                  </optgroup>
                );
              })}
          </select>

          <select
            value={filterAccount}
            onChange={(e) => setFilterAccount(e.target.value)}
            className="px-3 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-700 focus:outline-none focus:border-[#3498db] cursor-pointer"
          >
            <option value="">All Account Statuses</option>
            <option value="has_account">Has Account</option>
            <option value="invited">Invited</option>
            <option value="no_account">No Account</option>
          </select>

          <button
            type="button"
            onClick={() => setShowColumnMenu(!showColumnMenu)}
            className="px-3 py-1.5 rounded border border-slate-300 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <i className="ri-layout-column-line text-xs text-slate-500" />
            <span>Customize Columns</span>
          </button>
        </div>
      )}

      {showColumnMenu && (
        <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap gap-4">
          {Object.entries(visibleColumns).map(([key, visible]) => (
            <label key={key} className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={visible}
                onChange={(e) => setVisibleColumns((prev) => ({ ...prev, [key]: e.target.checked }))}
                className="w-3.5 h-3.5 rounded border-slate-300 text-[#3498db] focus:ring-[#3498db]"
              />
              <span className="capitalize">{key.replace(/([A-Z])/g, " $1").trim()}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
});
