import { memo } from "react";
import type { BinItem } from "../types";
import { getModuleConfig } from "../recycleBinUtils";

interface RecycleBinItemRowProps {
  item: BinItem;
  isAdmin: boolean;
  working: boolean;
  onRestore: (item: BinItem) => void;
  onConfirmDelete: (item: BinItem) => void;
}

export const RecycleBinItemRow = memo(function RecycleBinItemRow({
  item,
  isAdmin,
  working,
  onRestore,
  onConfirmDelete,
}: RecycleBinItemRowProps) {
  const cfg = getModuleConfig(item.table);

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 flex flex-col sm:flex-row sm:items-center gap-3 shadow-2xs">
      <div className="w-10 h-10 rounded-xl bg-red-50 text-red-500 flex items-center justify-center shrink-0">
        <i className="ri-delete-bin-line text-lg" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-0.5">
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 flex items-center gap-1">
            <i className={cfg?.icon || "ri-file-line"} />
            {cfg?.name || item.table}
          </span>
        </div>
        <p className="text-sm font-semibold text-gray-900 truncate">{item.label}</p>
        <p className="text-xs text-gray-500 truncate">{item.detail}</p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-xs text-gray-500">
          Deleted {new Date(item.deleted_at).toLocaleString()}
          {item.deleted_by ? ` by ${item.deleted_by}` : ""}
        </p>
      </div>
      <div className="flex gap-2 shrink-0">
        <button
          onClick={() => onRestore(item)}
          disabled={working}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 cursor-pointer whitespace-nowrap disabled:opacity-50 transition-colors"
        >
          <i className="ri-refresh-line" />
          Restore
        </button>
        {isAdmin && (
          <button
            onClick={() => onConfirmDelete(item)}
            disabled={working}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 cursor-pointer whitespace-nowrap disabled:opacity-50 transition-colors"
          >
            <i className="ri-delete-bin-2-line" />
            Delete forever
          </button>
        )}
      </div>
    </div>
  );
});
