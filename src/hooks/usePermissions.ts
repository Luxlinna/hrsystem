import { useState, useEffect, useCallback } from "react";
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
  /** Deciding leave is a separate right from seeing it — see migration 20260819010000. */
  leave_approve: boolean;
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
  /** Opt-in to attendance check-in/check-out notifications — see migration 20260821000000. */
  attendance_notify: boolean;
}

export interface UsePermissionsReturn {
  role: UserRole | null;
  loading: boolean;
  can: (module: string) => boolean;
  isAdmin: boolean;
  isBranchAdmin: boolean;
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
    leave_approve: true,
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
    attendance_notify: true,
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

export function usePermissions(): UsePermissionsReturn {
  const { user, loading: authLoading } = useAuth();
  const [role, setRole] = useState<UserRole | null>(cachedRole);
  const [loading, setLoading] = useState(!cachedRole);

  const resolveRole = useCallback(async (currentUser: NonNullable<typeof user>) => {
    // Link this auth user to any pre-provisioned assignment row (matched by
    // email) via a SECURITY DEFINER RPC — it can only ever set user_id on a
    // row that already matches this user's own email, never touch role_id.
    await supabase.rpc("link_my_role_assignment");

    // An .or() can legitimately match two rows (one by user_id, one by the
    // pre-provisioned email row), which makes .maybeSingle() error out and
    // silently drop the user to the edge-function fallback. Order and take
    // the first instead so a duplicate row degrades to "use the linked one"
    // rather than "no role at all".
    const { data, error } = await supabase
      .from("user_role_assignments")
      .select("*, app_roles(*)")
      .or(`user_id.eq.${currentUser.id},email.eq.${currentUser.email?.toLowerCase() || ""}`)
      .order("user_id", { nullsFirst: false })
      .limit(1);

    const row = !error && data && data.length > 0 ? data[0] : null;
    const assignment = row?.app_roles ? row : await fetchRoleFromFunction();
    const userRole = toUserRole(assignment);

    if (userRole) {
      cachedRole = userRole;
      cachedUid = currentUser.id;
      setRole(userRole);
    } else if (isBootstrapAdminEmail(currentUser.email)) {
      const fallbackRole = bootstrapAdminRole();
      cachedRole = fallbackRole;
      cachedUid = currentUser.id;
      setRole(fallbackRole);
    } else {
      // No assignment (or the read failed) = no access until an admin
      // assigns a role via the Admin Portal. Never fail open.
      cachedRole = null;
      cachedUid = currentUser.id;
      setRole(null);
    }
    setLoading(false);
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

    // Use cache if same user
    if (cachedUid === user.id && cachedRole) {
      setRole(cachedRole);
      setLoading(false);
      return;
    }

    resolveRole(user);
  }, [user, authLoading, resolveRole]);

  // A role change made by an admin happens in *their* browser, so the affected
  // user's open session would otherwise keep its cached permissions until a
  // full reload. Re-resolve when the tab regains focus, and react immediately
  // if this user's own assignment row changes.
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
    role.name?.trim().toLowerCase() === "branch admin";

  // Memoized so its identity only changes when the underlying permissions
  // actually do — components legitimately put `can` in effect/callback
  // dependency arrays, and a fresh function on every render there turns
  // into an infinite fetch loop (effect runs -> setState -> re-render ->
  // new `can` -> effect runs again).
  const can = useCallback(
    (module: string): boolean => {
      if (loading) return false;
      if (!role) return false; // unassigned = no access
      if (role.is_admin) return true;
      if (role.allowed_modules.includes("*")) return true;
      const roleName = (role.name || "").trim().toLowerCase();
      if (roleName === "branch admin") {
        // Branch Admin has access to their own branch's modules, but cannot manage other branches or global tenant admin
        return module !== "admin" && module !== "branches";
      }
      return role.allowed_modules.includes(module);
    },
    [loading, role]
  );

  const isAdmin = !loading && !!role && (role.is_admin || role.allowed_modules.includes("*"));

  return { role, loading, can, isAdmin, isBranchAdmin };
}

// Invalidate cache on role change
export function invalidatePermissionsCache() {
  cachedRole = null;
  cachedUid = null;
}
