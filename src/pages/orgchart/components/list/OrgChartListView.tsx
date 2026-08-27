import { memo } from "react";
import { Link } from "react-router-dom";
import type { Employee } from "../../types";
import { DEPT_COLORS } from "../../constants";

interface OrgChartListViewProps {
  employees: Employee[];
  canEditManager: boolean;
  onOpenEditManager: (emp: Employee) => void;
  getManager: (managerId: string | null) => Employee | undefined;
  getDirectReports: (id: string) => Employee[];
}

export const OrgChartListView = memo(function OrgChartListView({
  employees,
  canEditManager,
  onOpenEditManager,
  getManager,
  getDirectReports,
}: OrgChartListViewProps) {
  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden shadow-2xs">
      <table className="w-full text-left">
        <thead>
          <tr className="bg-gray-50">
            <th className="px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Employee</th>
            <th className="px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Department</th>
            <th className="px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Reports To</th>
            <th className="px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Direct Reports</th>
            <th className="px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Status</th>
            <th className="px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {employees.map((emp) => {
            const manager = getManager(emp.reports_to);
            const reports = getDirectReports(emp.id);
            const deptColor = DEPT_COLORS[emp.department] || "bg-gray-400";

            return (
              <tr key={emp.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    {emp.avatar_url ? (
                      <img src={emp.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
                    ) : (
                      <div className={`w-8 h-8 rounded-full ${deptColor} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                        {emp.first_name?.[0]}{emp.last_name?.[0]}
                      </div>
                    )}
                    <div>
                      <Link to={`/employees/${emp.id}`} className="text-[13px] font-semibold text-gray-900 hover:text-[#253C7D] transition-colors">
                        {emp.first_name} {emp.last_name}
                      </Link>
                      <p className="text-[11px] text-gray-500">{emp.role}</p>
                    </div>
                  </div>
                </td>

                <td className="px-5 py-3">
                  <span className={`text-[10px] font-semibold px-2 py-1 rounded-full text-white ${deptColor}`}>
                    {emp.department}
                  </span>
                </td>

                <td className="px-5 py-3 text-[13px] text-gray-600">
                  {manager ? (
                    <Link to={`/employees/${manager.id}`} className="hover:text-[#253C7D] transition-colors">
                      {manager.first_name} {manager.last_name}
                    </Link>
                  ) : (
                    <span className="text-gray-400">— Top level</span>
                  )}
                </td>

                <td className="px-5 py-3 text-[13px] text-gray-600">
                  {reports.length > 0 ? (
                    <span className="text-[#253C7D] font-semibold">
                      {reports.length} person{reports.length > 1 ? "s" : ""}
                    </span>
                  ) : (
                    <span className="text-gray-400">None</span>
                  )}
                </td>

                <td className="px-5 py-3">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${emp.status === "active" ? "bg-green-500" : "bg-amber-500"}`} />
                    <span className="text-[12px] text-gray-600 capitalize">{emp.status}</span>
                  </div>
                </td>

                <td className="px-5 py-3">
                  {canEditManager ? (
                    <button
                      onClick={() => onOpenEditManager(emp)}
                      className="px-2.5 py-1.5 text-[11px] font-semibold text-[#253C7D] border border-[#253C7D]/20 rounded-lg hover:bg-[#253C7D]/5 transition-colors whitespace-nowrap cursor-pointer"
                    >
                      Edit Manager
                    </button>
                  ) : (
                    <span className="text-[11px] text-gray-300">—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
});
