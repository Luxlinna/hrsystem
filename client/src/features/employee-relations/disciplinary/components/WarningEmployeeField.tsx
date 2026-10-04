import { memo, useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import type { Employee, NewRecord } from "../types";

interface WarningEmployeeFieldProps {
  employees: Employee[];
  newRecord: NewRecord;
  handleFieldChange: (field: keyof NewRecord, value: any) => void;
  activeBranchId?: string | null;
}

export const WarningEmployeeField = memo(function WarningEmployeeField({
  employees,
  newRecord,
  handleFieldChange,
  activeBranchId,
}: WarningEmployeeFieldProps) {
  const [buEmployees, setBuEmployees] = useState<Employee[]>([]);
  const targetBuId = newRecord.branch_id || activeBranchId;

  useEffect(() => {
    if (!targetBuId || targetBuId === "all") return;
    let cancelled = false;

    supabase
      .from("employees")
      .select("id, first_name, last_name, department, role, avatar_url, branch_id, biometric_user_id, status, branches(id, name)")
      .is("deleted_at", null)
      .eq("branch_id", targetBuId)
      .order("first_name")
      .then(({ data, error }) => {
        if (cancelled || error || !data) return;
        const list: Employee[] = data.map((e: any) => ({
          id: e.id,
          first_name: e.first_name,
          last_name: e.last_name,
          department: e.department || "General",
          role: e.role || "Staff",
          avatar_url: e.avatar_url,
          branch_id: e.branch_id,
          employee_id: e.biometric_user_id || e.id.substring(0, 8).toUpperCase(),
          branches: Array.isArray(e.branches) ? e.branches[0] : e.branches,
        }));

        list.sort((a, b) => {
          const idA = a.employee_id || "";
          const idB = b.employee_id || "";
          if (idA && idB && !isNaN(Number(idA)) && !isNaN(Number(idB))) {
            return Number(idA) - Number(idB);
          }
          return (a.first_name || "").localeCompare(b.first_name || "");
        });

        setBuEmployees(list);
      });

    return () => {
      cancelled = true;
    };
  }, [targetBuId]);

  const displayEmployees = useMemo(() => {
    if (buEmployees.length > 0) return buEmployees;
    if (targetBuId && targetBuId !== "all") {
      return employees.filter((e) => e.branch_id === targetBuId);
    }
    return employees;
  }, [buEmployees, employees, targetBuId]);

  return (
    <div className="space-y-4">
      <div className="text-sm font-bold text-[#0284c7] uppercase">
        EMPLOYEE INFO
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
        <label className="sm:w-52 text-xs font-semibold text-slate-700 sm:text-right">
          Employee <span className="text-rose-500">*</span>
        </label>
        <div className="w-full sm:w-[350px] relative">
          <select
            required
            value={newRecord.employee_id}
            onChange={(e) => handleFieldChange("employee_id", e.target.value)}
            className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-800 focus:outline-none focus:border-sky-500 appearance-none pr-8 cursor-pointer"
          >
            <option value="">Search...</option>
            {displayEmployees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.first_name} {emp.last_name} {emp.employee_id ? `(${emp.employee_id})` : ""} - {emp.role || emp.department}
              </option>
            ))}
          </select>
          <i className="ri-arrow-down-s-line absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none" />
        </div>
      </div>
    </div>
  );
});
