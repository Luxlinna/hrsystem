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
  branch_id?: string | null;
  is_site?: boolean;
}

export interface BranchContextType {
  branches: BranchInfo[];
  visibleBranches: BranchInfo[];
  loading: boolean;
  userBranchId: string | null;
  userBranchName: string | null;
  selectedBranchId: string;
  setSelectedBranchId: (id: string) => void;
  effectiveBranchId: string | null;
  effectiveBranchName: string | null;
  selectedSiteId: string | null;
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
    // 1. Fetch branches
    const { data: branchesData } = await supabase
      .from("branches")
      .select("id, name, location, status")
      .is("deleted_at", null)
      .order("name");

    // 2. Fetch work locations (sites) — kept in the combined list so
    //    attendance and other pages can use them, but they are tagged is_site=true.
    const { data: locationsData } = await supabase
      .from("work_locations")
      .select("id, name, branch_id, description")
      .is("deleted_at", null);

    if (branchesData) {
      const sitesList = (locationsData || []).map((loc) => ({
        id: `site:${loc.id}`,
        name: loc.name,
        location: loc.description,
        status: "active",
        branch_id: loc.branch_id,
        is_site: true as const,
      }));

      // Pure branches sorted alphabetically (sites come after, separately)
      const sortedBranches = [...branchesData].sort((a, b) =>
        (a.name || "").localeCompare(b.name || "")
      );

      // Combined: branches first, then sites
      const combined: BranchInfo[] = [...sortedBranches, ...sitesList];
      setBranches(combined);
    }
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
    // Super Admin can select anything
    if (isSuperAdmin) {
      if (storedBranchId && branches.some((b) => b.id === storedBranchId)) {
        return storedBranchId;
      }
      if (userBranchId && branches.some((b) => b.id === userBranchId)) {
        return userBranchId;
      }
      return branches[0]?.id || "";
    }

    // Non-Super-Admin: locked to their own branch or any of their branch's sites
    if (storedBranchId && branches.some((b) => b.id === storedBranchId && (b.id === userBranchId || b.branch_id === userBranchId))) {
      return storedBranchId;
    }
    return userBranchId || branches[0]?.id || "";
  }, [isSuperAdmin, userBranchId, storedBranchId, branches]);

  const setSelectedBranchId = useCallback(
    (id: string) => {
      // Super Admin can set any branch/site
      if (isSuperAdmin) {
        setStoredBranchId(id);
        localStorage.setItem("hrm_selected_branch_id", id);
        return;
      }
      // Non-Super-Admin can only select their own branch or their branch's sites
      const allowed = branches.some((b) => b.id === id && (b.id === userBranchId || b.branch_id === userBranchId));
      if (allowed) {
        setStoredBranchId(id);
        localStorage.setItem("hrm_selected_branch_id", id);
      }
    },
    [isSuperAdmin, branches, userBranchId]
  );

  const effectiveBranchId = useMemo(() => {
    const rawId = selectedBranchId;
    if (rawId && rawId.startsWith("site:")) {
      const siteObj = branches.find((b) => b.id === rawId);
      return siteObj?.branch_id || null;
    }
    return rawId || null;
  }, [selectedBranchId, branches]);

  const selectedSiteId = useMemo(() => {
    if (selectedBranchId && selectedBranchId.startsWith("site:")) {
      return selectedBranchId.substring(5);
    }
    return null;
  }, [selectedBranchId]);

  const targetBranch = useMemo(() => {
    if (isSuperAdmin) {
      return effectiveBranchId;
    }
    return userBranchId;
  }, [isSuperAdmin, effectiveBranchId, userBranchId]);

  const visibleBranches = useMemo(() => {
    if (isSuperAdmin) {
      // Super admin only sees real branches in the switcher (not work sites).
      // Work sites are accessible via the attendance page's own site filter.
      return branches.filter((b) => !b.is_site);
    }
    // Branch admin sees their own branch + their branch's sites
    return branches.filter((b) => b.id === userBranchId || b.branch_id === userBranchId);
  }, [isSuperAdmin, branches, userBranchId]);

  const isPartnerBranchBlocked = useMemo(() => {
    if (isSuperAdmin) return false;
    return !userBranchId;
  }, [isSuperAdmin, userBranchId]);

  const effectiveBranchName = useMemo(() => {
    if (!effectiveBranchId) return "Select Branch";
    const found = branches.find((b) => b.id === selectedBranchId);
    return found?.name || userBranchName || "Selected Branch";
  }, [effectiveBranchId, selectedBranchId, branches, userBranchName]);

  const isBranchScoped = Boolean(effectiveBranchId);

  const value = useMemo(
    () => ({
      branches,
      visibleBranches,
      loading,
      userBranchId,
      userBranchName,
      selectedBranchId,
      setSelectedBranchId,
      effectiveBranchId,
      effectiveBranchName,
      selectedSiteId,
      targetBranch,
      isPartnerBranchBlocked,
      isSuperAdmin,
      isBranchAdmin,
      isBranchScoped,
      refreshBranches: fetchBranches,
    }),
    [
      branches,
      visibleBranches,
      loading,
      userBranchId,
      userBranchName,
      selectedBranchId,
      setSelectedBranchId,
      effectiveBranchId,
      effectiveBranchName,
      selectedSiteId,
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

