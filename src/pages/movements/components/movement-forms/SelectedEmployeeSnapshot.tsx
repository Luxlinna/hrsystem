import React from "react";

interface Props {
  employee: any;
  branchName?: string | null;
}

export const SelectedEmployeeSnapshot: React.FC<Props> = ({ employee, branchName }) => {
  if (!employee) {
    return (
      <p className="text-[11px] text-gray-400 mt-1.5 italic">
        Select an employee from the search box above to load their active BU, role, and current status.
      </p>
    );
  }

  const resolvedBranch = branchName || employee.branches?.name || employee.branch_name || "Main Headquarters";

  return (
    <div className="mt-2.5 p-3.5 rounded-xl border border-indigo-100 dark:border-indigo-900/50 bg-indigo-50/40 dark:bg-indigo-950/20 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {employee.avatar_url ? (
          <img
            src={employee.avatar_url}
            alt={employee.first_name}
            className="w-10 h-10 rounded-full object-cover border border-white dark:border-slate-700 shadow-xs"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-[#253C7D] text-white flex items-center justify-center font-bold text-xs shadow-xs">
            {employee.first_name?.[0]}
            {employee.last_name?.[0]}
          </div>
        )}
        <div>
          <div className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
            <span>{employee.first_name} {employee.last_name}</span>
          </div>
          <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
            {employee.role || "Staff"} &bull; {employee.department || "General"}
          </div>
          {/* Dynamic BU pill */}
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Business Unit (BU):</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#253C7D] text-white inline-flex items-center gap-1 shadow-2xs">
              <i className="ri-building-line text-[11px]" />
              {resolvedBranch}
            </span>
          </div>
        </div>
      </div>
      <div className="text-right flex flex-col items-end gap-1.5">
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-200">
          Status: {employee.status || "Active"}
        </span>
        {employee.work_locations?.name && (
          <span className="text-[10px] text-gray-400">
            Site: {employee.work_locations.name}
          </span>
        )}
      </div>
    </div>
  );
};
