import { memo, useRef, useEffect } from "react";

interface NotificationsBulkActionBarProps {
  totalCount: number;
  selectedCount: number;
  allSelected: boolean;
  isIndeterminate: boolean;
  onToggleSelectAll: () => void;
  onClearSelection: () => void;
  onMarkSelectedRead: () => void;
  onDeleteSelected: () => void;
  working?: boolean;
}

export const NotificationsBulkActionBar = memo(function NotificationsBulkActionBar({
  totalCount,
  selectedCount,
  allSelected,
  isIndeterminate,
  onToggleSelectAll,
  onClearSelection,
  onMarkSelectedRead,
  onDeleteSelected,
  working = false,
}: NotificationsBulkActionBarProps) {
  const checkboxRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (checkboxRef.current) {
      checkboxRef.current.indeterminate = isIndeterminate;
    }
  }, [isIndeterminate]);

  if (totalCount === 0) return null;

  return (
    <div className="flex items-center justify-between gap-2.5 bg-white px-3 sm:px-3.5 py-2 rounded-xl border border-slate-200/80 shadow-2xs mb-3">
      {/* Select All Checkbox & Label */}
      <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer select-none">
        <input
          ref={checkboxRef}
          type="checkbox"
          checked={allSelected}
          onChange={onToggleSelectAll}
          disabled={working}
          className="w-3.5 h-3.5 rounded text-[#253C7D] border-slate-300 focus:ring-[#253C7D] cursor-pointer"
        />
        <span>
          {allSelected
            ? `All ${totalCount} selected`
            : selectedCount > 0
            ? `${selectedCount} of ${totalCount} selected`
            : "Select all"}
        </span>
      </label>

      {/* Action Buttons when 1+ selected */}
      {selectedCount > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={onMarkSelectedRead}
            disabled={working}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-[#253C7D] bg-blue-50/80 border border-blue-200 rounded-lg hover:bg-blue-100 cursor-pointer whitespace-nowrap disabled:opacity-50 transition-colors"
          >
            <i className="ri-mail-open-line text-xs" />
            <span>Mark Read ({selectedCount})</span>
          </button>

          <button
            type="button"
            onClick={onDeleteSelected}
            disabled={working}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-rose-600 bg-rose-50/80 border border-rose-200 rounded-lg hover:bg-rose-100 cursor-pointer whitespace-nowrap disabled:opacity-50 transition-colors"
          >
            <i className="ri-delete-bin-line text-xs" />
            <span>Delete</span>
          </button>

          <button
            type="button"
            onClick={onClearSelection}
            disabled={working}
            className="px-2 py-1 text-xs text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
          >
            Clear
          </button>
        </div>
      )}
    </div>
  );
});
