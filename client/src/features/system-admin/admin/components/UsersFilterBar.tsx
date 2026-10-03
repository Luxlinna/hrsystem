import { memo, useState, useRef, useEffect, useMemo } from "react";

interface BranchOption {
  id: string;
  name: string;
  is_site?: boolean;
  branch_id?: string;
}

interface UsersFilterBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filterBranch: string;
  setFilterBranch: (branchId: string) => void;
  isSuperAdmin: boolean;
  branches: BranchOption[];
  branchCounts: Record<string, number>;
  scopedTotal: number;
}

// ── Flyout checkbox panel (mirrors EmployeesFilterFlyoutPanel) ───────────────
interface FlyoutPanelProps {
  items: { id: string; label: string; isSite?: boolean }[];
  selectedValues: string[];
  onApply: (ids: string[]) => void;
  onReset: () => void;
}

function UsersFilterFlyoutPanel({ items, selectedValues, onApply, onReset }: FlyoutPanelProps) {
  const [pending, setPending] = useState<Set<string>>(() => new Set(selectedValues));

  const itemsKey = items.map((i) => i.id).join(",");
  const selectedKey = [...selectedValues].sort().join(",");

  useEffect(() => {
    setPending(new Set(selectedValues));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemsKey, selectedKey]);

  const allSelected = items.length > 0 && pending.size === items.length;

  const handleToggleAll = () => {
    if (allSelected) setPending(new Set());
    else setPending(new Set(items.map((i) => i.id)));
  };

  const handleToggleItem = (id: string) => {
    const next = new Set(pending);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setPending(next);
  };

  return (
    <div className="w-56 py-2 px-2.5 flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700">
      <div className="max-h-64 overflow-y-auto space-y-1 pr-1 text-xs text-slate-700 dark:text-slate-300">
        <label className="flex items-center gap-2 px-1.5 py-1 hover:bg-slate-50 dark:hover:bg-slate-800 rounded cursor-pointer select-none">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={handleToggleAll}
            className="w-3.5 h-3.5 rounded border-slate-300 text-[#253C7D] focus:ring-[#253C7D] cursor-pointer"
          />
          <span className="font-semibold text-slate-800 dark:text-slate-100">All</span>
        </label>

        {items.map((item) => (
          <label
            key={item.id}
            className="flex items-center gap-2 px-1.5 py-0.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded cursor-pointer select-none"
          >
            <input
              type="checkbox"
              checked={pending.has(item.id)}
              onChange={() => handleToggleItem(item.id)}
              className="w-3.5 h-3.5 rounded border-slate-300 text-[#253C7D] focus:ring-[#253C7D] cursor-pointer"
            />
            <span
              className={`truncate ${item.isSite ? "text-slate-500 dark:text-slate-400 pl-2" : "font-medium text-slate-800 dark:text-slate-200"}`}
              title={item.label}
            >
              {item.label}
            </span>
          </label>
        ))}
      </div>

      <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-700 flex items-center gap-2">
        <button
          type="button"
          onClick={() => onApply(allSelected ? [] : Array.from(pending))}
          className="flex-1 px-3 py-1.5 bg-[#253C7D] hover:bg-[#1E3066] text-white text-xs font-semibold rounded flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
        >
          <i className="ri-filter-3-fill text-xs" />
          <span>Apply</span>
        </button>
        <button
          type="button"
          onClick={() => { setPending(new Set()); onReset(); }}
          className="px-3 py-1.5 bg-slate-200/80 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-medium rounded flex items-center justify-center gap-1 transition-colors cursor-pointer"
        >
          <i className="ri-refresh-line text-xs" />
          <span>Reset</span>
        </button>
      </div>
    </div>
  );
}

