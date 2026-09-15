import React from "react";

interface Props {
  employee: any;
}

export const SelectedEmployeeSnapshot: React.FC<Props> = ({ employee }) => {
  if (!employee) {
    return (
      <p className="text-[11px] text-gray-400 mt-1 italic">
        Select an employee from the dropdown above to auto-fill current baseline details.
      </p>
    );
  }

  return (
    <div className="mt-2.5 p-3 rounded-xl border border-indigo-100 dark:border-indigo-900/50 bg-indigo-50/40 dark:bg-indigo-950/20 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {employee.avatar_url ? (
          <img
            src={employee.avatar_url}
            alt={employee.first_name}
            className="w-10 h-10 rounded-full object-cover border border-white dark:border-slate-700 shadow-xs"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-[#253C7D] text-white flex items-center justify-center font-bold text-xs">
            {employee.first_name?.[0]}
            {employee.last_name?.[0]}
          </div>
        )}
        <div>
          <div className="text-xs font-bold text-gray-900 dark:text-white">
            {employee.first_name} {employee.last_name}
          </div>
          <div className="text-[11px] text-gray-500 dark:text-gray-400">
            {employee.role || "Staff"} &bull; {employee.department || "General"}
          </div>
          <div className="text-[10px] text-indigo-700 dark:text-indigo-400 mt-0.5">
            Branch: <strong>{employee.branches?.name || "Main HQ"}</strong>
          </div>
        </div>
      </div>
      <div className="text-right">
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-200">
          Status: {employee.status || "Active"}
        </span>
      </div>
    </div>
  );
};
