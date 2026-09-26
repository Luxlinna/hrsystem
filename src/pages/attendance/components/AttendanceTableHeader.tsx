interface AttendanceTableHeaderProps {
  allSelected?: boolean;
  onToggleSelectAll?: () => void;
}

export function AttendanceTableHeader({
  allSelected = false,
  onToggleSelectAll,
}: AttendanceTableHeaderProps) {
  return (
    <thead>
      <tr className="border-b border-gray-200 dark:border-slate-800 bg-gray-50/80 dark:bg-slate-900/90 text-xs font-bold text-gray-500 dark:text-slate-400">
        <th className="py-3 px-3.5 w-10 text-center">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={onToggleSelectAll}
            className="w-4 h-4 rounded border-gray-300 dark:border-slate-700 text-[#253C7D] focus:ring-[#253C7D] cursor-pointer"
          />
        </th>
        <th className="py-3 px-3 w-12 text-left font-bold text-gray-700 dark:text-slate-200">No.</th>
        <th className="py-3 px-4 text-left font-bold text-gray-700 dark:text-slate-200 whitespace-nowrap">
          <span className="inline-flex items-center gap-1">
            Date
            <i className="ri-arrow-up-down-line text-[10px] text-gray-400" />
          </span>
        </th>
        <th className="py-3 px-4 text-left font-bold text-gray-700 dark:text-slate-200 whitespace-nowrap">
          <span className="inline-flex items-center gap-1">
            Employee
            <i className="ri-arrow-up-down-line text-[10px] text-gray-400" />
          </span>
        </th>
        <th className="py-3 px-4 text-left font-bold text-gray-700 dark:text-slate-200 whitespace-nowrap">
          <span className="inline-flex items-center gap-1">
            Designation
            <i className="ri-arrow-up-down-line text-[10px] text-gray-400" />
          </span>
        </th>
        <th className="py-3 px-4 text-left font-bold text-gray-700 dark:text-slate-200 whitespace-nowrap">
          <span className="inline-flex items-center gap-1">
            Department
            <i className="ri-arrow-up-down-line text-[10px] text-gray-400" />
          </span>
        </th>
        <th className="py-3 px-4 text-left font-bold text-gray-700 dark:text-slate-200 whitespace-nowrap">
          <span className="inline-flex items-center gap-1">
            Schedules
            <i className="ri-arrow-up-down-line text-[10px] text-gray-400" />
          </span>
        </th>
        <th className="py-3 px-4 text-left font-bold text-gray-700 dark:text-slate-200 whitespace-nowrap">
          <span className="inline-flex items-center gap-1">
            Clock In-Out
            <i className="ri-arrow-up-down-line text-[10px] text-gray-400" />
          </span>
        </th>
        <th className="py-3 px-4 text-left font-bold text-gray-700 dark:text-slate-200 whitespace-nowrap">
          Status
        </th>
        <th className="py-3 px-3 w-16 text-center font-bold text-gray-700 dark:text-slate-200"></th>
      </tr>
    </thead>
  );
}
