import React from "react";
import EmployeeSearchSelect, { type SearchableEmployee } from "@/components/EmployeeSearchSelect";
import { SelectedEmployeeSnapshot } from "./movement-forms";

interface BranchOption {
  id: string;
  name: string;
}

interface MovementModalEmployeeStepProps {
  modalBranchId: string;
  setModalBranchId: (id: string) => void;
  branches: BranchOption[];
  employees: any[];
  searchableEmployees: SearchableEmployee[];
  selectedEmployeeId: string;
  onSelectEmployee: (id: string) => void;
  selectedEmployee: any | null;
  selectedEmployeeBranchName: string | null;
}

export function MovementModalEmployeeStep({
  modalBranchId,
  setModalBranchId,
  branches,
  employees,
  searchableEmployees,
  selectedEmployeeId,
  onSelectEmployee,
  selectedEmployee,
  selectedEmployeeBranchName,
}: MovementModalEmployeeStepProps) {
  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">
          1. Search Employee Name or ID <span className="text-rose-500">*</span>
        </label>
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400">BU Scope:</span>
          <select
            value={modalBranchId}
            onChange={(e) => {
              setModalBranchId(e.target.value);
              onSelectEmployee("");
            }}
            className="px-2 py-0.5 text-xs font-bold rounded-md border border-indigo-200 dark:border-indigo-800 bg-indigo-50/60 dark:bg-indigo-950/40 text-[#253C7D] dark:text-indigo-300 focus:outline-none focus:ring-1 focus:ring-[#253C7D]"
          >
            <option value="all">All BUs ({employees.length} staff)</option>
            {branches.map((b) => {
              const count = employees.filter((e) => e.branch_id === b.id).length;
              return (
                <option key={b.id} value={b.id}>
                  {b.name} ({count} staff)
                </option>
              );
            })}
          </select>
        </div>
      </div>

      <EmployeeSearchSelect
        employees={searchableEmployees}
        value={selectedEmployeeId}
        onChange={onSelectEmployee}
        placeholder={
          modalBranchId !== "all"
            ? `Search ${branches.find((b) => b.id === modalBranchId)?.name || "BU"} staff...`
            : "Type staff name, ID, department, or role..."
        }
      />
      <SelectedEmployeeSnapshot
        employee={selectedEmployee}
        branchName={selectedEmployeeBranchName}
      />
    </div>
  );
}
