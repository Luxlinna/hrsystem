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
  selectedBranchId: string;
  setSelectedBranchId: (id: string) => void;
  effectiveBranchId: string | null;
  effectiveBranchName: string | null;
  targetBranch: string | null;
  isPartnerBranchBlocked: boolean;
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
    const saved = localStorage.getItem("hrm_selected_branch_id");
    return saved && saved !== "all" ? saved : "";
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
      return userBranchId || (branches[0]?.id ?? "");
    }
    // Super Admin: check if stored branch exists in branches list
    if (storedBranchId && branches.some((b) => b.id === storedBranchId)) {
      return storedBranchId;
    }
    // Default to user's assigned branch or first branch in list
    if (userBranchId && branches.some((b) => b.id === userBranchId)) {
      return userBranchId;
    }
    return branches[0]?.id || "";
  }, [isSuperAdmin, userBranchId, storedBranchId, branches]);

  const setSelectedBranchId = useCallback(
    (id: string) => {
      if (!isSuperAdmin) return;
      setStoredBranchId(id);
      localStorage.setItem("hrm_selected_branch_id", id);
    },
    [isSuperAdmin]
  );

  const effectiveBranchId = useMemo(() => {
    return selectedBranchId || null;
  }, [selectedBranchId]);

  const targetBranch = useMemo(() => {
    if (isSuperAdmin) {
      return effectiveBranchId;
    }
    return userBranchId;
  }, [isSuperAdmin, effectiveBranchId, userBranchId]);

  const isPartnerBranchBlocked = useMemo(() => {
    // Super Admin can access any branch selected
    if (isSuperAdmin) return false;
    // Regular employee / Branch Admin is blocked only if they have no branch assigned
    return !userBranchId;
  }, [isSuperAdmin, userBranchId]);

  const effectiveBranchName = useMemo(() => {
    if (!effectiveBranchId) return "Select Branch";
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
      targetBranch,
      isPartnerBranchBlocked,
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
      targetBranch,
      isPartnerBranchBlocked,
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

