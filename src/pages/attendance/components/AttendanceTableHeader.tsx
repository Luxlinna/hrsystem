interface AttendanceTableHeaderProps {
  isFourPunchMode: boolean;
}

export function AttendanceTableHeader({ isFourPunchMode }: AttendanceTableHeaderProps) {
  return (
    <thead>
      <tr className="border-b border-gray-100 dark:border-slate-800 bg-gray-50/70 dark:bg-slate-900/90 text-[11px] font-bold text-gray-400 dark:text-slate-400 uppercase tracking-wider">
        <th className="px-5 py-3.5 whitespace-nowrap">Employee</th>
        <th className="px-5 py-3.5 whitespace-nowrap">Department</th>
        <th className="px-5 py-3.5 whitespace-nowrap">Date</th>

        {isFourPunchMode ? (
          <>
            <th className="px-4 py-3.5 text-center whitespace-nowrap">
              <div className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-400">
                <i className="ri-sun-line text-xs" />
                <span>Morning In</span>
              </div>
            </th>
            <th className="px-4 py-3.5 text-center whitespace-nowrap">
              <div className="inline-flex items-center gap-1 text-orange-700 dark:text-orange-400">
                <i className="ri-restaurant-line text-xs" />
                <span>Lunch Out</span>
              </div>
            </th>
            <th className="px-4 py-3.5 text-center whitespace-nowrap">
              <div className="inline-flex items-center gap-1 text-indigo-700 dark:text-indigo-400">
                <i className="ri-cup-line text-xs" />
                <span>Lunch In</span>
              </div>
            </th>
            <th className="px-4 py-3.5 text-center whitespace-nowrap">
              <div className="inline-flex items-center gap-1 text-blue-700 dark:text-blue-400">
                <i className="ri-moon-line text-xs" />
                <span>Evening Out</span>
              </div>
            </th>
          </>
        ) : (
          <>
            <th className="px-5 py-3.5 whitespace-nowrap">Check In</th>
            <th className="px-5 py-3.5 whitespace-nowrap">Check Out</th>
          </>
        )}

        <th className="px-4 py-3.5 text-center whitespace-nowrap">Total Hours</th>
        <th className="px-4 py-3.5 text-center whitespace-nowrap">Status</th>
        <th className="px-4 py-3.5 whitespace-nowrap">Notes</th>
        <th className="px-4 py-3.5 text-right whitespace-nowrap">Actions</th>
      </tr>
    </thead>
  );
}
