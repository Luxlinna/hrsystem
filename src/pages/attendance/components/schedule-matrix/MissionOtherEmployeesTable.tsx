import { useState, memo } from "react";
import type { FullEmployee } from "./CellLeaveEmployeeCard";

interface MissionOtherEmployeesTableProps {
  allEmployees: FullEmployee[];
  mainEmployeeId: string;
  selectedOthers: FullEmployee[];
  onAddEmployee: (emp: FullEmployee) => void;
  onRemoveEmployee: (empId: string) => void;
}

export const MissionOtherEmployeesTable = memo(function MissionOtherEmployeesTable({
  allEmployees,
  mainEmployeeId,
  selectedOthers,
  onAddEmployee,
  onRemoveEmployee,
}: MissionOtherEmployeesTableProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [search, setSearch] = useState("");

  const availableEmployees = allEmployees.filter(
    (e) => e.id !== mainEmployeeId && !selectedOthers.some((s) => s.id === e.id)
  );

  const filteredEmployees = availableEmployees.filter((e) => {
    const term = search.toLowerCase();
    const fullName = `${e.first_name || ""} ${e.last_name || ""}`.toLowerCase();
    const code = (e.employee_code || e.biometric_user_id || "").toLowerCase();
    return fullName.includes(term) || code.includes(term);
  });

  return (
    <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-slate-800">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-[#0284c7] uppercase tracking-wider">
          OTHER EMPLOYEE ON MISSION
        </h3>
        <button
          type="button"
          onClick={() => setIsAdding((v) => !v)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-[#0284c7] text-[#0284c7] hover:bg-sky-50 dark:hover:bg-sky-950/40 rounded-md text-xs font-semibold cursor-pointer transition-colors shadow-2xs"
        >
          <i className="ri-add-circle-line text-sm" />
          <span>Add Employees</span>
        </button>
      </div>

      {isAdding && (
        <div className="p-3 bg-sky-50/60 dark:bg-sky-950/30 border border-sky-100 dark:border-sky-900 rounded-lg space-y-2">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <i className="ri-search-line absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search employee by name or code..."
                className="w-full pl-7 pr-3 py-1.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded text-xs focus:outline-none focus:border-sky-500"
              />
            </div>
            <button
              type="button"
              onClick={() => { setIsAdding(false); setSearch(""); }}
              className="px-2.5 py-1.5 text-xs text-gray-500 hover:text-gray-700 cursor-pointer"
            >
              Cancel
            </button>
          </div>
          <div className="max-h-40 overflow-y-auto divide-y divide-gray-100 dark:divide-slate-700 border border-gray-200 dark:border-slate-700 rounded bg-white dark:bg-slate-800">
            {filteredEmployees.length === 0 ? (
              <div className="p-3 text-center text-xs text-gray-400">No employees found.</div>
            ) : (
              filteredEmployees.slice(0, 8).map((emp) => (
                <div
                  key={emp.id}
                  onClick={() => {
                    onAddEmployee(emp);
                    setSearch("");
                  }}
                  className="flex items-center justify-between p-2 text-xs hover:bg-sky-50/80 dark:hover:bg-slate-700/60 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-800 dark:text-slate-200">
                      {emp.first_name} {emp.last_name}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      ({emp.employee_code || emp.biometric_user_id || "—"})
                    </span>
                  </div>
                  <span className="text-[11px] text-gray-500 font-medium">{emp.department || "—"}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="border border-gray-200 dark:border-slate-700 rounded-md overflow-hidden text-xs">
        <table className="w-full text-left border-collapse">
          <thead className="bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-300 font-semibold border-b border-gray-200 dark:border-slate-700">
            <tr>
              <th className="py-2.5 px-3 w-12 text-center">No.</th>
              <th className="py-2.5 px-3">Employee Code</th>
              <th className="py-2.5 px-3">Employee Name</th>
              <th className="py-2.5 px-3">Department</th>
              <th className="py-2.5 px-3">Designation</th>
              <th className="py-2.5 px-3 w-10 text-center"></th>
            </tr>
          </thead>
          <tbody>
            {selectedOthers.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="py-3 px-4 text-center bg-gray-50/80 dark:bg-slate-800/40 text-gray-500 font-medium select-none"
                >
                  Empty Allotment
                </td>
              </tr>
            ) : (
              selectedOthers.map((emp, idx) => (
                <tr
                  key={emp.id}
                  className="border-b border-gray-100 dark:border-slate-700/60 hover:bg-gray-50/60 dark:hover:bg-slate-800/60 transition-colors"
                >
                  <td className="py-2.5 px-3 text-center text-gray-400 font-semibold">{idx + 1}</td>
                  <td className="py-2.5 px-3 font-mono font-medium text-gray-700 dark:text-slate-200">
                    {emp.employee_code || emp.biometric_user_id || "—"}
                  </td>
                  <td className="py-2.5 px-3 font-bold text-gray-900 dark:text-slate-100">
                    {emp.first_name} {emp.last_name}
                  </td>
                  <td className="py-2.5 px-3 text-gray-600 dark:text-slate-300">
                    {emp.department || "—"}
                  </td>
                  <td className="py-2.5 px-3 text-gray-600 dark:text-slate-300">
                    {emp.role || "—"}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <button
                      type="button"
                      onClick={() => onRemoveEmployee(emp.id)}
                      className="text-gray-400 hover:text-rose-500 cursor-pointer transition-colors"
                      title="Remove employee"
                    >
                      <i className="ri-close-line text-sm" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
});
