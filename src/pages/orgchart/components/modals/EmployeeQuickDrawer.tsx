import { memo } from "react";
import { Link } from "react-router-dom";
import type { Employee } from "../../types";
import { DEPT_COLORS } from "../../constants";

interface EmployeeQuickDrawerProps {
  selectedEmployee: Employee | null;
  canEditManager: boolean;
  onClose: () => void;
  onOpenEditManager: (emp: Employee) => void;
  getManager: (managerId: string | null) => Employee | undefined;
  getDirectReports: (id: string) => Employee[];
}

export const EmployeeQuickDrawer = memo(function EmployeeQuickDrawer({
  selectedEmployee,
  canEditManager,
  onClose,
  onOpenEditManager,
  getManager,
  getDirectReports,
}: EmployeeQuickDrawerProps) {
  if (!selectedEmployee) return null;

  const deptColor = DEPT_COLORS[selectedEmployee.department] || "bg-gray-400";
  const manager = getManager(selectedEmployee.reports_to);
  const reportsCount = getDirectReports(selectedEmployee.id).length;

  return (
    <div className="fixed bottom-6 right-6 bg-white rounded-2xl border border-gray-200 p-5 w-72 z-40 shadow-xl animate-in slide-in-from-bottom-5 duration-150">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {selectedEmployee.avatar_url ? (
            <img
              src={selectedEmployee.avatar_url}
              alt=""
              className="w-10 h-10 rounded-full object-cover shrink-0"
            />
          ) : (
            <div className={`w-10 h-10 rounded-full ${deptColor} flex items-center justify-center text-white font-bold shrink-0`}>
              {selectedEmployee.first_name?.[0]}
              {selectedEmployee.last_name?.[0]}
            </div>
          )}
          <div>
            <p className="text-[13px] font-bold text-gray-900">
              {selectedEmployee.first_name} {selectedEmployee.last_name}
            </p>
            <p className="text-[11px] text-gray-500">{selectedEmployee.role}</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100 cursor-pointer"
        >
          <i className="ri-close-line text-gray-400 text-sm" />
        </button>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex justify-between">
          <span className="text-[11px] text-gray-400">Department</span>
          <span className="text-[11px] font-semibold text-gray-700">
            {selectedEmployee.department}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-[11px] text-gray-400">Direct Reports</span>
          <span className="text-[11px] font-semibold text-[#253C7D]">
            {reportsCount}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-[11px] text-gray-400">Reports To</span>
          <span className="text-[11px] font-semibold text-gray-700">
            {manager ? `${manager.first_name} ${manager.last_name}` : "No manager"}
          </span>
        </div>
      </div>

      <div className="flex gap-2">
        <Link
          to={`/employees/${selectedEmployee.id}`}
          className="flex-1 py-2 text-center text-[11px] font-semibold text-[#253C7D] border border-[#253C7D]/20 rounded-lg hover:bg-[#253C7D]/5 transition-colors whitespace-nowrap"
        >
          View Profile
        </Link>
        {canEditManager && (
          <button
            onClick={() => onOpenEditManager(selectedEmployee)}
            className="flex-1 py-2 text-[11px] font-semibold text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap cursor-pointer"
          >
            Edit Manager
          </button>
        )}
      </div>
    </div>
  );
});
