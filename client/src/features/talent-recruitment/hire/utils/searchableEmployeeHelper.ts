import type { SearchableEmployee } from "@/components/EmployeeSearchSelect";

export function processSearchableEmployees(
  empData: any[],
  roleAssignments: any[]
): SearchableEmployee[] {
  // Build lookup map of user permissions and roles
  const roleMap = new Map<string, any>();
  (roleAssignments || []).forEach((r: any) => {
    if (r.email) roleMap.set(r.email.trim().toLowerCase(), r.app_roles);
    if (r.display_name) roleMap.set(r.display_name.trim().toLowerCase(), r.app_roles);
  });

  return ((empData as any[]) || []).map((emp) => {
    const fullName = `${emp.first_name || ""} ${emp.last_name || ""}`.trim().toLowerCase();
    const cleanEmail = (emp.email || "").trim().toLowerCase();
    const appRole = roleMap.get(cleanEmail) || roleMap.get(fullName);

    const jobRole = (emp.role || "").trim().toLowerCase();
    const appRoleName = (appRole?.name || "").trim().toLowerCase();

    // Exclude entry-level/operational staff from being identified as managers
    const isExcludedRole = /^(junior|intern|trainee|worker|cleaner|barista|mechanic|electrician|helper|operator|technicien|driver|guard|cashier)\b/i.test(jobRole);

    const isManager = !isExcludedRole && Boolean(
      // 1. Employee job title has manager/director/head/lead/supervisor/ceo/gm/admin
      /(manager|head|director|lead|supervisor|coordinator|ceo|chief|president|management|gm|admin)\b/i.test(jobRole) ||
      // 2. Or app role has manager/admin permissions
      (appRole && (
        appRole.hiring_requests_branch_approve ||
        appRole.employees_manage ||
        appRole.is_admin ||
        /(manager|director|head|lead|supervisor|ceo|admin|chairwoman)/i.test(appRoleName)
      ))
    );

    return {
      ...emp,
      app_role: appRole?.name || null,
      is_manager: isManager,
    };
  });
}
