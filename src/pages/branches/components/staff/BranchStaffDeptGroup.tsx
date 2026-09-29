import { memo } from "react";
import type { Employee } from "../../types";
import { deptColors } from "../../constants";
import { compareBiometricIds } from "@/lib/biometricUtils";
import { BranchStaffRow } from "./BranchStaffRow";

interface BranchStaffDeptGroupProps {
  dept: string;
  employees: Employee[];
  isExpanded: boolean;
  onToggle: () => void;
  branchName?: string;
}

export const BranchStaffDeptGroup = memo(function BranchStaffDeptGroup({
  dept,
  employees,
  isExpanded,
  onToggle,
  branchName,
}: BranchStaffDeptGroupProps) {
  const sortedEmployees = [...employees].sort((a, b) => {
    const idComp = compareBiometricIds(a.biometric_user_id, b.biometric_user_id);
    if (idComp !== 0) return idComp;
    const nameA = `${a.first_name || ""} ${a.last_name || ""}`;
    const nameB = `${b.first_name || ""} ${b.last_name || ""}`;
    return nameA.localeCompare(nameB);
  });

  return (
    <div className="border border-slate-200/90 rounded-xl overflow-hidden bg-white shadow-2xs">
      {/* Department Header */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-50/70 hover:bg-slate-100/70 transition-colors text-left cursor-pointer border-b border-slate-100 select-none"
      >
        <div className="flex items-center gap-2.5">
          <span className={`w-2.5 h-2.5 rounded-full ${deptColors[dept] || "bg-slate-400"}`} />
          <span className="text-xs font-bold text-slate-800 tracking-wide uppercase">{dept}</span>
          <span className="text-[11px] font-semibold text-slate-500 bg-white px-2 py-0.5 rounded-full border border-slate-200/80">
            {employees.length} {employees.length === 1 ? "staff" : "staff"}
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-slate-400">
          <span className="text-[11px] font-medium hidden sm:inline">
            {isExpanded ? "Collapse" : "Expand"}
          </span>
          <i
            className={`ri-arrow-down-s-line text-slate-400 text-sm transition-transform duration-200 ${
              isExpanded ? "rotate-180" : ""
            }`}
          />
        </div>
      </button>

      {/* Employee Rows */}
      {isExpanded && (
        <div className="divide-y divide-slate-100 bg-white">
          {sortedEmployees.map((emp) => (
            <BranchStaffRow key={emp.id} employee={emp} branchName={branchName} />
          ))}
        </div>
      )}
    </div>
  );
});
