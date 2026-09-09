import { memo, useState, useRef } from "react";
import { useClickOutside } from "./useClickOutside";

export interface BranchOption {
  id: string;
  name: string;
  is_site?: boolean;
}

interface BranchSwitcherDropdownProps {
  visibleBranches: BranchOption[];
  selectedBranchId: string;
  onSelectBranch: (id: string) => void;
}

export const BranchSwitcherDropdown = memo(function BranchSwitcherDropdown({
  visibleBranches,
  selectedBranchId,
  onSelectBranch,
}: BranchSwitcherDropdownProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  useClickOutside([containerRef], () => setOpen(false));

  const selectedBranch = selectedBranchId === "all"
    ? null
    : visibleBranches.find((b) => b.id === selectedBranchId) || visibleBranches[0];
  const displayName = selectedBranchId === "all"
    ? "All Branches"
    : selectedBranch
      ? (selectedBranch.is_site ? `↳ ${selectedBranch.name} (Site)` : selectedBranch.name)
      : "No BU";

  return (
    <div className="relative hidden sm:inline-block" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/90 dark:hover:bg-slate-700/80 border border-gray-200/90 dark:border-slate-700 rounded-xl text-xs font-bold text-gray-700 dark:text-slate-200 transition-all shadow-2xs cursor-pointer active:scale-98"
        title="Select Business Unit or branch site"
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <i className="ri-building-line text-[#253C7D] dark:text-sky-400 text-sm shrink-0" />
        <span className="max-w-[150px] truncate text-xs font-bold text-gray-800 dark:text-slate-100">
          {displayName}
        </span>
        <i
          className={`ri-arrow-down-s-line text-xs text-gray-500 dark:text-slate-400 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-2 w-64 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl shadow-xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
          <div className="px-3 py-1.5 border-b border-gray-100 dark:border-slate-800 mb-1 flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-gray-400 dark:text-slate-400 uppercase tracking-wider">
              Select BU / Branch Site
            </span>
            <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500">
              {visibleBranches.length} locations
            </span>
          </div>

          <div className="max-h-64 overflow-y-auto space-y-0.5 py-0.5">
            <button
              type="button"
              onClick={() => {
                onSelectBranch("all");
                setOpen(false);
              }}
              className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs text-left transition-colors cursor-pointer ${
                selectedBranchId === "all"
                  ? "bg-blue-50/90 dark:bg-sky-950/60 text-[#253C7D] dark:text-sky-300 font-bold"
                  : "text-gray-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/80 font-medium"
              }`}
            >
              <i className="ri-community-line text-xs text-[#253C7D] dark:text-sky-400 shrink-0" />
              <span className="truncate flex-1 font-bold">All Branches / All BUs</span>
              {selectedBranchId === "all" && (
                <i className="ri-check-line text-sm text-[#253C7D] dark:text-sky-400 shrink-0" />
              )}
            </button>

            {visibleBranches.length === 0 ? (
              <div className="px-3 py-2 text-xs text-gray-400 dark:text-slate-500 text-center">
                No BU available
              </div>
            ) : (
              visibleBranches.map((b) => {
                const isSelected = b.id === selectedBranchId;
                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => {
                      onSelectBranch(b.id);
                      setOpen(false);
                    }}
                    className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs text-left transition-colors cursor-pointer ${
                      b.is_site ? "pl-5" : ""
                    } ${
                      isSelected
                        ? "bg-blue-50/90 dark:bg-sky-950/60 text-[#253C7D] dark:text-sky-300 font-bold"
                        : "text-gray-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/80 font-medium"
                    }`}
                  >
                    {b.is_site ? (
                      <i className="ri-map-pin-2-line text-xs text-emerald-500 shrink-0" />
                    ) : (
                      <i className="ri-building-2-line text-xs text-[#253C7D] dark:text-sky-400 shrink-0" />
                    )}
                    <span className="truncate flex-1">
                      {b.is_site ? `↳ ${b.name}` : b.name}
                    </span>
                    {b.is_site && (
                      <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 shrink-0">
                        Site
                      </span>
                    )}
                    {isSelected && (
                      <i className="ri-check-line text-sm text-[#253C7D] dark:text-sky-400 shrink-0" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
});
