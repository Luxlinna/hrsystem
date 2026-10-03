import type { Employee } from "../types";
import EmployeeSearchSelect from "@/components/EmployeeSearchSelect";

interface DisciplinaryEmployeeSectionProps {
  searchableEmployees: any[];
  employeeId: string;
  selectedEmp?: Employee;
  branchHasZeroStaff: boolean;
  selectedBranchName?: string;
  onSelectEmployeeId: (id: string) => void;
}

export function DisciplinaryEmployeeSection({
  searchableEmployees,
  employeeId,
  selectedEmp,
  branchHasZeroStaff,
  selectedBranchName,
  onSelectEmployeeId,
}: DisciplinaryEmployeeSectionProps) {
  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <label className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider block">
          Select Employee (Search Name or ID) <span className="text-rose-500">*</span>
        </label>
        <span className="text-[10px] font-semibold text-gray-400">
          {searchableEmployees.length} available
        </span>
      </div>

      <EmployeeSearchSelect
        employees={searchableEmployees}
        value={employeeId}
        onChange={onSelectEmployeeId}
        placeholder="Type employee name or ID..."
      />

      {branchHasZeroStaff && (
        <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1 font-medium">
          <i className="ri-information-line" />
          <span>{selectedBranchName || "Selected branch"} currently has no assigned staff. Showing all employees.</span>
        </p>
      )}

      {selectedEmp && (
        <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/70 dark:border-slate-700 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[#253C7D]/10 text-[#253C7D] font-bold flex items-center justify-center shrink-0">
              {selectedEmp.avatar_url ? (
                <img src={selectedEmp.avatar_url} alt="" className="w-8 h-8 rounded-lg object-cover" />
              ) : (
                <span>{selectedEmp.first_name[0]}{selectedEmp.last_name[0]}</span>
              )}
            </div>
            <div className="min-w-0">
              <div className="font-bold text-gray-900 dark:text-white truncate">
                {selectedEmp.first_name} {selectedEmp.last_name}
              </div>
              <div className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                {selectedEmp.role} &bull; {selectedEmp.department}
              </div>
            </div>
          </div>
          {selectedEmp.employee_id && (
            <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-gray-700 dark:text-gray-300 shrink-0">
              ID: {selectedEmp.employee_id}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
