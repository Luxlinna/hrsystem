import { memo } from "react";
import type { EmployeeRosterRow } from "./types";

interface ScheduleMatrixNoSchedulesProps {
  unscheduledEmployees?: EmployeeRosterRow[];
  onNavigateToTemplates?: () => void;
}

export const ScheduleMatrixNoSchedules = memo(function ScheduleMatrixNoSchedules({
  unscheduledEmployees = [],
  onNavigateToTemplates,
}: ScheduleMatrixNoSchedulesProps) {
  if (unscheduledEmployees.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-8 text-center shadow-xs">
        <div className="max-w-md mx-auto space-y-3">
          <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto text-xl">
            <i className="ri-checkbox-circle-line" />
          </div>
          <h3 className="text-base font-bold text-gray-900">All Employees Have Scheduled Rosters</h3>
          <p className="text-xs text-gray-500">
            Every active employee is currently assigned to a weekly schedule template.
          </p>
          <button
            type="button"
            onClick={onNavigateToTemplates}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#2563EB] hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer"
          >
            <i className="ri-layout-grid-line" />
            Manage Schedule Templates
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-xs overflow-hidden">
      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-gray-900">
            Unscheduled Staff ({unscheduledEmployees.length})
          </h3>
          <p className="text-xs text-gray-500">
            These employees are not yet assigned to any schedule template.
          </p>
        </div>
        <button
          type="button"
          onClick={onNavigateToTemplates}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#2563EB] hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer"
        >
          <i className="ri-layout-grid-line" />
          Manage Schedule Templates
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-gray-50/80 text-gray-500 font-bold border-b border-gray-200">
              <th className="py-2.5 px-4 w-12 text-center">No.</th>
              <th className="py-2.5 px-4">Employee</th>
              <th className="py-2.5 px-4">Position</th>
              <th className="py-2.5 px-4">Department</th>
              <th className="py-2.5 px-4 text-center">Status</th>
              <th className="py-2.5 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {unscheduledEmployees.map((emp, idx) => (
              <tr key={emp.id} className="hover:bg-gray-50/80 transition-colors">
                <td className="py-2.5 px-4 text-center text-gray-400 font-mono">{idx + 1}</td>
                <td className="py-2.5 px-4">
                  <div className="flex items-center gap-2.5">
                    {emp.avatarUrl ? (
                      <img
                        src={emp.avatarUrl}
                        alt={emp.name}
                        className="w-7 h-7 rounded-full object-cover border border-gray-200"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 font-bold text-[10px] flex items-center justify-center">
                        {emp.name.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div className="font-semibold text-gray-900">{emp.name}</div>
                      {emp.displayId ? (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9.5px] font-mono font-bold bg-[#253C7D]/10 text-[#253C7D] border border-[#253C7D]/20 shrink-0 mt-0.5">
                          <i className="ri-fingerprint-line text-[10px]" />
                          <span>{emp.displayId}</span>
                        </span>
                      ) : (
                        <div className="text-[10px] text-gray-400 font-mono">{emp.employeeCode}</div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="py-2.5 px-4 font-medium text-gray-700">{emp.role}</td>
                <td className="py-2.5 px-4 text-gray-500">{emp.department}</td>
                <td className="py-2.5 px-4 text-center">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-600">
                    No Template
                  </span>
                </td>
                <td className="py-2.5 px-4 text-right">
                  <button
                    type="button"
                    onClick={onNavigateToTemplates}
                    className="text-xs text-blue-600 hover:text-blue-800 font-bold hover:underline cursor-pointer"
                  >
                    Assign Template &rarr;
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
});
