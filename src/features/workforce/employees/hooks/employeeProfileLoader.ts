import { supabase } from "@/lib/supabase";

export function isManagerOrBuCeoRole(roleName: string) {
  if (!roleName) return false;
  const lower = roleName.toLowerCase();
  return (
    lower.includes("manager") ||
    lower.includes("ceo") ||
    lower.includes("director") ||
    lower.includes("head") ||
    lower.includes("supervisor") ||
    lower.includes("lead") ||
    lower.includes("chair")
  );
}

export function matchAssignmentToEmployee(a: any, emps: any[]) {
  const cleanEmail = (a.email || "").toLowerCase().trim();
  const displayName = (a.display_name || "").toLowerCase().trim();

  // 1. Exact email match (for non-synthetic emails)
  if (cleanEmail && !cleanEmail.endsWith("@phone.hrmsystem.local")) {
    const match = emps.find((e) => e.email && e.email.toLowerCase().trim() === cleanEmail);
    if (match) return match;
  }
  // 2. Display name match (e.g. "Sophat T")
  if (displayName) {
    const match = emps.find(
      (e) => `${e.first_name || ""} ${e.last_name || ""}`.toLowerCase().trim() === displayName
    );
    if (match) return match;
  }
  // 3. Phone synthetic email digits
  if (cleanEmail && cleanEmail.endsWith("@phone.hrmsystem.local")) {
    const aDigits = cleanEmail.split("@")[0].replace(/\D/g, "");
    if (aDigits.length >= 6 && aDigits !== "0987654321" && aDigits !== "123456789") {
      const match = emps.find((e) => {
        if (!e.phone) return false;
        const eDigits = e.phone.replace(/\D/g, "");
        return (
          eDigits === aDigits ||
          (aDigits.startsWith("855") && eDigits === "0" + aDigits.slice(3)) ||
          (eDigits.startsWith("855") && aDigits === "0" + eDigits.slice(3)) ||
          (eDigits.startsWith("0") && aDigits === "855" + eDigits.slice(1)) ||
          (aDigits.startsWith("0") && eDigits === "855" + aDigits.slice(1))
        );
      });
      if (match) return match;
    }
  }
  // 4. Auth user_id match
  if (a.user_id) {
    const match = emps.find((e) => e.id === a.user_id);
    if (match) return match;
  }
  return null;
}

export function filterBuManagers(
  userManagementUsers: any[],
  currentEmpId?: string,
  targetBranchId?: string | null,
  targetBuName?: string | null,
  targetCodeBu?: string | null
) {
  const normBuName = (targetBuName || "").trim().toLowerCase();
  const normCodeBu = (targetCodeBu || "").trim().toLowerCase();

  const filtered = userManagementUsers.filter((u) => {
    // 1. Exclude self
    if (currentEmpId && u.id === currentEmpId) return false;

    // 2. Strictly check BU match
    if (targetBranchId) {
      if (u.branch_id === targetBranchId) return true;
      if (u.branches?.id === targetBranchId) return true;
      if (u.assignmentBranchId === targetBranchId) return true;
    }
    if (normBuName) {
      if (u.branches?.name && u.branches.name.trim().toLowerCase() === normBuName) return true;
      if (u.bu_full_name && u.bu_full_name.trim().toLowerCase() === normBuName && u.branch_id) return true;
    }
    if (normCodeBu && u.code_bu) {
      if (u.code_bu.trim().toLowerCase() === normCodeBu && u.branch_id) return true;
    }

    // Fallback only if employee has no BU assigned at all
    if (!targetBranchId && !normBuName && !normCodeBu) return true;

    return false;
  });

  return filtered.sort((a, b) => (a.first_name || "").localeCompare(b.first_name || ""));
}

export async function loadEmployeeRelations(empId: string, emp: any) {
  const [mgrRes, repsRes, allEmpsRes, rolesRes, ivsRes, leavesRes, payRes] = await Promise.all([
    emp.reports_to
      ? supabase.from("employees").select("id, first_name, last_name, role").eq("id", emp.reports_to).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase.from("employees").select("id, first_name, last_name, role").eq("reports_to", empId),
    supabase
      .from("employees")
      .select("id, first_name, last_name, kh_name, role, position, department, branch_id, bu_full_name, code_bu, phone, biometric_user_id, employee_code, email, avatar_url, branches(id, name)")
      .is("deleted_at", null),
    supabase
      .from("user_role_assignments")
      .select("id, user_id, email, display_name, role_id, app_roles(id, name, is_admin, branch_id)")
      .is("deleted_at", null),
    supabase
      .from("interviews")
      .select("*, candidates(full_name, job_postings(title))")
      .eq("interviewer_id", empId)
      .is("deleted_at", null)
      .order("scheduled_at", { ascending: false }),
    supabase.from("leave_requests").select("*").eq("employee_id", empId).order("created_at", { ascending: false }).limit(5),
    supabase.from("payroll_records").select("*").eq("employee_id", empId).order("created_at", { ascending: false }).limit(5),
  ]);

  const allEmps = (allEmpsRes.data || []).map((x: any) => ({
    ...x,
    branches: Array.isArray(x.branches) ? x.branches[0] : x.branches || null,
  }));

  const assignments = (rolesRes.data || []) as any[];

  // Match active users from User Management with Manager or BU CEO Admin roles to employees
  const seenEmpIds = new Set<string>();
  const userManagementUsers: any[] = [];

  for (const a of assignments) {
    const roleName = a.app_roles?.name || "";
    // Strictly Manager and BU CEO Admin roles from User Management
    if (!isManagerOrBuCeoRole(roleName)) continue;

    const matched = matchAssignmentToEmployee(a, allEmps);
    if (matched && !seenEmpIds.has(matched.id)) {
      seenEmpIds.add(matched.id);
      userManagementUsers.push({
        ...matched,
        userRole: roleName,
        role: roleName,
        assignmentRoleId: a.role_id,
        assignmentRoleName: roleName,
        assignmentBranchId: a.app_roles?.branch_id,
        isUserAdmin: Boolean(a.app_roles?.is_admin),
      });
    }
  }

  // Filter dynamically for this employee's current BU
  const initialBuManagers = filterBuManagers(
    userManagementUsers,
    empId,
    emp.branch_id,
    emp.bu_full_name || emp.branches?.name,
    emp.code_bu
  );

  return {
    manager: mgrRes.data,
    reports: repsRes.data || [],
    allEmployees: allEmps,
    userManagementUsers,
    managersList: initialBuManagers,
    interviews: ivsRes.data || [],
    leaveRequests: leavesRes.data || [],
    payrollRecords: payRes.data || [],
  };
}

