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
  self_service_all_employees: boolean;
  leave_view_all_employees: boolean;
  payroll_view_all_employees: boolean;
  attendance_view_all_employees: boolean;
  performance_view_all_employees: boolean;
  disciplinary_view_all_employees: boolean;
}

interface UsePermissionsReturn {
  role: UserRole | null;
  loading: boolean;
  can: (module: string) => boolean;
  isAdmin: boolean;
}

let cachedRole: UserRole | null = null;
let cachedUid: string | null = null;

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
        .eq("user_id", user.id)
        .maybeSingle();

      if (!error && data?.app_roles) {
        const r = data.app_roles as any;
        const userRole: UserRole = {
          id: r.id,
          name: r.name,
          description: r.description,
          color: r.color,
          is_admin: r.is_admin,
          allowed_modules: r.allowed_modules || [],
          self_service_all_employees: !!r.self_service_all_employees,
          leave_view_all_employees: !!r.leave_view_all_employees,
          payroll_view_all_employees: !!r.payroll_view_all_employees,
          attendance_view_all_employees: !!r.attendance_view_all_employees,
          performance_view_all_employees: !!r.performance_view_all_employees,
          disciplinary_view_all_employees: !!r.disciplinary_view_all_employees,
        };
        cachedRole = userRole;
        cachedUid = user.id;
        setRole(userRole);
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
