import { memo, useState, useMemo, useEffect, useCallback } from "react";

export interface FilterOptionItem {
  id: string;
  label: string;
  fullLabel?: string;
  isSubItem?: boolean;
}

interface AttendanceFilterFlyoutPanelProps {
  items: FilterOptionItem[];
  selectedSet: Set<string>;
  onToggleItem: (id: string) => void;
  onToggleAll: () => void;
  onApply: () => void;
  onReset: () => void;
  categoryLabel?: string;
}

export const AttendanceFilterFlyoutPanel = memo(function AttendanceFilterFlyoutPanel({
  items,
  selectedSet,
  onToggleItem,
  onToggleAll,
  onApply,
  onReset,
  categoryLabel,
}: AttendanceFilterFlyoutPanelProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [displayLimit, setDisplayLimit] = useState(30);

  // Reset search term and display limit when switching category
  useEffect(() => {
    setSearchTerm("");
    setDisplayLimit(30);
  }, [items]);

  const filteredItems = useMemo(() => {
    if (!searchTerm.trim()) return items;
    const q = searchTerm.toLowerCase().trim();
    return items.filter(
      (i) =>
        i.label.toLowerCase().includes(q) ||
        (i.fullLabel && i.fullLabel.toLowerCase().includes(q))
    );
  }, [items, searchTerm]);

  const isFiltering = searchTerm.trim().length > 0;
  const allSelected =
    filteredItems.length > 0 && filteredItems.every((i) => selectedSet.has(i.id));
  const visibleItems = filteredItems.slice(0, displayLimit);
  const hasMore = filteredItems.length > displayLimit;

  const handleToggleAllOrFiltered = useCallback(() => {
    if (!isFiltering) {
      onToggleAll();
      return;
    }
    const allFilteredChecked =
      filteredItems.length > 0 && filteredItems.every((i) => selectedSet.has(i.id));
    if (allFilteredChecked) {
      filteredItems.forEach((i) => {
        if (selectedSet.has(i.id)) onToggleItem(i.id);
      });
    } else {
      filteredItems.forEach((i) => {
        if (!selectedSet.has(i.id)) onToggleItem(i.id);
      });
    }
  }, [isFiltering, onToggleAll, filteredItems, selectedSet, onToggleItem]);

  return (
    <div className="w-64 py-2 px-2.5 flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800">
      {/* Quick Search inside filter category */}
      <div className="relative mb-2">
        <i className="ri-search-line absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-xs pointer-events-none" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setDisplayLimit(30);
          }}
          placeholder={categoryLabel ? `Search ${categoryLabel.toLowerCase()}...` : "Search..."}
          className="w-full pl-6.5 pr-6 py-1 text-xs border border-slate-200 dark:border-slate-700 rounded bg-slate-50/70 dark:bg-slate-800/80 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:border-[#253C7D] text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 transition-colors"
        />
        {searchTerm && (
          <button
            type="button"
            onClick={() => setSearchTerm("")}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-0.5 rounded cursor-pointer"
          >
            <i className="ri-close-line text-xs" />
          </button>
        )}
      </div>

      {/* Scrollable Checkbox List */}
      <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1 text-xs text-slate-700 dark:text-slate-200">
        {/* 'All' Checkbox */}
        <label className="flex items-center gap-2 px-1.5 py-1 hover:bg-slate-50 dark:hover:bg-slate-800 rounded cursor-pointer select-none">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={handleToggleAllOrFiltered}
            className="w-3.5 h-3.5 rounded border-slate-300 text-[#253C7D] focus:ring-[#253C7D] cursor-pointer"
          />
          <span className="font-medium text-slate-800 dark:text-slate-100">
            {isFiltering ? "Select All Matches" : "All"}
          </span>
        </label>

        {/* Item Checkboxes */}
        {visibleItems.length === 0 ? (
          <div className="py-4 text-center text-xs text-slate-400 dark:text-slate-500">
            No matching options
          </div>
        ) : (
          visibleItems.map((item) => {
            const isChecked = selectedSet.has(item.id);
            return (
              <label
                key={item.id}
                className={`flex items-center gap-2 px-1.5 py-0.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded cursor-pointer select-none ${
                  item.isSubItem ? "pl-5 text-slate-600 dark:text-slate-300" : ""
                }`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => onToggleItem(item.id)}
                  className="w-3.5 h-3.5 rounded border-slate-300 text-[#253C7D] focus:ring-[#253C7D] cursor-pointer"
                />
                <span className="truncate text-slate-700 dark:text-slate-200" title={item.fullLabel || item.label}>
                  {item.label}
                </span>
              </label>
            );
          })
        )}

        {/* Load More Button */}
        {hasMore && (
          <button
            type="button"
            onClick={() => setDisplayLimit((prev) => prev + 30)}
            className="w-full text-left px-1.5 py-1 text-[11px] text-[#253C7D] dark:text-sky-400 hover:underline flex items-center gap-1 cursor-pointer font-medium"
          >
            <i className="ri-refresh-line text-xs" />
            <span>Load More ({visibleItems.length}/{filteredItems.length})</span>
          </button>
        )}
      </div>

      {/* Bottom Action Buttons matching ERP design */}
      <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
        <button
          type="button"
          onClick={onApply}
          className="flex-1 px-3 py-1.5 bg-[#253C7D] hover:bg-[#1E3066] text-white text-xs font-semibold rounded flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
        >
          <i className="ri-filter-3-fill text-xs" />
          <span>Apply</span>
        </button>
        <button
          type="button"
          onClick={onReset}
          className="px-3 py-1.5 bg-slate-200/80 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium rounded flex items-center justify-center gap-1 transition-colors cursor-pointer"
        >
          <i className="ri-refresh-line text-xs" />
          <span>Reset</span>
        </button>
      </div>
    </div>
  );
});
