import { memo, useState, useEffect } from "react";

export interface FilterOptionItem {
  id: string;
  label: string;
}

interface EmployeesFilterFlyoutPanelProps {
  items: FilterOptionItem[];
  selectedValues: string[];
  onApply: (selectedIds: string[]) => void;
  onReset: () => void;
}

export const EmployeesFilterFlyoutPanel = memo(function EmployeesFilterFlyoutPanel({
  items,
  selectedValues,
  onApply,
  onReset,
}: EmployeesFilterFlyoutPanelProps) {
  const [pending, setPending] = useState<Set<string>>(() => new Set(selectedValues));
  const [displayLimit, setDisplayLimit] = useState(30);

  useEffect(() => {
    setPending(new Set(selectedValues));
    setDisplayLimit(30);
  }, [items, selectedValues]);

  const allSelected = items.length > 0 && pending.size === items.length;

  const handleToggleAll = () => {
    if (allSelected) {
      setPending(new Set());
    } else {
      setPending(new Set(items.map((i) => i.id)));
    }
  };

  const handleToggleItem = (id: string) => {
    const next = new Set(pending);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setPending(next);
  };

  const visibleItems = items.slice(0, displayLimit);
  const hasMore = items.length > displayLimit;

  return (
    <div className="w-52 py-2 px-2.5 flex flex-col bg-white border-r border-slate-200">
      {/* Scrollable Checkbox List */}
      <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1 text-xs text-slate-700">
        {/* 'All' Checkbox */}
        <label className="flex items-center gap-2 px-1.5 py-1 hover:bg-slate-50 rounded cursor-pointer select-none">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={handleToggleAll}
            className="w-3.5 h-3.5 rounded border-slate-300 text-[#3498db] focus:ring-[#3498db] cursor-pointer"
          />
          <span className="font-medium text-slate-800">All</span>
        </label>

        {/* Item Checkboxes */}
        {visibleItems.map((item) => {
          const isChecked = pending.has(item.id);
          return (
            <label
              key={item.id}
              className="flex items-center gap-2 px-1.5 py-0.5 hover:bg-slate-50 rounded cursor-pointer select-none"
            >
              <input
                type="checkbox"
                checked={isChecked}
                onChange={() => handleToggleItem(item.id)}
                className="w-3.5 h-3.5 rounded border-slate-300 text-[#3498db] focus:ring-[#3498db] cursor-pointer"
              />
              <span className="truncate text-slate-700" title={item.label}>
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
            className="w-full text-left px-1.5 py-1 text-[11px] text-[#3498db] hover:underline flex items-center gap-1 cursor-pointer font-medium"
          >
            <i className="ri-refresh-line text-xs" />
            <span>Load More {visibleItems.length}/ {items.length}</span>
          </button>
        )}
      </div>

      {/* Bottom Action Buttons matching screenshot */}
      <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center gap-2">
        <button
          type="button"
          onClick={() => onApply(allSelected ? [] : Array.from(pending))}
          className="flex-1 px-3 py-1.5 bg-[#3498db] hover:bg-[#2980b9] text-white text-xs font-semibold rounded flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
        >
          <i className="ri-filter-3-fill text-xs" />
          <span>Apply</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setPending(new Set());
            onReset();
          }}
          className="px-3 py-1.5 bg-slate-200/80 hover:bg-slate-300 text-slate-700 text-xs font-medium rounded flex items-center justify-center gap-1 transition-colors cursor-pointer"
        >
          <i className="ri-refresh-line text-xs" />
          <span>Reset</span>
        </button>
      </div>
    </div>
  );
});