// ── Main filter bar ──────────────────────────────────────────────────────────
export const UsersFilterBar = memo(function UsersFilterBar({
  searchQuery,
  setSearchQuery,
  filterBranch,
  setFilterBranch,
  isSuperAdmin,
  branches,
  branchCounts,
  scopedTotal,
}: UsersFilterBarProps) {
  const [flyoutOpen, setFlyoutOpen] = useState(false);
  const flyoutRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (flyoutRef.current && !flyoutRef.current.contains(e.target as Node)) {
        setFlyoutOpen(false);
      }
    }
    if (flyoutOpen) document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [flyoutOpen]);

  // Separate BU branches vs sites
  const pureBranches = useMemo(() => branches.filter((b) => !b.is_site), [branches]);
  const sites = useMemo(() => branches.filter((b) => b.is_site), [branches]);

  // Build flyout list matching the employee filter: BU header + "BU - Site" for each site
  // Same pattern as EmployeesFilterDropdown's siteOptions
  const flyoutItems = useMemo(() => {
    const list: { id: string; label: string; isSite?: boolean }[] = [];
    pureBranches.forEach((b) => {
      list.push({ id: b.id, label: b.name });
      sites
        .filter((s) => s.branch_id === b.id)
        .forEach((s) => list.push({ id: s.id, label: `${b.name} - ${s.name}`, isSite: true }));
    });
    // Orphan sites (no matched parent BU)
    sites
      .filter((s) => !s.branch_id || !pureBranches.find((b) => b.id === s.branch_id))
      .forEach((s) => list.push({ id: s.id, label: s.name, isSite: true }));
    return list;
  }, [pureBranches, sites]);

  const selectedIds = useMemo(
    () => (filterBranch && filterBranch !== "all" ? filterBranch.split(",").filter(Boolean) : []),
    [filterBranch]
  );

  const hasActiveFilter = selectedIds.length > 0;

  const activePillLabel = useMemo(() => {
    if (!hasActiveFilter) return null;
    if (selectedIds.length === 1) {
      const found = flyoutItems.find((x) => x.id === selectedIds[0]);
      return found ? found.label : selectedIds[0];
    }
    return `${selectedIds.length} selected`;
  }, [hasActiveFilter, selectedIds, flyoutItems]);

  return (
    <div className="bg-white dark:bg-slate-900 border border-gray-200/80 dark:border-slate-800 rounded-2xl p-3.5 shadow-2xs">
      {/* Search + Filter flyout button */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <i className="ri-search-line absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-400 text-sm" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search user by name, email, role, or branch..."
            className="w-full pl-9 pr-8 py-2 border border-gray-200 dark:border-slate-700 rounded-xl text-xs bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#253C7D]/20 dark:focus:ring-sky-500/20 focus:border-[#253C7D] dark:focus:border-sky-500 transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 p-0.5"
            >
              <i className="ri-close-line text-sm" />
            </button>
          )}
        </div>

        {/* Flyout filter button (Super Admin only) */}
        {isSuperAdmin && branches.length > 0 && (
          <div className="relative flex-shrink-0" ref={flyoutRef}>
            <button
              type="button"
              onClick={() => setFlyoutOpen((o) => !o)}
              className={`px-3 py-2 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                flyoutOpen || hasActiveFilter
                  ? "border-[#253C7D] bg-[#253C7D] text-white shadow-xs"
                  : "border-[#253C7D]/40 text-[#253C7D] dark:text-sky-400 bg-white dark:bg-slate-800 hover:bg-[#253C7D]/5 dark:hover:bg-slate-700"
              }`}
            >
              <i className="ri-building-line text-xs" />
              <span>{hasActiveFilter ? (activePillLabel ?? "Filter") : "Filter by BU / Site"}</span>
              {hasActiveFilter ? (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setFilterBranch("all"); }}
                  className="ml-0.5 opacity-80 hover:opacity-100"
                >
                  <i className="ri-close-line text-xs" />
                </button>
              ) : (
                <i className="ri-arrow-down-s-line text-xs opacity-90" />
              )}
            </button>

            {flyoutOpen && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 top-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded shadow-xl z-50 text-xs animate-in fade-in zoom-in-95 duration-100"
              >
                <UsersFilterFlyoutPanel
                  items={flyoutItems}
                  selectedValues={selectedIds}
                  onApply={(ids) => {
                    setFilterBranch(ids.length > 0 ? ids.join(",") : "all");
                    setFlyoutOpen(false);
                  }}
                  onReset={() => {
                    setFilterBranch("all");
                    setFlyoutOpen(false);
                  }}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
});
