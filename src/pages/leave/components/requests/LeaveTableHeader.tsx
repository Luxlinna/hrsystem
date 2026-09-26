import { memo } from "react";

interface LeaveTableHeaderProps {
  allSelected: boolean;
  onSelectAll: (checked: boolean) => void;
}

export const LeaveTableHeader = memo(function LeaveTableHeader({
  allSelected,
  onSelectAll,
}: LeaveTableHeaderProps) {
  return (
    <thead>
      <tr className="border-b border-gray-200 bg-white text-[12px] font-semibold text-gray-600 select-none">
        <th className="w-10 px-4 py-3 text-center">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={(e) => onSelectAll(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-[#253C7D] focus:ring-0 cursor-pointer"
          />
        </th>
        <th className="w-12 px-3 py-3 font-semibold text-gray-600">
          No.
        </th>
        <th className="px-4 py-3 font-semibold text-gray-600">
          <div className="flex items-center gap-1.5 cursor-pointer hover:text-gray-900">
            <span>Leave Type</span>
            <i className="ri-arrow-up-down-line text-[11px] text-gray-400" />
          </div>
        </th>
        <th className="px-4 py-3 font-semibold text-gray-600">
          <div className="flex items-center gap-1.5 cursor-pointer hover:text-gray-900">
            <span>Employee</span>
            <i className="ri-arrow-up-down-line text-[11px] text-gray-400" />
          </div>
        </th>
        <th className="px-4 py-3 font-semibold text-gray-600">
          <div className="flex items-center gap-1.5 cursor-pointer hover:text-gray-900">
            <span>Leave Date</span>
            <i className="ri-arrow-up-down-line text-[11px] text-gray-400" />
          </div>
        </th>
        <th className="px-4 py-3 font-semibold text-gray-600">
          <div className="flex items-center gap-1.5 cursor-pointer hover:text-gray-900">
            <span>Reason</span>
            <i className="ri-arrow-up-down-line text-[11px] text-gray-400" />
          </div>
        </th>
        <th className="px-4 py-3 font-semibold text-gray-600 text-center">
          Status
        </th>
        <th className="w-16 px-4 py-3 text-right"></th>
      </tr>
    </thead>
  );
});
