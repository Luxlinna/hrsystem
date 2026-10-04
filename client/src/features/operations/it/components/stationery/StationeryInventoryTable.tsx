import React from "react";
import type { StationeryItem } from "../../types";
import { STATIONERY_CATEGORY_CONFIG, STATIONERY_STATUS_CONFIG } from "../../constants";

interface StationeryInventoryTableProps {
  items: StationeryItem[];
  canManage: boolean;
  onEditItem: (item: StationeryItem) => void;
  onDeleteItem: (item: StationeryItem) => void;
  onOpenRestock: (item: StationeryItem) => void;
  onQuickRequest: (itemId: string) => void;
}

export function StationeryInventoryTable({
  items,
  canManage,
  onEditItem,
  onDeleteItem,
  onOpenRestock,
  onQuickRequest,
}: StationeryInventoryTableProps) {
  if (items.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-2xs">
        <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-3 text-gray-400">
          <i className="ri-inbox-archive-line text-2xl" />
        </div>
        <h3 className="text-sm font-bold text-gray-900">No stationery items found</h3>
        <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
          No inventory items matched your active search or category filters.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-2xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/70 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              <th className="py-3 px-4">Item &amp; Category</th>
              <th className="py-3 px-4">SKU / Code</th>
              <th className="py-3 px-4">Stock Level</th>
              <th className="py-3 px-4">Threshold</th>
              <th className="py-3 px-4">Storage Location</th>
              <th className="py-3 px-4">Unit Cost</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 text-xs">
            {items.map((item) => {
              const catConfig = STATIONERY_CATEGORY_CONFIG[item.category] || STATIONERY_CATEGORY_CONFIG["Other Supplies"];
              const isOutOfStock = item.stock_quantity <= 0;
              const isLowStock = !isOutOfStock && item.stock_quantity <= item.min_stock_level;
              const status = isOutOfStock
                ? STATIONERY_STATUS_CONFIG.out_of_stock
                : isLowStock
                ? STATIONERY_STATUS_CONFIG.low_stock
                : STATIONERY_STATUS_CONFIG.in_stock;

              return (
                <tr key={item.id} className="hover:bg-slate-50/70 transition-colors group">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-xl ${catConfig.bg} flex items-center justify-center shrink-0`}>
                        <i className={`${catConfig.icon} ${catConfig.color} text-base`} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-gray-900 truncate max-w-xs">{item.name}</p>
                        <p className="text-[10px] text-gray-400 font-medium">{item.category}</p>
                      </div>
                    </div>
                  </td>

                  <td className="py-3 px-4 font-mono font-semibold text-gray-600 tabular-nums">
                    {item.sku}
                  </td>

                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-black tabular-nums ${isOutOfStock ? "text-rose-600" : isLowStock ? "text-amber-600" : "text-gray-900"}`}>
                        {item.stock_quantity}
                      </span>
                      <span className="text-[11px] text-gray-400">{item.unit}</span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold ${status.bg} ${status.text} border ${status.border}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                        {status.label}
                      </span>
                    </div>
                  </td>

                  <td className="py-3 px-4 text-gray-500 font-medium tabular-nums">
                    Min: {item.min_stock_level} {item.unit}
                  </td>

                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1 text-gray-600 text-xs">
                      <i className="ri-map-pin-2-line text-gray-400" />
                      <span className="truncate">{item.location || "Not specified"}</span>
                    </div>
                  </td>

                  <td className="py-3 px-4 text-gray-600 font-semibold tabular-nums">
                    {item.unit_cost != null ? `$${item.unit_cost.toFixed(2)}` : "—"}
                  </td>

                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5 opacity-90 group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={() => onQuickRequest(item.id)}
                        className="px-2 py-1 bg-blue-50 text-[#253C7D] hover:bg-blue-100 rounded-lg text-[11px] font-bold transition-all cursor-pointer"
                        title="Request this item"
                      >
                        Request
                      </button>

                      {canManage && (
                        <>
                          <button
                            type="button"
                            onClick={() => onOpenRestock(item)}
                            className="px-2 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-[11px] font-bold transition-all cursor-pointer"
                            title="Restock units"
                          >
                            + Restock
                          </button>
                          <button
                            type="button"
                            onClick={() => onEditItem(item)}
                            className="p-1 text-gray-400 hover:text-[#253C7D] rounded-lg hover:bg-gray-100 transition-all cursor-pointer"
                            title="Edit item"
                          >
                            <i className="ri-edit-line text-sm" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteItem(item)}
                            className="p-1 text-gray-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-all cursor-pointer"
                            title="Delete item"
                          >
                            <i className="ri-delete-bin-line text-sm" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
