import { memo } from "react";
import type { BinItem } from "../types";
import { RecycleBinItemRow } from "./RecycleBinItemRow";

interface RecycleBinListViewProps {
  loading: boolean;
  items: BinItem[];
  isAdmin: boolean;
  working: boolean;
  onRestore: (item: BinItem) => void;
  onConfirmDelete: (item: BinItem) => void;
}

export const RecycleBinListView = memo(function RecycleBinListView({
  loading,
  items,
  isAdmin,
  working,
  onRestore,
  onConfirmDelete,
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

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <RecycleBinItemRow
          key={`${item.table}-${item.id}`}
          item={item}
          isAdmin={isAdmin}
          working={working}
          onRestore={onRestore}
          onConfirmDelete={onConfirmDelete}
        />
      ))}
    </div>
  );
});
