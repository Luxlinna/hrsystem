import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { applyUserEmployeeFilter } from "@/lib/phoneUtils";

export interface MyEmployee {
  id: string;
  first_name: string;
  last_name: string;
  role: string | null;
  department: string | null;
  avatar_url: string | null;
}

interface UseMyEmployeeReturn {
  employee: MyEmployee | null;
  loading: boolean;
}

// Module-level cache mirrors usePermissions' pattern: every layout component
// (TopBar, Sidebar, ...) that mounts in the same session reuses one fetch
// instead of each re-querying the employees table for the signed-in user.
let cachedEmployee: MyEmployee | null = null;
let cachedEmail: string | null = null;

// Every mounted useMyEmployee() instance (TopBar, Sidebar, ...) registers a
// refetch callback here. invalidateMyEmployeeCache() calls them all, so a
// name/avatar edit on the Profile page shows up in the nav immediately
// instead of only after the next mount/reload.
type Listener = () => void;
const listeners = new Set<Listener>();

/**
 * Resolves the signed-in user's own employee record (real name, role,
 * department, avatar) by matching auth email against employees.email.
 * Layout chrome (TopBar, Sidebar) should use this instead of trusting
 * Supabase Auth's user_metadata, which is editable independently of the
 * employees table and can drift (e.g. a stale display_name or avatar_url
 * set at invite time).
 */
export function useMyEmployee(): UseMyEmployeeReturn {
  const { user, loading: authLoading } = useAuth();
  const [employee, setEmployee] = useState<MyEmployee | null>(
    cachedEmail === (user?.email?.toLowerCase() || null) ? cachedEmployee : null
  );
  const [loading, setLoading] = useState(!(cachedEmail === (user?.email?.toLowerCase() || null) && cachedEmployee));

  const fetchEmployee = useCallback(async (email: string) => {
    setLoading(true);
    const empQuery = applyUserEmployeeFilter(
      supabase
        .from("employees")
        .select("id, first_name, last_name, role, department, avatar_url"),
      email
    );
    const { data } = await empQuery
      .is("deleted_at", null)
      .maybeSingle();

    cachedEmployee = (data as MyEmployee) || null;
    cachedEmail = email;
    setEmployee(cachedEmployee);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (authLoading) return;
    const email = user?.email?.toLowerCase() || null;

    if (!email) {
      setEmployee(null);
      setLoading(false);
      cachedEmployee = null;
      cachedEmail = null;
      return;
    }

    if (cachedEmail === email) {
      setEmployee(cachedEmployee);
      setLoading(false);
      return;
    }

    fetchEmployee(email);
  }, [user?.email, authLoading, fetchEmployee]);

  // Re-run the fetch whenever another part of the app (e.g. the Profile
  // page after a save) invalidates the shared cache.
  useEffect(() => {
    const email = user?.email?.toLowerCase();
    if (!email) return;
    const listener = () => fetchEmployee(email);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, [user?.email, fetchEmployee]);

  return { employee, loading };
}

// Clears the cache and immediately refetches in every mounted consumer —
// call after the signed-in employee edits their own name/avatar/etc so the
// nav and any other live useMyEmployee() consumer update without a reload.
export function invalidateMyEmployeeCache() {
  cachedEmployee = null;
  cachedEmail = null;
  listeners.forEach((l) => l());
}
