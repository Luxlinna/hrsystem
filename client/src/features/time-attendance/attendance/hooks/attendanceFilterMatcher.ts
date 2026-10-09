import type { AttendanceRecord } from "../types";
import { formatBiometricId } from "@/lib/biometricUtils";

interface MatchParams {
  filterStatus: string;
  filterDivision?: string;
  filterDepartment: string;
  filterRole: string;
  filterEmploymentType: string;
  filterEmployeeLevel?: string;
  filterEmployeeId: string;
  filterWorkLocation: string;
  filterBranch?: string;
  dateBounds: { start: string; end: string } | null;
  searchQuery: string;
}

export function matchAttendanceRecord(r: AttendanceRecord, p: MatchParams): boolean {
  if (p.filterStatus && p.filterStatus !== "all") {
    const statuses = p.filterStatus.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
    if (statuses.length > 0 && !statuses.includes(r.status.toLowerCase())) return false;
  }

  if (p.filterBranch) {
    const branchList = p.filterBranch.split(",").map((s) => s.trim()).filter(Boolean);
    if (branchList.length > 0) {
      const empBranchId = r.employees?.branch_id || "";
      const empBranchName = (r.employees?.branches?.name || "").toLowerCase();
      const matched = branchList.some((s) => {
        const sLower = s.toLowerCase();
        return (
          empBranchId === s ||
          empBranchName === sLower ||
          empBranchName.includes(sLower)
        );
      });
      if (!matched) return false;
    }
  }

  if (p.filterDivision && p.filterDivision !== "all") {
    const divs = p.filterDivision.split(",").map((d) => d.trim().toLowerCase()).filter(Boolean);
    const empDiv = (r.employees?.division || "").toLowerCase();
    if (divs.length > 0 && !divs.includes(empDiv)) return false;
  }

  if (p.filterDepartment && p.filterDepartment !== "all") {
    const depts = p.filterDepartment.split(",").map((d) => d.trim().toLowerCase()).filter(Boolean);
    const empDept = (r.employees?.department || "").toLowerCase();
    if (depts.length > 0 && !depts.includes(empDept)) return false;
  }

  if (p.filterRole && p.filterRole !== "all") {
    const roles = p.filterRole.split(",").map((role) => role.trim().toLowerCase()).filter(Boolean);
    const empRole = (r.employees?.role || "").toLowerCase();
    if (roles.length > 0 && !roles.includes(empRole)) return false;
  }

  if (p.filterEmploymentType && p.filterEmploymentType !== "all") {
    const types = p.filterEmploymentType.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean);
    const empType = (r.employees?.employment_type || r.employees?.contract_type || "").toLowerCase();
    if (types.length > 0 && !types.includes(empType)) return false;
  }

  if (p.filterEmployeeLevel) {
    const levelList = p.filterEmployeeLevel.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
    if (levelList.length > 0) {
      const empLevel = ((r.employees as any)?.employee_level || "").toLowerCase();
      const matched = levelList.some((l) => empLevel === l || empLevel.includes(l));
      if (!matched) return false;
    }
  }

  if (p.filterEmployeeId && p.filterEmployeeId !== "all") {
    const empIds = p.filterEmployeeId.split(",").map((id) => id.trim()).filter(Boolean);
    if (empIds.length > 0 && !empIds.includes(r.employee_id)) return false;
  }

  if (p.filterWorkLocation && p.filterWorkLocation !== "all") {
    const locList = p.filterWorkLocation.split(",").map((s) => s.trim()).filter(Boolean);
    if (locList.length > 0) {
      const recLocId = r.work_location_id || "";
      const empLocId = r.employees?.default_work_location_id || "";
      const empBranchId = r.employees?.branch_id || "";
      const empBranchName = (r.employees?.branches?.name || "").toLowerCase();
      const recLocName = (r.work_location?.name || "").toLowerCase();
      const empSite = ((r.employees as any)?.site || "").toLowerCase();

      const matched = locList.some((s) => {
        if (s.startsWith("site:")) {
          const rawId = s.substring(5);
          return recLocId === rawId || empLocId === rawId;
        } else if (s.startsWith("branch:")) {
          const rawId = s.substring(7);
          return empBranchId === rawId;
        } else {
          const sLower = s.toLowerCase();
          return (
            recLocId === s ||
            empLocId === s ||
            empBranchId === s ||
            empBranchName === sLower ||
            recLocName === sLower ||
            recLocName.includes(sLower) ||
            empSite === sLower ||
            empSite.includes(sLower)
          );
        }
      });
      if (!matched) return false;
    }
  }

  if (p.dateBounds && (r.date < p.dateBounds.start || r.date > p.dateBounds.end)) return false;

  if (p.searchQuery.trim()) {
    const q = p.searchQuery.toLowerCase().trim();
    const emp = r.employees;
    const empName = `${emp?.last_name || ""} ${emp?.first_name || ""}`.toLowerCase();
    const empDisplayName = (emp?.display_name || "").toLowerCase();
    const empFullName = (emp?.full_name || "").toLowerCase();
    const empRole = (emp?.role || "").toLowerCase();
    const dept = (emp?.department || "").toLowerCase();
    const notes = (r.notes || "").toLowerCase();
    const dateStr = r.date.toLowerCase();
    const site = (r.work_location?.name || "").toLowerCase();
    const bioId = (emp?.biometric_user_id || "").toLowerCase();
    const fullBuId = formatBiometricId(emp?.biometric_user_id, emp?.branches?.name).toLowerCase();
    const code = (emp?.employee_code || "").toLowerCase();

    if (
      !empName.includes(q) &&
      !empDisplayName.includes(q) &&
      !empFullName.includes(q) &&
      !empRole.includes(q) &&
      !dept.includes(q) &&
      !notes.includes(q) &&
      !dateStr.includes(q) &&
      !site.includes(q) &&
      !bioId.includes(q) &&
      !fullBuId.includes(q) &&
      !code.includes(q)
    ) {
      return false;
    }
  }

  return true;
}
