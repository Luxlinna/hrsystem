import { memo } from "react";
import type { BinItem } from "../types";
import { RecycleBinItemRow } from "./RecycleBinItemRow";

interface RecycleBinListViewProps {
  loading: boolean;
  items: BinItem[];
  isAdmin: boolean;
  working: boolean;
  selectedIds: Set<string>;
  onToggleSelect: (item: BinItem) => void;
  onToggleSelectAll: () => void;
  onClearSelection: () => void;
  onRestore: (item: BinItem) => void;
  onBulkRestore: () => void;
  onConfirmDelete: (item: BinItem) => void;
  onConfirmBulkDelete: () => void;
}

export const RecycleBinListView = memo(function RecycleBinListView({
  loading,
  items,
  isAdmin,
  working,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onClearSelection,
  onRestore,
  onBulkRestore,
  onConfirmDelete,
  onConfirmBulkDelete,
}: RecycleBinListViewProps) {
  if (loading) {
    return (
      <div className="text-center py-12 text-gray-400 text-sm">
        <div className="w-8 h-8 border-2 border-[#253C7D] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        Scanning soft-deleted records across all modules...
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-xl border border-gray-100 shadow-2xs">
        <i className="ri-delete-bin-7-line text-4xl text-gray-200" />
        <p className="text-gray-400 mt-2 text-sm">The Recycle Bin is empty.</p>
      </div>
    );
  }

  const allSelected = items.length > 0 && items.every((i) => selectedIds.has(`${i.table}-${i.id}`));
  const isIndeterminate = selectedIds.size > 0 && !allSelected;
  const selectedCount = selectedIds.size;

  return (
    <div className="space-y-3">
      {/* Selection Control & Bulk Toolbar Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-gray-200 shadow-2xs">
        <label className="flex items-center gap-2.5 text-sm font-medium text-gray-700 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={allSelected}
            ref={(el) => {
              if (el) el.indeterminate = isIndeterminate;
            }}
            onChange={onToggleSelectAll}
            disabled={working}
            className="w-4 h-4 rounded text-[#253C7D] border-gray-300 focus:ring-[#253C7D] cursor-pointer"
          />
          <span>
            {allSelected ? "All items selected" : selectedCount > 0 ? `${selectedCount} item(s) selected` : "Select all"}
          </span>
        </label>

        {selectedCount > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={onBulkRestore}
              disabled={working}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-300 rounded-lg hover:bg-emerald-100 cursor-pointer whitespace-nowrap disabled:opacity-50 transition-colors shadow-2xs"
            >
              <i className="ri-refresh-line" />
              Restore Selected ({selectedCount})
            </button>
            {isAdmin && (
              <button
                onClick={onConfirmBulkDelete}
                disabled={working}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 border border-red-300 rounded-lg hover:bg-red-100 cursor-pointer whitespace-nowrap disabled:opacity-50 transition-colors shadow-2xs"
              >
                <i className="ri-delete-bin-2-line" />
                Delete Forever ({selectedCount})
              </button>
            )}
            <button
              onClick={onClearSelection}
              disabled={working}
              className="px-2.5 py-1.5 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors"
            >
              Deselect
            </button>
          </div>
        )}
      </div>

      {items.map((item) => {
        const key = `${item.table}-${item.id}`;
        return (
          <RecycleBinItemRow
            key={key}
            item={item}
            isAdmin={isAdmin}
            working={working}
            selected={selectedIds.has(key)}
            onToggleSelect={onToggleSelect}
            onRestore={onRestore}
            onConfirmDelete={onConfirmDelete}
          />
        );
      })}
    </div>
  );
});
