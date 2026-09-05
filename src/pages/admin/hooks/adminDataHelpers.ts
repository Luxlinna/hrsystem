import type { DirectoryEmployee, UserAssignment } from "../types";
import { isPhoneSyntheticEmail, syntheticEmailToPhone, normalizePhone } from "@/lib/phoneUtils";

export function sortBranchesList(branches: { id: string; name: string }[]) {
  return [...branches].sort((a, b) => {
    const aName = (a.name || "").toLowerCase();
    const bName = (b.name || "").toLowerCase();
    if (aName.includes("pinex agro") && !bName.includes("pinex agro")) return -1;
    if (!aName.includes("pinex agro") && bName.includes("pinex agro")) return 1;
    if (aName.includes("kandal") && !bName.includes("kandal")) return -1;
    if (!aName.includes("kandal") && bName.includes("kandal")) return 1;
    return aName.localeCompare(bName);
  });
}

export function buildEnrichedAssignments(
  activeAssignments: UserAssignment[],
  employeeMap: Map<string, any>,
  locationsMap: Map<string, any>,
  branchesList: any[]
): UserAssignment[] {
  return activeAssignments.map((assignmentUser) => {
    let emp = assignmentUser.email ? employeeMap.get(assignmentUser.email.toLowerCase()) : null;
    if (!emp && assignmentUser.email && isPhoneSyntheticEmail(assignmentUser.email)) {
      const p = syntheticEmailToPhone(assignmentUser.email);
      emp = employeeMap.get(p) || employeeMap.get(normalizePhone(p));
    }
    const bName = emp?.branches ? (emp.branches as any).name : null;
    const site = emp?.default_work_location_id ? locationsMap.get(emp.default_work_location_id) : null;
    return {
      ...assignmentUser,
      display_name: assignmentUser.display_name || (emp ? `${emp.first_name || ""} ${emp.last_name || ""}`.trim() : null),
      branch_id: emp?.branch_id || site?.branch_id || null,
      branch_name: bName || (site ? branchesList.find((b) => b.id === site.branch_id)?.name : null) || "Headquarters",
      default_work_location_id: emp?.default_work_location_id || null,
      site_name: site?.name || null,
    };
  });
}

export function buildEnrichedEmployees(
  rawEmployees: any[],
  locationsMap: Map<string, any>,
  branchesList: any[]
): DirectoryEmployee[] {
  return rawEmployees.map((e) => {
    const site = e.default_work_location_id ? locationsMap.get(e.default_work_location_id) : null;
    return {
      id: e.id,
      email: e.email || null,
      phone: e.phone || null,
      first_name: e.first_name,
      last_name: e.last_name,
      role: e.role,
      department: e.department,
      branch_id: e.branch_id || site?.branch_id || null,
      branch_name: e.branches ? (e.branches as any).name : (site ? branchesList.find((b) => b.id === site.branch_id)?.name : "Headquarters"),
      default_work_location_id: e.default_work_location_id || null,
      site_name: site?.name || null,
    };
  });
}
