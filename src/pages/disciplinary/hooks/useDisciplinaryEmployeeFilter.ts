import { useMemo } from "react";
import type { Employee, NewRecord, Branch } from "../types";

interface UseDisciplinaryEmployeeFilterParams {
  employees: Employee[];
  branches: Branch[];
  newRecord: NewRecord;
  activeBranchName?: string;
}

export function useDisciplinaryEmployeeFilter({
  employees,
  branches,
  newRecord,
  activeBranchName,
}: UseDisciplinaryEmployeeFilterParams) {
  const selectedBranchName = branches.find((b) => b.id === newRecord.branch_id)?.name;

  const { availableEmployees, branchHasZeroStaff } = useMemo(() => {
    if (newRecord.is_admin_scope) {
      return { availableEmployees: employees, branchHasZeroStaff: false };
    }

    const targetBranchId =
      newRecord.branch_id ||
      branches.find((b) => b.name?.trim().toLowerCase() === activeBranchName?.trim().toLowerCase())?.id ||
      "";

    if (!targetBranchId) {
      return { availableEmployees: employees, branchHasZeroStaff: false };
    }

    const branchSpecific = employees.filter((e) => e.branch_id === targetBranchId);
    if (branchSpecific.length > 0) {
      return { availableEmployees: branchSpecific, branchHasZeroStaff: false };
    }
    return { availableEmployees: employees, branchHasZeroStaff: true };
  }, [employees, newRecord.is_admin_scope, newRecord.branch_id, activeBranchName, branches]);

  const searchableEmployees = useMemo(() => {
    return availableEmployees.map((e) => {
      const bName = (e as any).branches?.name || branches.find((b) => b.id === e.branch_id)?.name || null;
      return {
        id: e.id,
        first_name: e.first_name,
        last_name: e.last_name,
        employee_id: e.employee_id,
        department: e.department,
        role: e.role,
        avatar_url: e.avatar_url,
        branch_id: e.branch_id,
        branch_name: bName,
      };
    });
  }, [availableEmployees, branches]);

  return {
    searchableEmployees,
    branchHasZeroStaff,
    selectedBranchName,
  };
}
