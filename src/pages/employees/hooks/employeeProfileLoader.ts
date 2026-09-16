import { supabase } from "@/lib/supabase";

export async function loadEmployeeRelations(empId: string, emp: any) {
  const [mgrRes, repsRes, allEmpsRes, rolesRes, ivsRes, leavesRes, payRes] = await Promise.all([
    emp.reports_to
      ? supabase.from("employees").select("id, first_name, last_name, role").eq("id", emp.reports_to).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase.from("employees").select("id, first_name, last_name, role").eq("reports_to", empId),
    supabase
      .from("employees")
      .select("id, first_name, last_name, kh_name, role, department, branch_id, biometric_user_id, employee_code, email, avatar_url, branches(name)")
      .is("deleted_at", null),
    supabase.from("user_role_assignments").select("email, app_roles(name)").is("deleted_at", null),
    supabase
      .from("interviews")
      .select("*, candidates(full_name, job_postings(title))")
      .eq("interviewer_id", empId)
      .is("deleted_at", null)
      .order("scheduled_at", { ascending: false }),
    supabase.from("leave_requests").select("*").eq("employee_id", empId).order("created_at", { ascending: false }).limit(5),
    supabase.from("payroll_records").select("*").eq("employee_id", empId).order("created_at", { ascending: false }).limit(5),
  ]);

  const managerEmails = new Set<string>();
  (rolesRes.data || []).forEach((row: any) => {
    if (/manager/i.test(row.app_roles?.name || "")) managerEmails.add(row.email?.toLowerCase());
  });

  const allEmps = (allEmpsRes.data || []).map((x: any) => ({
    ...x,
    branches: Array.isArray(x.branches) ? x.branches[0] : x.branches || null,
  }));

  const managersList = allEmps.filter((e: any) => e.id !== empId && managerEmails.has(e.email?.toLowerCase()));

  return {
    manager: mgrRes.data,
    reports: repsRes.data || [],
    allEmployees: allEmps,
    managersList,
    interviews: ivsRes.data || [],
    leaveRequests: leavesRes.data || [],
    payrollRecords: payRes.data || [],
  };
}
