import { memo } from "react";
import type { EmployeeFormState, EmployeeAssetBookingItem } from "../../../types";
import { DatePickerDMY } from "@/components/common/DatePickerDMY";

interface OrgAssetInfoSectionProps {
  form: EmployeeFormState;
  onChange: (field: keyof EmployeeFormState, value: any) => void;
}

export const OrgAssetInfoSection = memo(function OrgAssetInfoSection({
  form,
  onChange,
}: OrgAssetInfoSectionProps) {
  const assets: EmployeeAssetBookingItem[] = form.asset_bookings || [];

  const handleAddRow = () => {
    const newAsset: EmployeeAssetBookingItem = {
      id: `asset-${Date.now()}`,
      name: "",
      category: "IT Equipment",
      tag: "",
      assign_for: "Full Day",
      from_date: new Date().toISOString().split("T")[0],
      to_date_never: true,
      to_date: "",
      remark: "",
      status: "Assigned",
    };
    onChange("asset_bookings", [...assets, newAsset]);
  };

  const handleRemoveRow = (index: number) => {
    const updated = assets.filter((_, i) => i !== index);
    onChange("asset_bookings", updated);
  };

  const handleUpdateRow = (index: number, field: keyof EmployeeAssetBookingItem, val: any) => {
    const updated = [...assets];
    updated[index] = { ...updated[index], [field]: val };
    onChange("asset_bookings", updated);
  };

  return (
    <div className="pt-6 border-t border-slate-100 w-full space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-[12px] font-bold text-[#253C7D] uppercase tracking-wider">
          Asset Info
        </h3>
        <button
          type="button"
          onClick={handleAddRow}
          className="w-6 h-6 rounded-full border border-[#253C7D] text-[#253C7D] hover:bg-blue-50 flex items-center justify-center text-sm transition-colors cursor-pointer"
          title="Add Asset"
        >
          <i className="ri-add-line" />
        </button>
      </div>

      <div className="border border-slate-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-700 font-semibold text-[11.5px]">
              <tr>
                <th className="py-2.5 px-3 w-12 text-center font-semibold">No.</th>
                <th className="py-2.5 px-3 min-w-[120px] font-semibold">Issue Date</th>
                <th className="py-2.5 px-3 min-w-[160px] font-semibold">Item Description</th>
                <th className="py-2.5 px-3 min-w-[60px] w-16 font-semibold">Qty</th>
                <th className="py-2.5 px-3 min-w-[140px] font-semibold">Remark</th>
                <th className="py-2.5 px-3 min-w-[110px] font-semibold">Attachment</th>
                <th className="py-2.5 px-3 w-10 text-center font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {assets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-7 text-center text-slate-400 font-normal">
                    Empty Employee Assets
                  </td>
                </tr>
              ) : (
                assets.map((item, idx) => (
                  <tr key={item.id || idx} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-2 px-3 text-center text-slate-500">{idx + 1}</td>
                    <td className="py-2 px-3">
                      <DatePickerDMY
                        value={item.from_date || ""}
                        onChange={(iso) => handleUpdateRow(idx, "from_date", iso)}
                        className="w-full px-2 py-1 rounded border border-slate-200 text-xs focus:outline-none focus:border-[#253C7D] focus:ring-1 focus:ring-[#253C7D] bg-white"
                      />
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="text"
                        placeholder="e.g. MacBook Pro M2"
                        value={item.name || ""}
                        onChange={(e) => handleUpdateRow(idx, "name", e.target.value)}
                        className="w-full px-2 py-1 rounded border border-slate-200 text-xs focus:outline-none focus:border-[#253C7D] focus:ring-1 focus:ring-[#253C7D]"
                      />
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="number"
                        min={1}
                        value={1}
                        readOnly
                        className="w-full px-2 py-1 rounded border border-slate-200 text-xs text-center font-mono focus:outline-none bg-slate-50"
                      />
                    </td>
                    <td className="py-2 px-3">
                      <input
                        type="text"
                        placeholder="Remark"
                        value={item.remark || ""}
                        onChange={(e) => handleUpdateRow(idx, "remark", e.target.value)}
                        className="w-full px-2 py-1 rounded border border-slate-200 text-xs focus:outline-none focus:border-[#253C7D] focus:ring-1 focus:ring-[#253C7D]"
                      />
                    </td>
                    <td className="py-2 px-3 text-slate-400 text-[11px] italic">
                      No file
                    </td>
                    <td className="py-2 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveRow(idx)}
                        className="text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                        title="Remove"
                      >
                        <i className="ri-delete-bin-line text-sm" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
});
