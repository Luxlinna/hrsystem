import { memo, useState } from "react";
import type { ITAsset } from "../../types";
import { ASSET_STATUS_CONFIG } from "../../constants";

interface AssetsTableViewProps {
  assets: ITAsset[];
  canManage: boolean;
  onEdit: (asset: ITAsset) => void;
  onDelete: (asset: ITAsset) => void;
  selectedAssetIds?: string[];
  onToggleSelect?: (id: string) => void;
  onToggleSelectAll?: () => void;
}

type SortField = "category" | "name" | "purchase_date" | "description" | "condition" | "status";

export const AssetsTableView = memo(function AssetsTableView({
  assets,
  canManage: _canManage,
  onEdit,
  onDelete,
  selectedAssetIds = [],
  onToggleSelect,
  onToggleSelectAll,
}: AssetsTableViewProps) {
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortAsc, setSortAsc] = useState(true);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const sortedAssets = [...assets].sort((a, b) => {
    if (!sortField) return 0;
    let valA = "";
    let valB = "";

    switch (sortField) {
      case "category":
        valA = a.category || a.type || "";
        valB = b.category || b.type || "";
        break;
      case "name":
        valA = a.name || "";
        valB = b.name || "";
        break;
      case "purchase_date":
        valA = a.purchase_date || "";
        valB = b.purchase_date || "";
        break;
      case "description":
        valA = a.description || "";
        valB = b.description || "";
        break;
      case "condition":
        valA = a.condition || "";
        valB = b.condition || "";
        break;
      case "status":
        valA = a.status || "";
        valB = b.status || "";
        break;
    }

    const cmp = valA.localeCompare(valB, undefined, { numeric: true, sensitivity: "base" });
    return sortAsc ? cmp : -cmp;
  });

  const allSelected = assets.length > 0 && selectedAssetIds.length === assets.length;
  const isSomeSelected = selectedAssetIds.length > 0 && selectedAssetIds.length < assets.length;

  return (
    <div className="overflow-x-auto bg-white border border-slate-200/80 rounded-sm shadow-2xs">
      <table className="w-full text-left text-xs border-collapse">
        <thead>
          <tr className="border-b border-slate-200/90 bg-white text-[11px] font-semibold text-slate-700 select-none">
            {/* Checkbox Column */}
            <th className="w-10 px-4 py-3 text-center border-r border-transparent">
              <input
                type="checkbox"
                checked={allSelected}
                ref={(el) => {
                  if (el) el.indeterminate = isSomeSelected;
                }}
                onChange={onToggleSelectAll}
                className="w-3.5 h-3.5 rounded-sm border-slate-300 text-[#253C7D] focus:ring-[#253C7D] cursor-pointer"
              />
            </th>

            {/* No. Column */}
            <th className="px-3 py-3 w-12 text-slate-700 font-semibold">
              No.
            </th>

            {/* Category Column */}
            <th
              onClick={() => handleSort("category")}
              className="px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors font-semibold"
            >
              <div className="flex items-center gap-1.5">
                <span className="text-slate-700 font-semibold">Category</span>
                <i className="ri-arrow-up-down-line text-slate-400 text-[11px]" />
              </div>
            </th>

            {/* Name Column */}
            <th
              onClick={() => handleSort("name")}
              className="px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors font-semibold"
            >
              <div className="flex items-center gap-1.5">
                <span className="text-slate-700 font-semibold">Name</span>
                <i className="ri-arrow-up-down-line text-slate-400 text-[11px]" />
              </div>
            </th>

            {/* Purchase Date Column */}
            <th
              onClick={() => handleSort("purchase_date")}
              className="px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors font-semibold"
            >
              <div className="flex items-center gap-1.5">
                <span className="text-slate-700 font-semibold">Purchase Date</span>
                <i className="ri-arrow-up-down-line text-slate-400 text-[11px]" />
              </div>
            </th>

            {/* Description Column */}
            <th
              onClick={() => handleSort("description")}
              className="px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors font-semibold"
            >
              <div className="flex items-center gap-1.5">
                <span className="text-slate-700 font-semibold">Description</span>
                <i className="ri-arrow-up-down-line text-slate-400 text-[11px]" />
              </div>
            </th>

            {/* Condition Column */}
            <th
              onClick={() => handleSort("condition")}
              className="px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors font-semibold"
            >
              <div className="flex items-center gap-1.5">
                <span className="text-slate-700 font-semibold">Condition</span>
                <i className="ri-arrow-up-down-line text-slate-400 text-[11px]" />
              </div>
            </th>

            {/* Status Column */}
            <th
              onClick={() => handleSort("status")}
              className="px-4 py-3 cursor-pointer hover:bg-slate-50 transition-colors font-semibold"
            >
              <div className="flex items-center gap-1.5">
                <span className="text-slate-700 font-semibold">Status</span>
                <i className="ri-arrow-up-down-line text-slate-400 text-[11px]" />
              </div>
            </th>
          </tr>
        </thead>

        <tbody>
          {sortedAssets.length === 0 ? (
            /* Empty State matching Screenshot 1 */
            <tr>
              <td
                colSpan={8}
                className="py-3 px-4 text-center bg-[#f4f6f9] border-t border-slate-200 text-xs font-bold text-slate-700"
              >
                No records found
              </td>
            </tr>
          ) : (
            sortedAssets.map((asset, index) => {
              const isSelected = selectedAssetIds.includes(asset.id);
              const statusCfg =
                ASSET_STATUS_CONFIG[asset.status] || ASSET_STATUS_CONFIG.active;

              return (
                <tr
                  key={asset.id}
                  className={`border-b border-slate-100 transition-colors group ${
                    isSelected
                      ? "bg-sky-50/50 hover:bg-sky-50/80"
                      : "hover:bg-slate-50/70"
                  }`}
                >
                  {/* Checkbox */}
                  <td className="w-10 px-4 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggleSelect?.(asset.id)}
                      className="w-3.5 h-3.5 rounded-sm border-slate-300 text-[#253C7D] focus:ring-[#253C7D] cursor-pointer"
                    />
                  </td>

                  {/* No. */}
                  <td className="px-3 py-3 text-slate-600 font-medium text-xs">
                    {index + 1}
                  </td>

                  {/* Category */}
                  <td className="px-4 py-3 text-slate-800 font-medium max-w-[220px] truncate" title={asset.category || asset.type}>
                    {asset.category || asset.type || "General Equipment"}
                  </td>

                  {/* Name */}
                  <td className="px-4 py-3 text-slate-900 font-semibold max-w-[200px] truncate">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0 truncate">
                        {asset.photo_url && (
                          <img
                            src={asset.photo_url}
                            alt={asset.name}
                            className="w-6 h-6 rounded-xs object-cover border border-slate-200 shrink-0"
                          />
                        )}
                        <span className="truncate" title={asset.name}>{asset.name}</span>
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => onEdit(asset)}
                          className="p-1 text-slate-400 hover:text-[#253C7D] hover:bg-slate-100 rounded transition-colors"
                          title="Edit"
                        >
                          <i className="ri-edit-line text-xs" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(asset)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                          title="Delete"
                        >
                          <i className="ri-delete-bin-line text-xs" />
                        </button>
                      </div>
                    </div>
                  </td>

                  {/* Purchase Date */}
                  <td className="px-4 py-3 text-slate-600 whitespace-nowrap text-xs">
                    {asset.purchase_date || "—"}
                  </td>

                  {/* Description */}
                  <td className="px-4 py-3 text-slate-600 max-w-[260px] truncate text-xs" title={asset.description || ""}>
                    {asset.description || "—"}
                  </td>

                  {/* Condition */}
                  <td className="px-4 py-3 whitespace-nowrap text-xs">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                      {asset.condition || "Good"}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3 whitespace-nowrap text-xs">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                      {statusCfg.label}
                    </span>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
});


