import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import type { UserRole, UsePermissionsReturn } from "./permissions/types";
import { isBootstrapAdminEmail, bootstrapAdminRole } from "./permissions/bootstrapUtils";
import { fetchRoleFromFunction, toUserRole } from "./permissions/roleUtils";
import { applyUserEmployeeFilter } from "@/lib/phoneUtils";

export type { UserRole, UsePermissionsReturn };
export { isBootstrapAdminEmail };

let cachedRole: UserRole | null = null;
let cachedUid: string | null = null;

export function usePermissions(): UsePermissionsReturn {
  const { user, loading: authLoading } = useAuth();
  const [role, setRole] = useState<UserRole | null>(cachedRole);
  const [loading, setLoading] = useState(!cachedRole);

  const resolveRole = useCallback(async (currentUser: NonNullable<typeof user>) => {
    try {
      // 1. Bootstrap Super Admin full bypass
      if (isBootstrapAdminEmail(currentUser.email)) {
        const fallbackRole = bootstrapAdminRole();
        cachedRole = fallbackRole;
        cachedUid = currentUser.id;
        setRole(fallbackRole);
        return;
      }

      // Non-blocking role linking in background
      void Promise.resolve(supabase.rpc("link_my_role_assignment")).catch(() => {});

      const cleanEmail = currentUser.email?.trim().toLowerCase() || "";

      // 2. Parallelize Employee Status Check & Role Assignment queries
      const empPromise = applyUserEmployeeFilter(
        supabase
          .from("employees")
          .select("id, status, deleted_at, branch_id, branches(id, status, deleted_at)"),
        currentUser.email
      )
        .is("deleted_at", null)
        .limit(5);

      const uraPromise = supabase
        .from("user_role_assignments")
        .select("*, app_roles(*)")
        .or(`user_id.eq.${currentUser.id},email.ilike.${cleanEmail}`)
        .is("deleted_at", null)
        .order("user_id", { nullsFirst: false })
        .limit(1);

      const [{ data: empCheckRows }, { data: uraData, error: uraError }] = await Promise.all([
        empPromise,
        uraPromise,
      ]);

      // Check employee status (inactive/terminated/branch invalid)
      const activeEmp = empCheckRows?.find(
        (e) => e.status !== "inactive" && e.status !== "terminated"
      );
      const empCheck = activeEmp || empCheckRows?.[0] || null;

      const isEmpInactive = Boolean(empCheck && (empCheck.status === "inactive" || empCheck.status === "terminated"));
      const branchInfo = (empCheck as any)?.branches;
      const isBranchInvalid = Boolean(
        empCheck?.branch_id &&
        branchInfo &&
        (Boolean(branchInfo.deleted_at) || branchInfo.status === "inactive")
      );

      if (isEmpInactive || isBranchInvalid) {
        cachedRole = null;
        cachedUid = currentUser.id;
        setRole(null);
        return;
      }

      // Load user role assignment
      const row = !uraError && uraData && uraData.length > 0 ? uraData[0] : null;
      const assignment = row?.app_roles ? row : await fetchRoleFromFunction();
      const userRole = toUserRole(assignment);

      if (userRole) {
        cachedRole = userRole;
        cachedUid = currentUser.id;
        setRole(userRole);
      } else {
        cachedRole = null;
        cachedUid = currentUser.id;
        setRole(null);
      }
    } catch (err) {
      console.error("Failed to resolve user permissions:", err);
      cachedRole = null;
      cachedUid = currentUser.id;
      setRole(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setRole(null);
      setLoading(false);
      cachedRole = null;
      cachedUid = null;
      return;
    }

    if (cachedUid === user.id && cachedRole) {
      setRole(cachedRole);
      setLoading(false);
      return;
    }

    resolveRole(user);
  }, [user, authLoading, resolveRole]);

  useEffect(() => {
    if (authLoading || !user) return;

    const refresh = () => {
      cachedRole = null;
      cachedUid = null;
      resolveRole(user);
    };

    const onVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", onVisible);

    const channel = supabase
      .channel(`my-role-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "user_role_assignments" },
        (payload) => {
          const row = (payload.new ?? payload.old) as { user_id?: string; email?: string } | null;
          const mine =
            row?.user_id === user.id ||
            (!!row?.email && row.email.toLowerCase() === (user.email?.toLowerCase() || ""));
          if (mine) refresh();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "employees" },
        (payload) => {
          const row = (payload.new ?? payload.old) as { email?: string } | null;
          if (row?.email && row.email.toLowerCase() === (user.email?.toLowerCase() || "")) {
            refresh();
          }
        }
      )
      .subscribe();

    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      supabase.removeChannel(channel);
    };
  }, [user, authLoading, resolveRole]);

  const isBranchAdmin =
    !loading &&
    !!role &&
    !role.is_admin &&
    (/(branch|bu)\s*.*admin/i.test(role.name?.trim() || "") ||
      /(branch|bu)\s*ceo/i.test(role.name?.trim() || "") ||
      role.allowed_modules.includes("admin"));

  const can = useCallback(
    (module: string): boolean => {
      if (loading) return false;
      if (!role) return false;
      if (role.is_admin) return true;
      if (role.allowed_modules.includes("*")) return true;
      const roleName = (role.name || "").trim().toLowerCase();
      if (/(branch|bu)\s*.*admin/i.test(roleName) || /(branch|bu)\s*ceo/i.test(roleName)) return true;
      if (module === "dashboard" || module === "home") return true;
      return role.allowed_modules.includes(module);
    },
    [loading, role]
  );

  const isAdmin = !loading && !!role && (role.is_admin || role.allowed_modules.includes("*"));

  return { role, loading, can, isAdmin, isBranchAdmin };
}

export function invalidatePermissionsCache() {
  cachedRole = null;
  cachedUid = null;
}
