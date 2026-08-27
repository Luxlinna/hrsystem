import { memo, useState, useMemo } from "react";
import type { Tool, Employee, ToolAssignment } from "../../types";
import { initials } from "../../toolsUtils";

interface ToolsAccessMatrixViewProps {
  tools: Tool[];
  employees: Employee[];
  assignments: ToolAssignment[];
  departments: string[];
  canManage: boolean;
  onRevokeAccess: (assignmentId: number, empName: string, toolName: string) => void;
  onOpenAssign: (t: Tool) => void;
}

export const ToolsAccessMatrixView = memo(function ToolsAccessMatrixView({
  tools,
  employees,
  assignments,
  departments,
  canManage,
  onRevokeAccess,
  onOpenAssign,
}: ToolsAccessMatrixViewProps) {
  const [deptFilter, setDeptFilter] = useState("All");
  const [search, setSearch] = useState("");

  const filteredEmployees = useMemo(() => {
    return employees.filter((e) => {
      if (deptFilter !== "All" && e.department !== deptFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const fullName = `${e.first_name} ${e.last_name}`.toLowerCase();
        const dept = (e.department || "").toLowerCase();
        const role = (e.role || "").toLowerCase();
        return fullName.includes(q) || dept.includes(q) || role.includes(q);
      }
      return true;
    });
  }, [employees, deptFilter, search]);

  const assignmentMap = useMemo(() => {
    const map = new Map<string, ToolAssignment>();
    assignments.forEach((a) => {
      map.set(`${a.employee_id}_${a.tool_id}`, a);
    });
    return map;
  }, [assignments]);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-2xs space-y-4">
      {/* Matrix Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
        <div className="relative flex-1 max-w-sm">
          <i className="ri-search-line absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter staff by name or role..."
            className="w-full pl-9 pr-8 py-1.5 bg-gray-50/80 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#253C7D]"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="px-3 py-1.5 bg-gray-50/80 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:outline-none cursor-pointer"
          >
            {departments.map((d) => (
              <option key={d} value={d}>
                {d === "All" ? "All Departments" : d}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Access Matrix Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-gray-50/80 border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider text-[10px]">
              <th className="px-4 py-3 sticky left-0 bg-gray-50/90 z-10">Employee</th>
              {tools.map((t) => (
                <th key={t.id} className="px-3 py-3 text-center whitespace-nowrap min-w-[100px]">
                  <div className="flex flex-col items-center">
                    <span className="font-bold text-gray-700">{t.name}</span>
                    <span className="text-[9px] text-gray-400 font-normal">{t.category}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filteredEmployees.map((emp) => {
              const empName = `${emp.first_name} ${emp.last_name}`;
              return (
                <tr key={emp.id} className="hover:bg-slate-50/80 transition-colors">
                  {/* Sticky employee column */}
                  <td className="px-4 py-3 sticky left-0 bg-white z-10 whitespace-nowrap shadow-xs">
                    <div className="flex items-center gap-2.5">
                      {emp.avatar_url ? (
                        <img
                          src={emp.avatar_url}
                          alt={empName}
                          className="w-6 h-6 rounded-full object-cover ring-1 ring-gray-200"
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-[#253C7D] text-white text-[9px] font-bold flex items-center justify-center">
                          {initials(emp.first_name, emp.last_name)}
                        </div>
                      )}
                      <div>
                        <p className="font-bold text-gray-900">{empName}</p>
                        <p className="text-[10px] text-gray-400">
                          {emp.department || "No Dept"} &middot; {emp.role || "Staff"}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Tool columns */}
                  {tools.map((t) => {
                    const assignment = assignmentMap.get(`${emp.id}_${t.id}`);
                    const hasAccess = Boolean(assignment);

                    return (
                      <td key={t.id} className="px-3 py-3 text-center whitespace-nowrap">
                        {hasAccess ? (
                          <div className="inline-flex items-center gap-1">
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-xs">
                              <i className="ri-check-line font-bold" />
                            </span>
                            {canManage && assignment && (
                              <button
                                onClick={() => onRevokeAccess(assignment.id, empName, t.name)}
                                title={`Revoke access to ${t.name}`}
                                className="w-5 h-5 rounded-full hover:bg-rose-100 text-gray-400 hover:text-rose-600 flex items-center justify-center cursor-pointer transition-colors"
                              >
                                <i className="ri-close-line text-xs" />
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-300 font-mono text-sm">&mdash;</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
});
