import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { useBranchScope } from "@/context/BranchContext";
import type { DateRange } from "../types";
import { useCompanyDashboardData } from "./useCompanyDashboardData";
import { usePullToRefresh } from "./usePullToRefresh";

function todayStr() {
  return new Date().toISOString().split("T")[0];
}
function daysAgoStr(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
}

export function useCompanyDashboard() {
  const { user } = useAuth();
  const { can } = usePermissions();
  const { effectiveBranchId, userBranchId, userBranchName, targetBranch, isPartnerBranchBlocked } = useBranchScope();

  const [dateRange, setDateRange] = useState<DateRange>({
    from: daysAgoStr(30),
    to: todayStr(),
    label: "Last 30 Days",
  });

  const data = useCompanyDashboardData({
    userId: user?.id,
    isPartnerBranchBlocked,
    targetBranch,
    dateRange,
  });

  const pull = usePullToRefresh(data.handleRefresh);

  const [fabOpen, setFabOpen] = useState(false);
  const fabRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (fabRef.current && !fabRef.current.contains(e.target as Node)) {
        setFabOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return {
    user,
    can,
    isPartnerBranchBlocked,
    userBranchId,
    userBranchName,
    targetBranch,
    stats: data.stats,
    employees: data.employees,
    onboarding: data.onboarding,
    leaveRequests: data.leaveRequests,
    payroll: data.payroll,
    notifications: data.notifications,
    jobs: data.jobs,
    candidates: data.candidates,
    announcements: data.announcements,
    loading: data.loading,
    refreshing: data.refreshing,
    deptData: data.deptData,
    lastUpdated: data.lastUpdated,
    isPulling: pull.isPulling,
    pullDistance: pull.pullDistance,
    PULL_THRESHOLD: pull.PULL_THRESHOLD,
    hrKpis: data.hrKpis,
    attendanceData: data.attendanceData,
    hiringTrend: data.hiringTrend,
    dateRange,
    setDateRange,
    fabOpen,
    setFabOpen,
    fabRef,
    handleRefresh: data.handleRefresh,
    handleTouchStart: pull.handleTouchStart,
    handleTouchMove: pull.handleTouchMove,
    handleTouchEnd: pull.handleTouchEnd,
  };
}
