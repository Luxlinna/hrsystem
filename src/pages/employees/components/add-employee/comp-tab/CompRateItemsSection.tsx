import { memo } from "react";
import type { EmployeeRateItem } from "../../../types";

interface CompRateItemsSectionProps {
  rateItems: EmployeeRateItem[];
  onRateItemChange: (idx: number, field: keyof EmployeeRateItem, value: any) => void;
  onAddRateItem: () => void;
  onRemoveRateItem: (idx: number) => void;
  onResetRateItems: () => void;
  totalRateItemsAmount: number;
}

export const CompRateItemsSection = memo(function CompRateItemsSection({
  rateItems,
  onRateItemChange,
  onAddRateItem,
  onRemoveRateItem,
  onResetRateItems,
  totalRateItemsAmount,
}: CompRateItemsSectionProps) {
  return (
    <div className="p-5 bg-white border border-slate-200/90 rounded-2xl shadow-2xs space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-lg bg-[#253C7D] text-white flex items-center justify-center text-xs shadow-2xs">
            <i className="ri-money-dollar-circle-line text-xs" />
          </span>
          <h3 className="text-xs font-black text-[#253C7D] uppercase tracking-wider">
            Rate Item Info
          </h3>
          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-blue-50 text-[#253C7D] border border-blue-200">
            {rateItems.length} Items
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onResetRateItems}
            className="px-2.5 py-1.5 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 text-xs font-bold transition-colors cursor-pointer"
            title="Reset to 9 Standard Rate Items"
          >
            <i className="ri-restart-line mr-1" />
            Reset Defaults
          </button>
          <button
            type="button"
            onClick={onAddRateItem}
            className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-[#253C7D] text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <i className="ri-add-line font-bold" />
            <span>Add Rate Item</span>
          </button>
        </div>
      </div>

      {/* Rate Items Table */}
      <div className="border border-slate-200 rounded-xl overflow-x-auto shadow-2xs">
        <table className="w-full text-xs text-left min-w-[700px]">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold text-[11px]">
            <tr>
              <th className="py-2.5 px-3 w-12 text-center">No.</th>
              <th className="py-2.5 px-3 w-48">Rate Item Name</th>
              <th className="py-2.5 px-3 w-36">Amount ($)</th>
              <th className="py-2.5 px-3">Remark</th>
              <th className="py-2.5 px-3 w-12 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {rateItems.map((item, idx) => (
              <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                <td className="py-2 px-3 text-center text-slate-500 font-bold">
                  {idx + 1}
                </td>
                <td className="py-2 px-3">
                  <input
                    type="text"
                    value={item.name}
                    onChange={(e) => onRateItemChange(idx, "name", e.target.value)}
                    placeholder="Rate item name"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#253C7D] bg-white"
                  />
                </td>
                <td className="py-2 px-3">
                  <div className="relative">
                    <span className="absolute left-2.5 top-1.5 text-xs text-slate-400 font-bold">
                      $
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      value={item.amount}
                      onChange={(e) => onRateItemChange(idx, "amount", e.target.value)}
                      placeholder="0"
                      className="w-full pl-6 pr-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-[#253C7D] bg-white"
                    />
                  </div>
                </td>
                <td className="py-2 px-3">
                  <input
                    type="text"
                    value={item.remark}
                    onChange={(e) => onRateItemChange(idx, "remark", e.target.value)}
                    placeholder="e.g. Monthly entitlement criteria"
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-700 focus:outline-none focus:border-[#253C7D] bg-white"
                  />
                </td>
                <td className="py-2 px-3 text-center">
                  <button
                    type="button"
                    onClick={() => onRemoveRateItem(idx)}
                    className="w-7 h-7 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors cursor-pointer mx-auto"
                    title="Remove rate item"
                  >
                    <i className="ri-delete-bin-line text-sm" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-slate-50/80 border-t border-slate-200 font-bold text-slate-800 text-xs">
            <tr>
              <td colSpan={2} className="py-2.5 px-3 text-right">
                Total Rate Items Allowance:
              </td>
              <td className="py-2.5 px-3 font-mono text-[#253C7D] text-xs">
                ${totalRateItemsAmount.toFixed(2)}
              </td>
              <td colSpan={2} className="py-2.5 px-3 text-slate-500 font-normal italic">
                Sum of all recurring itemized allowances &amp; perks
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
});
