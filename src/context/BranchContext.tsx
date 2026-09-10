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
    return saved ? saved : "";
  });

  const isSuperAdmin = useMemo(() => {
    return isSuperRole || role?.name === "Super Admin" || role?.allowed_modules.includes("*");
  }, [isSuperRole, role]);

  const isBranchAdmin = useMemo(() => {
    if (isSuperAdmin) return false;
    const roleName = (role?.name || "").trim().toLowerCase();
    return (
      /(branch|bu)\s*.*admin/i.test(roleName) ||
      /(branch|bu)\s*ceo/i.test(roleName) ||
      (role?.allowed_modules.includes("admin") ?? false)
    );
  }, [isSuperAdmin, role]);

  const isHrDivision = useMemo(() => {
    if (isSuperAdmin) return true;
    if (isBranchAdmin) return false;
    const isHrBranch =
      /hr\s*division|human\s*resource/i.test(userBranchName || "") ||
      /hr\s*division|human\s*resource/i.test(userSiteName || "");
    const hasHrPermissions = Boolean(
      role?.hiring_requests_hr_admin_approve ||
      role?.hiring_requests_hr_review ||
      role?.hiring_requests_chairman_approve
    );
    return hasHrPermissions || isHrBranch;
  }, [userBranchName, userSiteName, role, isSuperAdmin, isBranchAdmin]);

  const selectedBranchId = useMemo(() => {
    if (isBranchAdmin && userBranchId) {
      if (storedBranchId && branches.some((b) => b.id === storedBranchId && (b.id === userBranchId || b.branch_id === userBranchId))) {
        return storedBranchId;
      }
      return userBranchId;
    }
    if (isSuperAdmin || isHrDivision) {
      if (storedBranchId === "all") return "all";
      if (storedBranchId && branches.some((b) => b.id === storedBranchId)) return storedBranchId;
      if (userBranchId && branches.some((b) => b.id === userBranchId)) return userBranchId;
      return branches[0]?.id || "";
    }
    if (storedBranchId && branches.some((b) => b.id === storedBranchId && (b.id === userBranchId || b.branch_id === userBranchId))) {
      return storedBranchId;
    }
    return userBranchId || branches[0]?.id || "";
  }, [isBranchAdmin, isSuperAdmin, isHrDivision, userBranchId, storedBranchId, branches]);

  const setSelectedBranchId = useCallback(
    (id: string) => {
      if (isSuperAdmin || isHrDivision) {
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
    [isSuperAdmin, isHrDivision, branches, userBranchId]
  );

  const effectiveBranchId = useMemo(() => {
    if (selectedBranchId === "all") return null;
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

  // Global ERP modules remain strictly scoped to user's branch unless Super Admin or HR Division.
  // Cross-branch workflows for HR Division are localized solely to Hire, Onboarding, Checklist, and Meeting Rooms.
  const targetBranch = useMemo(() => {
    return (isSuperAdmin || isHrDivision) ? effectiveBranchId : userBranchId;
  }, [isSuperAdmin, isHrDivision, effectiveBranchId, userBranchId]);

  const visibleBranches = useMemo(() => {
    if (isSuperAdmin || isHrDivision) {
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
  }, [isSuperAdmin, isHrDivision, branches, userBranchId]);

  const isPartnerBranchBlocked = useMemo(() => {
    if (isSuperAdmin || isHrDivision) return false;
    return !userBranchId;
  }, [isSuperAdmin, isHrDivision, userBranchId]);

  const effectiveBranchName = useMemo(() => {
    if (selectedBranchId === "all") return "All Branches";
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
      isHrDivision,
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
      isHrDivision,
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
