import { useMemo } from "react";
import type { AppRole, DirectoryEmployee } from "../types";
import { isPhoneSyntheticEmail } from "@/lib/phoneUtils";

export interface BranchOption {
  id: string;
  name: string;
  is_site?: boolean;
  branch_id?: string;
}

interface UseAddUserFormDataParams {
  employees: DirectoryEmployee[];
  accountType: "email" | "phone";
  branches?: BranchOption[];
  filterBranch?: string;
  roles: AppRole[];
  selectedEmployeeEmail: string;
  newUserEmployeeId?: string;
}

export function useAddUserFormData({
  employees = [],
  accountType,
  branches = [],
  filterBranch = "all",
  roles = [],
  selectedEmployeeEmail,
  newUserEmployeeId,
}: UseAddUserFormDataParams) {
  // 1. Filter employees for directory autofill
  const filteredEmployeesForAutofill = useMemo(() => {
    let list = employees || [];

    if (accountType === "phone") {
      list = list.filter((emp) => {
        if (!emp.phone || typeof emp.phone !== "string") return false;
        const cleanDigits = emp.phone.replace(/\D/g, "");
        if (cleanDigits.length < 6) return false;
        if (cleanDigits === "0987654321" || cleanDigits === "987654321" || cleanDigits === "123456789") return false;
        return true;
      });
    } else {
      list = list.filter((emp) => {
        if (!emp.email || typeof emp.email !== "string") return false;
        const clean = emp.email.trim().toLowerCase();
        return clean.includes("@") && !isPhoneSyntheticEmail(clean);
      });
    }

    if (branches && branches.length > 0) {
      if (filterBranch && filterBranch.startsWith("site:")) {
        const targetSiteId = filterBranch.substring(5);
        list = list.filter((emp) => emp.default_work_location_id === targetSiteId);
      } else if (filterBranch && filterBranch !== "all") {
        const targetBranch = branches.find((b) => b.id === filterBranch && !b.is_site);
        const targetName = (targetBranch?.name || "").toLowerCase().trim();

        list = list.filter((emp) => {
          const empBranchName = (emp.branch_name || "").toLowerCase().trim();
          const isDirect = emp.branch_id === filterBranch;
          const isNameMatch = Boolean(targetName && empBranchName && empBranchName === targetName);
          const isSiteMatch = Boolean(
            emp.default_work_location_id &&
            branches.some(
              (b) =>
                b.is_site &&
                b.branch_id === filterBranch &&
                b.id === `site:${emp.default_work_location_id}`
            )
          );
          return isDirect || isNameMatch || isSiteMatch;
        });
      } else {
        const pureBranches = branches.filter((b) => !b.is_site);
        if (pureBranches.length === 1) {
          const parentBranch = pureBranches[0];
          const parentName = (parentBranch.name || "").toLowerCase().trim();
          list = list.filter((emp) => {
            const empBranchName = (emp.branch_name || "").toLowerCase().trim();
            const isDirect = emp.branch_id === parentBranch.id;
            const isNameMatch = Boolean(parentName && empBranchName && empBranchName === parentName);
            const isSiteMatch = Boolean(
              emp.default_work_location_id &&
              branches.some(
                (b) =>
                  b.is_site &&
                  b.branch_id === parentBranch.id &&
                  b.id === `site:${emp.default_work_location_id}`
              )
            );
            return isDirect || isNameMatch || isSiteMatch;
          });
        }
      }
    }

    return list;
  }, [employees, accountType, branches, filterBranch]);

  // 2. Identify currently selected employee
  const selectedEmpObj = useMemo(() => {
    if (!selectedEmployeeEmail && !newUserEmployeeId) return null;
    return (employees || []).find(
      (e) =>
        (selectedEmployeeEmail && e.email && e.email.toLowerCase() === selectedEmployeeEmail.toLowerCase()) ||
        (selectedEmployeeEmail && e.phone && e.phone.trim() === selectedEmployeeEmail.trim()) ||
        (newUserEmployeeId && e.id === newUserEmployeeId)
    );
  }, [selectedEmployeeEmail, employees, newUserEmployeeId]);

  // 3. Resolve branch and site roles
  const targetBranchId = selectedEmpObj?.branch_id || (filterBranch && filterBranch !== "all" && !filterBranch.startsWith("site:") ? filterBranch : null);
  const targetSiteId = selectedEmpObj?.default_work_location_id || (filterBranch && filterBranch.startsWith("site:") ? filterBranch.substring(5) : null);

  const { formBuRoles, formSiteRoles, formGlobalRoles } = useMemo(() => {
    const buRoles = (roles || []).filter(
      (r) => targetBranchId && r.branch_id === targetBranchId && !r.work_location_id
    );
    const siteRoles = (roles || []).filter(
      (r) => targetSiteId && r.work_location_id === targetSiteId
    );
    const globalRoles = (roles || []).filter(
      (r) => !r.branch_id && !r.work_location_id
    );
    return { formBuRoles: buRoles, formSiteRoles: siteRoles, formGlobalRoles: globalRoles };
  }, [roles, targetBranchId, targetSiteId]);

  return {
    filteredEmployeesForAutofill,
    selectedEmpObj,
    formBuRoles,
    formSiteRoles,
    formGlobalRoles,
  };
}
