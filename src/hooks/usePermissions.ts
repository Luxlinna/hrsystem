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
      // Link this auth user to any pre-provisioned assignment row (matched by email)
      // and to their own row (matched by user_id) on first appearance.
      await supabase
        .from("user_role_assignments")
        .update({ user_id: user.id, updated_at: new Date().toISOString() })
        .eq("email", user.email)
        .is("user_id", null);

      const { data } = await supabase
        .from("user_role_assignments")
        .select("*, app_roles(*)")
        .eq("user_id", user.id)
        .maybeSingle();

      if (data?.app_roles) {
        const r = data.app_roles as any;
        const userRole: UserRole = {
          id: r.id,
          name: r.name,
          description: r.description,
          color: r.color,
          is_admin: r.is_admin,
          allowed_modules: r.allowed_modules || [],
        };
        cachedRole = userRole;
        cachedUid = user.id;
        setRole(userRole);
      } else {
        // No assignment = treat as Super Admin by default (first-run / unassigned)
        cachedRole = null;
        cachedUid = user.id;
        setRole(null);
      }
      setLoading(false);
    })();
  }, [user, authLoading]);

  const can = (module: string): boolean => {
    if (!role) return true; // unassigned = full access
    if (role.is_admin) return true;
    if (role.allowed_modules.includes("*")) return true;
    return role.allowed_modules.includes(module);
  };

  const isAdmin = !role || role.is_admin || role.allowed_modules.includes("*");

  return { role, loading, can, isAdmin };
}

// Invalidate cache on role change
export function invalidatePermissionsCache() {
  cachedRole = null;
  cachedUid = null;
}
