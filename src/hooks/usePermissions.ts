import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

export interface UserRole {
  id: number;
  name: string;
  description: string;
  color: string;
  is_admin: boolean;
  allowed_modules: string[];
  employees_manage: boolean;
  self_service_all_employees: boolean;
  leave_view_all_employees: boolean;
  payroll_view_all_employees: boolean;
  attendance_view_all_employees: boolean;
  performance_view_all_employees: boolean;
  disciplinary_view_all_employees: boolean;
  leave_view_own_branch: boolean;
  attendance_view_own_branch: boolean;
  performance_view_own_branch: boolean;
  disciplinary_view_own_branch: boolean;
  task_view_all_employees: boolean;
  task_view_own_branch: boolean;
  meeting_rooms_approve: boolean;
}

interface UsePermissionsReturn {
  role: UserRole | null;
  loading: boolean;
  can: (module: string) => boolean;
  isAdmin: boolean;
}

let cachedRole: UserRole | null = null;
let cachedUid: string | null = null;

const BOOTSTRAP_ADMIN_EMAILS = new Set(
  ((import.meta.env.VITE_BOOTSTRAP_ADMIN_EMAILS as string | undefined) || "admin@hrmops.com")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)
);

export function isBootstrapAdminEmail(email?: string | null) {
  return !!email && BOOTSTRAP_ADMIN_EMAILS.has(email.toLowerCase());
}

function bootstrapAdminRole(): UserRole {
  return {
    id: -1,
    name: "Super Admin",
    description: "Bootstrap full access administrator",
    color: "#253C7D",
    is_admin: true,
    allowed_modules: ["*"],
    employees_manage: true,
    self_service_all_employees: true,
    leave_view_all_employees: true,
    payroll_view_all_employees: true,
    attendance_view_all_employees: true,
    performance_view_all_employees: true,
    disciplinary_view_all_employees: true,
    leave_view_own_branch: true,
    attendance_view_own_branch: true,
    performance_view_own_branch: true,
    disciplinary_view_own_branch: true,
    task_view_all_employees: true,
    task_view_own_branch: true,
    meeting_rooms_approve: true,
  };
}

async function fetchRoleFromFunction(): Promise<any | null> {
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

function toUserRole(data: any): UserRole | null {
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
  };
}

export function usePermissions(): UsePermissionsReturn {
  const { user, loading: authLoading } = useAuth();
  const [role, setRole] = useState<UserRole | null>(cachedRole);
  const [loading, setLoading] = useState(!cachedRole);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setRole(null);
      setLoading(false);
      cachedRole = null;
      cachedUid = null;
      return;
    }

    // Use cache if same user
    if (cachedUid === user.id && cachedRole) {
      setRole(cachedRole);
      setLoading(false);
      return;
    }

    (async () => {
      // Link this auth user to any pre-provisioned assignment row (matched by
      // email) via a SECURITY DEFINER RPC — it can only ever set user_id on a
      // row that already matches this user's own email, never touch role_id.
      await supabase.rpc("link_my_role_assignment");

      const { data, error } = await supabase
        .from("user_role_assignments")
        .select("*, app_roles(*)")
        .or(`user_id.eq.${user.id},email.eq.${user.email?.toLowerCase() || ""}`)
        .maybeSingle();

      const assignment = !error && data?.app_roles ? data : await fetchRoleFromFunction();
      const userRole = toUserRole(assignment);

      if (userRole) {
        cachedRole = userRole;
        cachedUid = user.id;
        setRole(userRole);
      } else if (isBootstrapAdminEmail(user.email)) {
        const fallbackRole = bootstrapAdminRole();
        cachedRole = fallbackRole;
        cachedUid = user.id;
        setRole(fallbackRole);
      } else {
        // No assignment (or the read failed) = no access until an admin
        // assigns a role via the Admin Portal. Never fail open.
        cachedRole = null;
        cachedUid = user.id;
        setRole(null);
      }
      setLoading(false);
    })();
  }, [user, authLoading]);

  const can = (module: string): boolean => {
    if (loading) return false;
    if (!role) return false; // unassigned = no access
    if (role.is_admin) return true;
    if (role.allowed_modules.includes("*")) return true;
    return role.allowed_modules.includes(module);
  };

  const isAdmin = !loading && !!role && (role.is_admin || role.allowed_modules.includes("*"));

  return { role, loading, can, isAdmin };
}

// Invalidate cache on role change
export function invalidatePermissionsCache() {
  cachedRole = null;
  cachedUid = null;
}
