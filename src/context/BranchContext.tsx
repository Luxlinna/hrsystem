/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import type { BranchInfo, BranchContextType } from "./branchTypes";
import { useBranchData } from "./useBranchData";

export type { BranchInfo, BranchContextType };

const BranchContext = createContext<BranchContextType | undefined>(undefined);

export function BranchProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { role, isAdmin: isSuperRole } = usePermissions();
  const { branches, loading, userBranchId, userBranchName, userSiteId, userSiteName, fetchBranches } = useBranchData(user?.email);

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

  const selectedBranchId = useMemo(() => {
    if (isSuperAdmin) {
      if (storedBranchId && branches.some((b) => b.id === storedBranchId)) return storedBranchId;
      if (userBranchId && branches.some((b) => b.id === userBranchId)) return userBranchId;
      return branches[0]?.id || "";
    }
    if (storedBranchId && branches.some((b) => b.id === storedBranchId && (b.id === userBranchId || b.branch_id === userBranchId))) {
      return storedBranchId;
    }
    return userBranchId || branches[0]?.id || "";
  }, [isSuperAdmin, userBranchId, storedBranchId, branches]);

  const setSelectedBranchId = useCallback(
    (id: string) => {
      if (isSuperAdmin) {
        setStoredBranchId(id);
        localStorage.setItem("hrm_selected_branch_id", id);
        return;
      }
      const allowed = branches.some((b) => b.id === id && (b.id === userBranchId || b.branch_id === userBranchId));
      if (allowed) {
        setStoredBranchId(id);
        localStorage.setItem("hrm_selected_branch_id", id);
      }
    },
    [isSuperAdmin, branches, userBranchId]
  );

  const effectiveBranchId = useMemo(() => {
    if (selectedBranchId && selectedBranchId.startsWith("site:")) {
      const siteObj = branches.find((b) => b.id === selectedBranchId);
      return siteObj?.branch_id || null;
    }
    return selectedBranchId || null;
  }, [selectedBranchId, branches]);

  const selectedSiteId = useMemo(() => {
    if (selectedBranchId && selectedBranchId.startsWith("site:")) {
      return selectedBranchId.substring(5);
    }
    return null;
  }, [selectedBranchId]);

  const targetBranch = useMemo(() => {
    return isSuperAdmin ? effectiveBranchId : userBranchId;
  }, [isSuperAdmin, effectiveBranchId, userBranchId]);

  const visibleBranches = useMemo(() => {
    if (isSuperAdmin) {
      const pureBranches = branches.filter((b) => !b.is_site);
      const sites = branches.filter((b) => b.is_site);
      const result: BranchInfo[] = [];
      pureBranches.forEach((branch) => {
        result.push(branch);
        result.push(...sites.filter((s) => s.branch_id === branch.id));
      });
      return result;
    }
    return branches.filter((b) => b.id === userBranchId || b.branch_id === userBranchId);
  }, [isSuperAdmin, branches, userBranchId]);

  const isPartnerBranchBlocked = useMemo(() => {
    if (isSuperAdmin) return false;
    return !userBranchId;
  }, [isSuperAdmin, userBranchId]);

  const effectiveBranchName = useMemo(() => {
    if (!effectiveBranchId) return "Select Branch";
    const found = branches.find((b) => b.id === selectedBranchId);
    return found?.name || userSiteName || userBranchName || "Selected Branch";
  }, [effectiveBranchId, selectedBranchId, branches, userSiteName, userBranchName]);

  const isBranchScoped = Boolean(effectiveBranchId);

  const value = useMemo(
    () => ({
      branches,
      visibleBranches,
      loading,
      userBranchId,
      userBranchName,
      userSiteId,
      userSiteName,
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
      userSiteId,
      userSiteName,
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

export const useBranch = useBranchScope;
