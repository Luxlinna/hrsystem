/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";

export interface BranchInfo {
  id: string;
  name: string;
  location?: string | null;
  status?: string | null;
}

export interface BranchContextType {
  branches: BranchInfo[];
  loading: boolean;
  userBranchId: string | null;
  userBranchName: string | null;
  selectedBranchId: string; // "all" | branch UUID
  setSelectedBranchId: (id: string) => void;
  effectiveBranchId: string | null; // null if "all", or specific UUID
  effectiveBranchName: string | null;
  isSuperAdmin: boolean;
  isBranchAdmin: boolean;
  isBranchScoped: boolean;
  refreshBranches: () => Promise<void>;
}

const BranchContext = createContext<BranchContextType | undefined>(undefined);

export function BranchProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { role, isAdmin: isSuperRole } = usePermissions();

  const [branches, setBranches] = useState<BranchInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [userBranchId, setUserBranchId] = useState<string | null>(null);
  const [userBranchName, setUserBranchName] = useState<string | null>(null);
  const [storedBranchId, setStoredBranchId] = useState<string>(() => {
    return localStorage.getItem("hrm_selected_branch_id") || "all";
  });

  const isSuperAdmin = useMemo(() => {
    return isSuperRole || role?.name === "Super Admin" || role?.allowed_modules.includes("*");
  }, [isSuperRole, role]);

  const isBranchAdmin = useMemo(() => {
    if (isSuperAdmin) return false;
    const roleName = (role?.name || "").trim().toLowerCase();
    return /branch\s*admin/i.test(roleName);
  }, [isSuperAdmin, role]);

  const fetchBranches = useCallback(async () => {
    const { data } = await supabase
      .from("branches")
      .select("id, name, location, status")
      .is("deleted_at", null)
      .order("name");
    if (data) setBranches(data);
  }, []);

  const fetchUserBranch = useCallback(async () => {
    if (!user?.email) {
      setUserBranchId(null);
      setUserBranchName(null);
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from("employees")
      .select("id, branch_id, branches(id, name)")
      .eq("email", user.email)
      .maybeSingle();

    if (data?.branch_id) {
      setUserBranchId(data.branch_id);
      const bName = (data.branches as any)?.name || null;
      setUserBranchName(bName);
    } else {
      setUserBranchId(null);
      setUserBranchName(null);
    }
    setLoading(false);
  }, [user?.email]);

  useEffect(() => {
    fetchBranches();
    fetchUserBranch();
  }, [fetchBranches, fetchUserBranch]);

  const selectedBranchId = useMemo(() => {
    // Non-Super-Admin is strictly locked to their own assigned branch
    if (!isSuperAdmin) {
      return userBranchId || "all";
    }
    return storedBranchId;
  }, [isSuperAdmin, userBranchId, storedBranchId]);

  const setSelectedBranchId = useCallback(
    (id: string) => {
      if (!isSuperAdmin) return; // Disallow non-super-admins from changing branch
      setStoredBranchId(id);
      localStorage.setItem("hrm_selected_branch_id", id);
    },
    [isSuperAdmin]
  );

  const effectiveBranchId = useMemo(() => {
    if (selectedBranchId === "all") return null;
    return selectedBranchId;
  }, [selectedBranchId]);

  const effectiveBranchName = useMemo(() => {
    if (!effectiveBranchId) return "All Branches";
    const found = branches.find((b) => b.id === effectiveBranchId);
    return found?.name || userBranchName || "Selected Branch";
  }, [effectiveBranchId, branches, userBranchName]);

  const isBranchScoped = Boolean(effectiveBranchId);

  const value = useMemo(
    () => ({
      branches,
      loading,
      userBranchId,
      userBranchName,
      selectedBranchId,
      setSelectedBranchId,
      effectiveBranchId,
      effectiveBranchName,
      isSuperAdmin,
      isBranchAdmin,
      isBranchScoped,
      refreshBranches: fetchBranches,
    }),
    [
      branches,
      loading,
      userBranchId,
      userBranchName,
      selectedBranchId,
      setSelectedBranchId,
      effectiveBranchId,
      effectiveBranchName,
      isSuperAdmin,
      isBranchAdmin,
      isBranchScoped,
      fetchBranches,
    ]
  );

  return <BranchContext.Provider value={value}>{children}</BranchContext.Provider>;
}

export function useBranchScope() {
  const context = useContext(BranchContext);
  if (!context) {
    throw new Error("useBranchScope must be used within a BranchProvider");
  }
  return context;
}
