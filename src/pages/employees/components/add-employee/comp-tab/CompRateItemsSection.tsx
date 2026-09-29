import { memo } from "react";
import type { EmployeeRateItem } from "../../../types";

interface CompRateItemsSectionProps {
  rateItems: EmployeeRateItem[];
  onRateItemChange: (idx: number, field: keyof EmployeeRateItem, value: any) => void;
}

export const CompRateItemsSection = memo(function CompRateItemsSection({
  rateItems,
  onRateItemChange,
}: CompRateItemsSectionProps) {
  return (
    <div className="space-y-4 pt-4 border-t border-slate-100">
      <h3 className="text-xs font-bold text-[#0088cc] uppercase tracking-wider">
        RATE ITEM INFO
      </h3>

      <div className="border border-slate-200 rounded-md overflow-hidden bg-white">
        <table className="w-full text-xs text-left">
          <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-700 font-bold text-xs">
            <tr>
              <th className="py-2.5 px-4 w-14 text-center font-bold text-slate-700">No.</th>
              <th className="py-2.5 px-4 w-52 font-bold text-slate-700">Rate Item Name</th>
              <th className="py-2.5 px-4 w-36 font-bold text-slate-700">Amount</th>
              <th className="py-2.5 px-4 font-bold text-slate-700">Remark</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rateItems.map((item, idx) => (
              <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                <td className="py-2 px-4 text-center text-slate-600 font-medium">
                  {idx + 1}
                </td>
                <td className="py-2 px-4 text-slate-800 font-medium">
                  {item.name}
                </td>
                <td className="py-2 px-4">
                  <input
                    type="number"
                    step="0.01"
                    value={item.amount}
                    onChange={(e) => onRateItemChange(idx, "amount", e.target.value)}
                    placeholder="0"
                    className="w-full max-w-[110px] px-3 py-1.5 rounded-md border border-slate-300 text-xs text-slate-800 focus:outline-none focus:border-[#0088cc] focus:ring-1 focus:ring-[#0088cc] bg-white transition-all"
                  />
                </td>
                <td className="py-2 px-4">
                  <input
                    type="text"
                    value={item.remark}
                    onChange={(e) => onRateItemChange(idx, "remark", e.target.value)}
                    placeholder=""
                    className="w-full px-3 py-1.5 rounded-md border border-slate-300 text-xs text-slate-800 focus:outline-none focus:border-[#0088cc] focus:ring-1 focus:ring-[#0088cc] bg-white transition-all"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
});
