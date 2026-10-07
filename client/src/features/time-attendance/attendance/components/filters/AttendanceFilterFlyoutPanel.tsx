import { memo, useState } from "react";

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
}

export const AttendanceFilterFlyoutPanel = memo(function AttendanceFilterFlyoutPanel({
  items,
  selectedSet,
  onToggleItem,
  onToggleAll,
  onApply,
  onReset,
}: AttendanceFilterFlyoutPanelProps) {
  const [displayLimit, setDisplayLimit] = useState(30);

  const allSelected = items.length > 0 && items.every((i) => selectedSet.has(i.id));
  const visibleItems = items.slice(0, displayLimit);
  const hasMore = items.length > displayLimit;

  return (
    <div className="w-64 py-2 px-2.5 flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800">
      {/* Scrollable Checkbox List */}
      <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1 text-xs text-slate-700 dark:text-slate-200">
        {/* 'All' Checkbox */}
        <label className="flex items-center gap-2 px-1.5 py-1 hover:bg-slate-50 dark:hover:bg-slate-800 rounded cursor-pointer select-none">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={onToggleAll}
            className="w-3.5 h-3.5 rounded border-slate-300 text-[#253C7D] focus:ring-[#253C7D] cursor-pointer"
          />
          <span className="font-medium text-slate-800 dark:text-slate-100">All</span>
        </label>

        {/* Item Checkboxes */}
        {visibleItems.map((item) => {
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
        })}

        {/* Load More Button */}
        {hasMore && (
          <button
            type="button"
            onClick={() => setDisplayLimit((prev) => prev + 30)}
            className="w-full text-left px-1.5 py-1 text-[11px] text-[#253C7D] dark:text-sky-400 hover:underline flex items-center gap-1 cursor-pointer font-medium"
          >
            <i className="ri-refresh-line text-xs" />
            <span>Load More ({visibleItems.length}/{items.length})</span>
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
