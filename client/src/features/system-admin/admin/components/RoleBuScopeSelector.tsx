import { memo, useState, useRef, useEffect } from "react";
import type { RoleFormState } from "../types";
import { getShortBuName } from "../constants";

interface BranchOption {
  id: string;
  name: string;
  is_site?: boolean;
  branch_id?: string;
}

interface Props {
  isSuperAdmin: boolean;
  pureBranches: BranchOption[];
  availableSites: BranchOption[];
  userBranchName?: string | null;
  roleForm: RoleFormState;
  setRoleForm: React.Dispatch<React.SetStateAction<RoleFormState>>;
}

export const RoleBuScopeSelector = memo(function RoleBuScopeSelector({
  isSuperAdmin,
  pureBranches,
  availableSites,
  userBranchName,
  roleForm,
  setRoleForm,
}: Props) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedBranchIds = roleForm.branch_ids || (roleForm.branch_id ? roleForm.branch_id.split(",").filter(Boolean) : []);
  const isGlobal = selectedBranchIds.length === 0 && !roleForm.branch_id;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggleGlobal = () => {
    setRoleForm((prev) => ({
      ...prev,
      branch_id: null,
      branch_ids: [],
      work_location_id: null,
    }));
    setDropdownOpen(false);
  };

  const handleToggleBranch = (branchId: string) => {
    const current = new Set(selectedBranchIds);
    if (current.has(branchId)) {
      current.delete(branchId);
    } else {
      current.add(branchId);
    }
    const nextList = Array.from(current);
    setRoleForm((prev) => ({
      ...prev,
      branch_ids: nextList,
      branch_id: nextList.length === 1 ? nextList[0] : null,
      work_location_id: nextList.length === 1 ? prev.work_location_id : null,
    }));
  };

  const handleSelectAllBUs = () => {
    const allIds = pureBranches.map((b) => b.id);
    setRoleForm((prev) => ({
      ...prev,
      branch_ids: allIds,
      branch_id: null,
      work_location_id: null,
    }));
  };

  const filteredBranches = pureBranches.filter((b) =>
    b.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" ref={containerRef}>
      {/* 1. Business Unit Assignment */}
      <div className="relative">
        <label className="text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1 flex items-center justify-between">
          <span>Business Unit Scope <span className="text-red-500">*</span></span>
          {isSuperAdmin && (
            <span className="text-[10px] text-slate-400 font-normal">
              {isGlobal ? "All BUs" : `${selectedBranchIds.length} BU${selectedBranchIds.length > 1 ? "s" : ""} selected`}
            </span>
          )}
        </label>

        {!isSuperAdmin ? (
          <div className="px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-xs font-medium text-gray-700 dark:text-slate-300">
            {userBranchName || "Your Business Unit"}
          </div>
        ) : (
          <div>
            {/* Scope Trigger Box */}
            <div
              onClick={() => setDropdownOpen((p) => !p)}
              className="w-full min-h-[36px] px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-xs flex items-center justify-between cursor-pointer hover:border-blue-500 transition-colors gap-1.5 shadow-2xs"
            >
              <div className="flex flex-wrap items-center gap-1 min-w-0 max-h-16 overflow-y-auto">
                {isGlobal ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-semibold text-[11px]">
                    <i className="ri-global-line text-xs" />
                    <span>Global (All Business Units)</span>
                  </span>
                ) : (
                  selectedBranchIds.map((bId) => {
                    const bObj = pureBranches.find((b) => b.id === bId);
                    const shortName = getShortBuName(bObj?.name) || bId;
                    return (
                      <span
                        key={bId}
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-medium text-[10px]"
                      >
                        <span className="truncate max-w-[120px]">{shortName}</span>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleToggleBranch(bId); }}
                          className="hover:text-rose-600 cursor-pointer"
                        >
                          <i className="ri-close-line" />
                        </button>
                      </span>
                    );
                  })
                )}
              </div>
              <i className={`ri-arrow-down-s-line text-slate-400 text-xs shrink-0 transition-transform ${dropdownOpen ? "rotate-180 text-blue-600" : ""}`} />
            </div>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <div className="absolute z-50 left-0 mt-1 w-full sm:w-[320px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                {/* Search and Quick Action Header */}
                <div className="p-2 border-b border-slate-100 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-850 space-y-1.5">
                  <div className="relative">
                    <i className="ri-search-line absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search business units..."
                      className="w-full pl-7 pr-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 px-0.5">
                    <button
                      type="button"
                      onClick={handleToggleGlobal}
                      className={`font-semibold cursor-pointer ${isGlobal ? "text-blue-600" : "hover:text-slate-800 dark:hover:text-slate-200"}`}
                    >
                      <i className="ri-global-line mr-1" />Global (All)
                    </button>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={handleSelectAllBUs} className="text-blue-600 hover:underline cursor-pointer">
                        Select All
                      </button>
                      <span className="text-slate-300">|</span>
                      <button type="button" onClick={handleToggleGlobal} className="text-slate-500 hover:underline cursor-pointer">
                        Clear
                      </button>
                    </div>
                  </div>
                </div>

                {/* BU Checkboxes List */}
                <div className="max-h-48 overflow-y-auto py-1 divide-y divide-slate-50 dark:divide-slate-750">
                  {filteredBranches.map((b) => {
                    const isChecked = selectedBranchIds.includes(b.id);
                    return (
                      <label
                        key={b.id}
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-2.5 px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-750 cursor-pointer text-xs select-none transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleBranch(b.id)}
                          className="w-3.5 h-3.5 rounded text-blue-600 focus:ring-0 cursor-pointer"
                        />
                        <span className={`truncate text-xs ${isChecked ? "font-semibold text-blue-700 dark:text-blue-400" : "text-slate-700 dark:text-slate-300"}`}>
                          {b.name}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 2. BU Site (Sub-scope) */}
      <div>
        <label className="text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1 block">
          BU Site (Sub-scope)
        </label>
        <select
          value={roleForm.work_location_id || ""}
          onChange={(e) => setRoleForm((p) => ({ ...p, work_location_id: e.target.value || null }))}
          disabled={selectedBranchIds.length !== 1}
          className="w-full px-3 py-2 border border-gray-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#253C7D] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-2xs"
        >
          <option value="">
            {selectedBranchIds.length === 1
              ? "All Sites in this BU"
              : selectedBranchIds.length > 1
              ? "All Sites in selected BUs"
              : "Global (All Sites across BUs)"}
          </option>
          {selectedBranchIds.length === 1 &&
            availableSites.map((s) => {
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
  );
});
