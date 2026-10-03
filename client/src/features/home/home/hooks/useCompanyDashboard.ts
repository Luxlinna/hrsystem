import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { useBranchScope } from "@/context/BranchContext";
import type { DateRange } from "../types";
import { useCompanyDashboardData } from "./useCompanyDashboardData";
import { usePullToRefresh } from "./usePullToRefresh";

const PULL_THRESHOLD = 70;

export function useCompanyDashboard() {
  const { user } = useAuth();
  const { can } = usePermissions();
  const { isPartnerBranchBlocked, userBranchName, userBranchId, effectiveBranchId } = useBranchScope();

  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);

  const [dateRange, setDateRange] = useState<DateRange>({ from: firstDay, to: lastDay, label: "This Month" });
  const [fabOpen, setFabOpen] = useState(false);
  const fabRef = useRef<HTMLDivElement>(null);

  const targetBranch = effectiveBranchId || userBranchId;

  const data = useCompanyDashboardData({
    userId: user?.id,
    isPartnerBranchBlocked,
    targetBranch,
    dateRange,
  });

  const { isPulling, pullDistance, handleTouchStart, handleTouchMove, handleTouchEnd } =
    usePullToRefresh(data.handleRefresh);

  // Close FAB on outside click
  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (fabRef.current && !fabRef.current.contains(e.target as Node)) {
      setFabOpen(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [handleClickOutside]);

  return {
    user,
    can,
    isPartnerBranchBlocked,
    userBranchName,
    userBranchId,
    stats: data.stats,
    onboarding: data.onboarding,
    leaveRequests: data.leaveRequests,
    notifications: data.notifications,
    jobs: data.jobs,
    candidates: data.candidates,
    announcements: data.announcements,
    loading: data.loading,
    refreshing: data.refreshing,
    deptData: data.deptData,
    lastUpdated: data.lastUpdated,
    hrKpis: data.hrKpis,
    attendanceData: data.attendanceData,
    hiringTrend: data.hiringTrend,
    dateRange,
    setDateRange,
    fabOpen,
    setFabOpen,
    fabRef,
    handleRefresh: data.handleRefresh,
    isPulling,
    pullDistance,
    PULL_THRESHOLD,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  };
}
