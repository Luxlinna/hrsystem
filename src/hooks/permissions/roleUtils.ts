import { supabase } from "@/lib/supabase";
import type { UserRole } from "./types";

export async function fetchRoleFromFunction(): Promise<any | null> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) return null;

  const res = await fetch(`${import.meta.env.VITE_PUBLIC_SUPABASE_URL}/functions/v1/get-my-role`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${session.access_token}`,
      "apikey": import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY,
    },
  });

  if (!res.ok) return null;
  const result = await res.json().catch(() => null);
  return result?.assignment || null;
}

export function toUserRole(data: any): UserRole | null {
  if (!data?.app_roles) return null;
  const r = data.app_roles as any;
  return {
    id: r.id,
    name: r.name,
    description: r.description,
    color: r.color,
    is_admin: r.is_admin,
    allowed_modules: r.allowed_modules || [],
    employees_manage: !!r.employees_manage,
    self_service_all_employees: !!r.self_service_all_employees,
    leave_view_all_employees: !!r.leave_view_all_employees,
    leave_approve: !!r.leave_approve,
    payroll_view_all_employees: !!r.payroll_view_all_employees,
    attendance_view_all_employees: !!r.attendance_view_all_employees,
    performance_view_all_employees: !!r.performance_view_all_employees,
    disciplinary_view_all_employees: !!r.disciplinary_view_all_employees,
    leave_view_own_branch: !!r.leave_view_own_branch,
    attendance_view_own_branch: !!r.attendance_view_own_branch,
    performance_view_own_branch: !!r.performance_view_own_branch,
    disciplinary_view_own_branch: !!r.disciplinary_view_own_branch,
    task_view_all_employees: !!r.task_view_all_employees,
    task_view_own_branch: !!r.task_view_own_branch,
    meeting_rooms_approve: !!r.meeting_rooms_approve,
    attendance_notify: !!r.attendance_notify,
  };
}
