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
    <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-gray-200/80 shadow-2xs mb-4">
      {/* Select All Checkbox & Label */}
      <label className="flex items-center gap-2.5 text-xs font-semibold text-gray-700 cursor-pointer select-none">
        <input
          ref={checkboxRef}
          type="checkbox"
          checked={allSelected}
          onChange={onToggleSelectAll}
          disabled={working}
          className="w-4 h-4 rounded text-[#253C7D] border-gray-300 focus:ring-[#253C7D] cursor-pointer"
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
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={onMarkSelectedRead}
            disabled={working}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#253C7D] bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 cursor-pointer whitespace-nowrap disabled:opacity-50 transition-colors shadow-2xs"
          >
            <i className="ri-mail-open-line text-sm" />
            Mark Read ({selectedCount})
          </button>

          <button
            type="button"
            onClick={onDeleteSelected}
            disabled={working}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 rounded-xl hover:bg-rose-100 cursor-pointer whitespace-nowrap disabled:opacity-50 transition-colors shadow-2xs"
          >
            <i className="ri-delete-bin-line text-sm" />
            Delete ({selectedCount})
          </button>

          <button
            type="button"
            onClick={onClearSelection}
            disabled={working}
            className="px-2.5 py-1.5 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl cursor-pointer transition-colors"
          >
            Deselect
          </button>
        </div>
      )}
    </div>
  );
});
