import { useState, memo } from "react";
import type { EmployeeAssetBookingItem } from "../../types";

interface AssetBookingTableProps {
  bookings: EmployeeAssetBookingItem[];
  onAddAsset: () => void;
  onRemoveSelected: (ids: string[]) => void;
}

export const AssetBookingTable = memo(function AssetBookingTable({
  bookings,
  onAddAsset,
  onRemoveSelected,
}: AssetBookingTableProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const toggleSelectAll = () => {
    if (selectedIds.length === bookings.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(bookings.map((b) => b.id));
    }
  };

  const toggleItem = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleRemove = () => {
    if (selectedIds.length > 0) {
      onRemoveSelected(selectedIds);
      setSelectedIds([]);
    }
  };

  return (
    <div className="space-y-3">
      {/* Top Header & Actions */}
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-[#253C7D] uppercase tracking-wider">
          ASSET BOOKING INFO
        </h3>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRemove}
            disabled={selectedIds.length === 0}
            className="px-3 py-1.5 rounded-md border border-rose-300 hover:bg-rose-50 text-rose-600 disabled:opacity-40 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <i className="ri-delete-bin-line" />
            <span>Remove Asset</span>
          </button>
          <button
            type="button"
            onClick={onAddAsset}
            className="px-3 py-1.5 rounded-md border border-[#253C7D] hover:bg-[#253C7D]/10 text-[#253C7D] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <i className="ri-add-circle-line" />
            <span>Add Asset</span>
          </button>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="border border-slate-200 rounded-md overflow-hidden bg-white">
        <table className="w-full text-xs text-left">
          <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-700 font-bold">
            <tr>
              <th className="py-2.5 px-3 w-10 text-center">
                <input
                  type="checkbox"
                  checked={bookings.length > 0 && selectedIds.length === bookings.length}
                  onChange={toggleSelectAll}
                  className="w-3.5 h-3.5 rounded border-slate-300 text-[#253C7D] focus:ring-[#253C7D] cursor-pointer"
                />
              </th>
              <th className="py-2.5 px-3 w-12 text-center">No.</th>
              <th className="py-2.5 px-4 w-1/3">Asset</th>
              <th className="py-2.5 px-4">Assign Date</th>
              <th className="py-2.5 px-4">Remark</th>
              <th className="py-2.5 px-4 w-28">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {bookings.length === 0 ? (
              <>
                <tr>
                  <td colSpan={6} className="py-5 text-center text-slate-500 font-bold">
                    No records found
                  </td>
                </tr>
                <tr>
                  <td colSpan={6} className="py-5 text-center text-slate-500 font-bold bg-slate-50/30">
                    No records found
                  </td>
                </tr>
              </>
            ) : (
              bookings.map((item, idx) => (
                <tr key={item.id || idx} className="hover:bg-slate-50/50">
                  <td className="py-2.5 px-3 text-center">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(item.id)}
                      onChange={() => toggleItem(item.id)}
                      className="w-3.5 h-3.5 rounded border-slate-300 text-[#253C7D] focus:ring-[#253C7D] cursor-pointer"
                    />
                  </td>
                  <td className="py-2.5 px-3 text-center text-slate-500 font-medium">
                    {idx + 1}
                  </td>
                  <td className="py-2.5 px-4 font-medium text-slate-800">
                    {item.name}
                  </td>
                  <td className="py-2.5 px-4 text-slate-600 font-medium">
                    {item.from_date}
                  </td>
                  <td className="py-2.5 px-4 text-slate-600">
                    {item.remark || "-"}
                  </td>
                  <td className="py-2.5 px-4">
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {item.status || "Assigned"}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
});
