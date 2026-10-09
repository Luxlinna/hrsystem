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
    let emp = assignmentUser.user_id ? employeeMap.get(`user:${assignmentUser.user_id}`) : null;
    if (!emp && assignmentUser.email) {
      emp = employeeMap.get(assignmentUser.email.toLowerCase());
    }
    if (!emp && assignmentUser.email && isPhoneSyntheticEmail(assignmentUser.email)) {
      const p = syntheticEmailToPhone(assignmentUser.email);
      emp = employeeMap.get(p) || employeeMap.get(normalizePhone(p)) || employeeMap.get(p.replace(/\D/g, ""));
    }

    const empDisplayName = emp
      ? (emp.display_name?.trim() || emp.full_name?.trim() || `${emp.last_name || ""} ${emp.first_name || ""}`.trim())
      : null;

    const empBranchId = emp?.branch_id;
    const empSiteId = emp?.default_work_location_id;
    const fallbackBranchId = (assignmentUser as any).branch_id || assignmentUser.app_roles?.branch_id || null;
    const fallbackSiteId = (assignmentUser as any).default_work_location_id || assignmentUser.app_roles?.work_location_id || null;

    const finalSiteId = empSiteId || fallbackSiteId || null;
    const site = finalSiteId ? locationsMap.get(finalSiteId) : null;
    const finalBranchId = empBranchId || site?.branch_id || fallbackBranchId || null;

    const bName = emp?.branches
      ? (emp.branches as any).name
      : (finalBranchId ? branchesList.find((b) => b.id === finalBranchId)?.name : null);
    const sName = site?.name || null;

    return {
      ...assignmentUser,
      display_name: empDisplayName || assignmentUser.display_name || null,
      branch_id: finalBranchId,
      branch_name: bName || (site ? branchesList.find((b) => b.id === site.branch_id)?.name : null) || "Headquarters",
      default_work_location_id: finalSiteId,
      site_name: sName,
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
      display_name: e.display_name || null,
      full_name: e.full_name || null,
      role: e.role,
      department: e.department,
      branch_id: e.branch_id || site?.branch_id || null,
      branch_name: e.branches ? (e.branches as any).name : (site ? branchesList.find((b) => b.id === site.branch_id)?.name : "Headquarters"),
      default_work_location_id: e.default_work_location_id || null,
      site_name: site?.name || null,
    };
  });
}
