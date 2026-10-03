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
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400 text-xs shadow-2xs">
        <div className="w-5 h-5 border-2 border-[#0088cc] border-t-transparent rounded-full animate-spin mx-auto mb-2.5" />
        Scanning soft-deleted records across modules...
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-16 text-center shadow-2xs">
        <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3 text-2xl">
          <i className="ri-delete-bin-line" />
        </div>
        <h3 className="text-sm font-semibold text-slate-800">Recycle Bin is empty</h3>
        <p className="text-xs text-slate-400 mt-1">There are no soft-deleted records available to restore.</p>
      </div>
    );
  }

  const allSelected = items.length > 0 && items.every((i) => selectedIds.has(`${i.table}-${i.id}`));
  const isIndeterminate = selectedIds.size > 0 && !allSelected;
  const selectedCount = selectedIds.size;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
      {/* Selection Control & Bulk Toolbar Header */}
      <div className="px-5 py-3 border-b border-slate-200 bg-slate-50/50 flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-2.5 text-xs font-semibold text-slate-700 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={allSelected}
            ref={(el) => { if (el) el.indeterminate = isIndeterminate; }}
            onChange={onToggleSelectAll}
            disabled={working}
            className="w-3.5 h-3.5 rounded border-slate-300 text-[#0088cc] cursor-pointer"
          />
          <span>{allSelected ? "All items selected" : selectedCount > 0 ? `${selectedCount} item(s) selected` : "Select all"}</span>
        </label>

        {selectedCount > 0 && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onBulkRestore}
              disabled={working}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded shadow-2xs cursor-pointer transition-colors"
            >
              <i className="ri-refresh-line text-xs" />
              <span>Restore Selected ({selectedCount})</span>
            </button>
            {isAdmin && (
              <button
                type="button"
                onClick={onConfirmBulkDelete}
                disabled={working}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-300 rounded shadow-2xs cursor-pointer transition-colors"
              >
                <i className="ri-delete-bin-line text-xs" />
                <span>Delete Forever ({selectedCount})</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClearSelection}
              disabled={working}
              className="px-2.5 py-1.5 text-xs text-slate-500 hover:text-slate-800 rounded cursor-pointer transition-colors"
            >
              Deselect
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 text-slate-600 font-semibold bg-slate-50/70">
              <th className="py-2.5 px-4 w-10 text-center" />
              <th className="py-2.5 px-4">Record Details</th>
              <th className="py-2.5 px-4 w-48">Module</th>
              <th className="py-2.5 px-4 w-56">Deleted Info</th>
              <th className="py-2.5 px-4 text-right w-24">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-800">
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
          </tbody>
        </table>
      </div>
    </div>
  );
});
