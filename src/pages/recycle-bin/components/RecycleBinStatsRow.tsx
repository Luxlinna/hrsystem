import { memo } from "react";

interface RecycleBinStatsRowProps {
  totalItems: number;
  activeModulesCount: number;
}

export const RecycleBinStatsRow = memo(function RecycleBinStatsRow({
  totalItems,
  activeModulesCount,
}: RecycleBinStatsRowProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-2xs">
        <p className="text-2xl font-bold text-gray-900">{totalItems}</p>
        <p className="text-xs text-gray-500">Items in Recycle Bin</p>
      </div>
      <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-2xs">
        <p className="text-2xl font-bold text-gray-900">{activeModulesCount}</p>
        <p className="text-xs text-gray-500">Modules with deleted items</p>
      </div>
      <div className="bg-white rounded-xl p-4 border border-gray-100 col-span-2 shadow-2xs flex items-center">
        <p className="text-sm text-gray-600 leading-relaxed">
          Deleted records are hidden from their module pages but kept in the database until you permanently delete them here.
        </p>
      </div>
    </div>
  );
});
