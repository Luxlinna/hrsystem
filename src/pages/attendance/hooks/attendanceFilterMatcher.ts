import type { AttendanceRecord } from "../types";
import { formatBiometricId } from "@/lib/biometricUtils";

interface MatchParams {
  filterStatus: string;
  filterDepartment: string;
  filterRole: string;
  filterEmploymentType: string;
  filterEmployeeId: string;
  filterWorkLocation: string;
  dateBounds: { start: string; end: string } | null;
  searchQuery: string;
}

export function matchAttendanceRecord(r: AttendanceRecord, p: MatchParams): boolean {
  if (p.filterStatus !== "all" && r.status !== p.filterStatus) return false;
  if (p.filterDepartment !== "all" && r.employees?.department !== p.filterDepartment) return false;
  if (p.filterRole !== "all" && r.employees?.role !== p.filterRole) return false;
  if (p.filterEmploymentType !== "all") {
    const empType = (r.employees?.employment_type || r.employees?.contract_type || "").toLowerCase();
    if (empType !== p.filterEmploymentType.toLowerCase()) return false;
  }
  if (p.filterEmployeeId !== "all" && r.employee_id !== p.filterEmployeeId) return false;
  if (p.filterWorkLocation !== "all") {
    if (p.filterWorkLocation === "main") {
      if (r.work_location_id && r.work_location_id !== "main" && !(r.work_location as any)?.is_default) return false;
    } else {
      if (r.work_location_id !== p.filterWorkLocation) return false;
    }
  }
  if (p.dateBounds && (r.date < p.dateBounds.start || r.date > p.dateBounds.end)) return false;
  if (p.searchQuery.trim()) {
    const q = p.searchQuery.toLowerCase().trim();
    const emp = r.employees;
    const empName = `${emp?.first_name || ""} ${emp?.last_name || ""}`.toLowerCase();
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
