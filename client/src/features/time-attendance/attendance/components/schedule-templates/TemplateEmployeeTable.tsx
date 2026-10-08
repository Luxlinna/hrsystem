import { useState, useMemo, memo } from "react";
import type { Employee } from "../../types";
import { useBranchScope } from "@/context/BranchContext";

interface Props {
  assignedEmployees: Employee[];
  selectedInTable: string[];
  setSelectedInTable: React.Dispatch<React.SetStateAction<string[]>>;
  onRemoveSelected: () => void;
  onRemoveSingle?: (empId: string) => void;
  onOpenAddModal: () => void;
  allDepts: string[];
  siteName: string;
}

export const TemplateEmployeeTable = memo(function TemplateEmployeeTable({
  assignedEmployees,
  selectedInTable,
  setSelectedInTable,
  onRemoveSelected,
  onRemoveSingle,
  onOpenAddModal,
  allDepts,
  siteName,
}: Props) {
  const { visibleBranches } = useBranchScope();
  const [empSearch, setEmpSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");

  const filteredAssigned = useMemo(() => {
    const q = empSearch.toLowerCase();
    return assignedEmployees.filter((e) => {
      const empName = (e.display_name || e.full_name || `${e.first_name} ${e.last_name}`).toLowerCase();
      const match = !q || empName.includes(q) || `${e.first_name} ${e.last_name}`.toLowerCase().includes(q) ||
        (e.employee_code || e.biometric_user_id || "").toLowerCase().includes(q);
      return match && (deptFilter === "all" || e.department?.toLowerCase() === deptFilter.toLowerCase());
    });
  }, [assignedEmployees, empSearch, deptFilter]);

  const allSelected = filteredAssigned.length > 0 && filteredAssigned.every((e) => selectedInTable.includes(e.id));

  const toggleSelectAll = (checked: boolean) => {
    if (checked) setSelectedInTable((p) => Array.from(new Set([...p, ...filteredAssigned.map((i) => i.id)])));
    else setSelectedInTable((p) => p.filter((id) => !filteredAssigned.some((f) => f.id === id)));
  };

  const getBUName = (emp: Employee) => {
    if (emp.default_work_location_id) {
      const site = visibleBranches.find((b) => b.is_site && (b.id === `site:${emp.default_work_location_id}` || b.id === emp.default_work_location_id));
      if (site?.name) return `${site.name} (Site)`;
    }
    if (emp.branches?.name) return emp.branches.name;
    if (emp.branch_id) {
      const b = visibleBranches.find((br) => !br.is_site && br.id === emp.branch_id);
      if (b?.name) return b.name;
    }
    return siteName && siteName !== "All" ? siteName : "—";
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-gray-200/80 dark:border-slate-800 shadow-2xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100 dark:border-slate-800">
        <h3 className="text-xs font-bold text-gray-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
          <i className="ri-team-line text-base text-[#253C7D] dark:text-sky-400" />
          Employee on Schedule ({assignedEmployees.length})
        </h3>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onRemoveSelected}
            disabled={selectedInTable.length === 0}
            className="px-3.5 py-1.5 border border-rose-300 dark:border-rose-800/80 text-rose-600 dark:text-rose-400 hover:bg-rose-50 text-xs font-bold rounded-xl cursor-pointer disabled:opacity-40"
          >
            Remove Employee {selectedInTable.length > 0 ? `(${selectedInTable.length})` : ""}
          </button>
          <button
            type="button"
            onClick={onOpenAddModal}
            className="px-3.5 py-1.5 border border-[#253C7D] dark:border-sky-500 text-[#253C7D] dark:text-sky-400 hover:bg-[#253C7D]/10 text-xs font-bold rounded-xl cursor-pointer"
          >
            Add Employees
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center w-full sm:max-w-xs">
          <input
            type="text"
            placeholder="Search..."
            value={empSearch}
            onChange={(e) => setEmpSearch(e.target.value)}
            className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-l-xl focus:bg-white focus:outline-none focus:border-[#253C7D] text-gray-800 dark:text-slate-100"
          />
          <span className="px-3 py-1.5 bg-[#253C7D] text-white rounded-r-xl flex items-center justify-center">
            <i className="ri-search-line text-xs" />
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 font-semibold">Filter:</span>
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="px-3 py-1.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-gray-700 dark:text-slate-200"
          >
            <option value="all">All Departments</option>
            {allDepts.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
      </div>

      <div className="overflow-x-auto border border-gray-200/80 dark:border-slate-800 rounded-xl">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-gray-50/80 dark:bg-slate-800/60 text-gray-500 dark:text-slate-400 font-bold border-b border-gray-200/80 dark:border-slate-800">
              <th className="py-2.5 px-3 w-10 text-center">
                <input type="checkbox" checked={allSelected} onChange={(e) => toggleSelectAll(e.target.checked)} className="rounded border-gray-300 text-[#253C7D] cursor-pointer" />
              </th>
              <th className="py-2.5 px-3 w-12 text-center">No.</th>
              <th className="py-2.5 px-3">Employee Code</th>
              <th className="py-2.5 px-3">Employee Name</th>
              <th className="py-2.5 px-3">Department</th>
              <th className="py-2.5 px-3">Designation</th>
              <th className="py-2.5 px-3">Site / BU</th>
              <th className="py-2.5 px-3 w-16 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
            {filteredAssigned.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-10 text-center text-gray-400">
                  <i className="ri-user-add-line text-2xl mb-1 block" />
                  No employees assigned to this schedule template yet. Click &quot;Add Employees&quot; to assign staff.
                </td>
              </tr>
            ) : (
              filteredAssigned.map((emp, idx) => (
                <tr key={emp.id} className={`hover:bg-gray-50/60 dark:hover:bg-slate-800/40 transition-colors ${selectedInTable.includes(emp.id) ? "bg-indigo-50/40 dark:bg-indigo-950/20" : ""}`}>
                  <td className="py-3 px-3 text-center">
                    <input
                      type="checkbox"
                      checked={selectedInTable.includes(emp.id)}
                      onChange={(e) => setSelectedInTable((p) => e.target.checked ? [...p, emp.id] : p.filter((x) => x !== emp.id))}
                      className="rounded border-gray-300 text-[#253C7D] cursor-pointer"
                    />
                  </td>
                  <td className="py-3 px-3 text-center font-bold text-gray-400">{idx + 1}</td>
                  <td className="py-3 px-3 font-mono font-bold text-gray-700 dark:text-slate-300">
                    {emp.employee_code || (emp.biometric_user_id ? `#${emp.biometric_user_id}` : "—")}
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-[#253C7D] text-white flex items-center justify-center font-bold text-[10px] shrink-0 overflow-hidden">
                        {emp.avatar_url ? (
                          <img src={emp.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span>{(emp.display_name || emp.full_name || emp.first_name || "E")[0].toUpperCase()}</span>
                        )}
                      </div>
                      <span className="font-bold text-gray-900 dark:text-slate-100">
                        {emp.display_name?.trim() || emp.full_name?.trim() || `${emp.first_name} ${emp.last_name}`}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-3 text-gray-600 dark:text-slate-300">{emp.department || "General"}</td>
                  <td className="py-3 px-3 text-gray-600 dark:text-slate-300">{emp.role || "Staff"}</td>
                  <td className="py-3 px-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/50">
                      {getBUName(emp)}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <button
                      type="button"
                      title="Remove from this schedule template"
                      onClick={() => onRemoveSingle?.(emp.id)}
                      className="p-1.5 text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                    >
                      <i className="ri-delete-bin-line text-sm" />
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
