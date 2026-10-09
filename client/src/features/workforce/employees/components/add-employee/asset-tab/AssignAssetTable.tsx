import { memo } from "react";
import type { AvailableAssetItem } from "./types";

interface AssignAssetTableProps {
  selectedAssets: AvailableAssetItem[];
  checkedTableIds: string[];
  onToggleSelectAll: () => void;
  onToggleItem: (id: string) => void;
}

export const AssignAssetTable = memo(function AssignAssetTable({
  selectedAssets,
  checkedTableIds,
  onToggleSelectAll,
  onToggleItem,
}: AssignAssetTableProps) {
  return (
    <div className="border border-slate-200 rounded-md overflow-hidden bg-white">
      <table className="w-full text-xs text-left">
        <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
          <tr>
            <th className="py-2.5 px-3 w-10 text-center">
              <input
                type="checkbox"
                checked={selectedAssets.length > 0 && checkedTableIds.length === selectedAssets.length}
                onChange={onToggleSelectAll}
                className="w-3.5 h-3.5 rounded border-slate-300 text-[#253C7D] focus:ring-[#253C7D] cursor-pointer"
              />
            </th>
            <th className="py-2.5 px-3 w-12 text-center">No.</th>
            <th className="py-2.5 px-3">Asset</th>
            <th className="py-2.5 px-3">Asset Category</th>
            <th className="py-2.5 px-3 w-28">Tag</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {selectedAssets.length === 0 ? (
            <tr>
              <td colSpan={5} className="py-8 text-center text-slate-400 font-bold">
                No records found
              </td>
            </tr>
          ) : (
            selectedAssets.map((asset, idx) => (
              <tr key={asset.id} className="hover:bg-slate-50/50">
                <td className="py-2 px-3 text-center">
                  <input
                    type="checkbox"
                    checked={checkedTableIds.includes(asset.id)}
                    onChange={() => onToggleItem(asset.id)}
                    className="w-3.5 h-3.5 rounded border-slate-300 text-[#253C7D] focus:ring-[#253C7D] cursor-pointer"
                  />
                </td>
                <td className="py-2 px-3 text-center text-slate-500 font-medium">
                  {idx + 1}
                </td>
                <td className="py-2 px-3 font-medium text-slate-800">
                  {asset.name}
                </td>
                <td className="py-2 px-3 text-slate-600">
                  {asset.category}
                </td>
                <td className="py-2 px-3 text-slate-500 font-mono">
                  {asset.tag}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
});
