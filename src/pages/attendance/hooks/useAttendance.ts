import { useState, useMemo, useCallback, useEffect } from "react";
import { usePermissions } from "@/hooks/usePermissions";
import { useBranchScope } from "@/context/BranchContext";
import { useMyEmployee } from "@/hooks/useMyEmployee";
import { toYMD, todayYMD as todayYMDLib } from "@/lib/date";
import type { AttendanceRecord, NewRecordForm, Employee } from "../types";
import { useAttendanceData } from "./useAttendanceData";
import { useAttendanceFilters } from "./useAttendanceFilters";
import { useAttendanceMetrics } from "./useAttendanceMetrics";
import { useAttendanceMutations } from "./useAttendanceMutations";
import { useHolidays } from "@/hooks/useHolidays";

export function useAttendance() {
  const { role, isAdmin, loading: permsLoading, can } = usePermissions();
  const { isSuperAdmin, isBranchAdmin, userBranchName, userBranchId, effectiveBranchName, isPartnerBranchBlocked } = useBranchScope();
  const { employee: currentEmp } = useMyEmployee();

  const roleName = (role?.name || "").toLowerCase();
  const canViewAllBranches = isSuperAdmin || !!role?.attendance_view_all_employees;

  const isRoleOrTitleManager = useMemo(() => {
    const rName = (role?.name || "").trim().toLowerCase();
    if (rName === "employee" || rName === "staff" || rName === "user") {
      return false;
    }
    const empTitle = (currentEmp?.role || "").trim().toLowerCase();
    if (empTitle === "employee" || empTitle === "staff") {
      return false;
    }
    return (
      /manager|lead|director|chief|president|head\b/i.test(rName) ||
      /manager|lead|director|supervisor|head\b/i.test(empTitle)
    );
  }, [role?.name, currentEmp?.role]);

  // Super Admin, BU Admin, or Department/Branch Manager
  const isSuperOrAdminOrManager =
    isSuperAdmin ||
    isAdmin ||
    isBranchAdmin ||
    role?.is_admin ||
    role?.allowed_modules?.includes("*") ||
    isRoleOrTitleManager;

  // An employee can see ONLY their own records.
  // Leader/management viewing is strictly restricted to managers and admins.
  const isLeader =
    isSuperOrAdminOrManager &&
    (!isPartnerBranchBlocked || canViewAllBranches);

  const canManage = isLeader;
  const canViewAll = isLeader;
  const todayYMD = todayYMDLib();

  const data = useAttendanceData(isLeader, canViewAllBranches, currentEmp as unknown as Employee);
  const { fetchData } = data;

  const isManager = useMemo(() => {
    const rName = (role?.name || "").trim().toLowerCase();
    if (rName === "employee" || rName === "staff" || rName === "user") {
      return false;
    }
    const myRole = (data.myEmployee?.role || currentEmp?.role || "").trim().toLowerCase();
    if (myRole === "employee" || myRole === "staff") {
      return false;
    }
    return (
      isRoleOrTitleManager ||
      /manager|lead|director|supervisor|head\b/i.test(myRole)
    );
  }, [isRoleOrTitleManager, role?.name, data.myEmployee?.role, currentEmp?.role]);

  const canAccessOvertime = useMemo(() => {
    if (isPartnerBranchBlocked) return false;

    // Super Admin
    if (isSuperAdmin || isAdmin || role?.is_admin || role?.allowed_modules?.includes("*")) {
      return true;
    }

    // BU Admin
    if (isBranchAdmin || /(branch|bu)\s*.*admin/i.test(roleName) || /(branch|bu)\s*ceo/i.test(roleName)) {
      return true;
    }

    // Role permission: explicitly enabled by Admin for this role
    if (role?.allowed_modules?.includes("overtime") || can("overtime")) {
      return true;
    }

    // Manager
    if (isManager) {
      return true;
    }

    // Regular employees cannot access or request overtime
    return false;
  }, [isPartnerBranchBlocked, isSuperAdmin, isAdmin, role, isBranchAdmin, roleName, can, isManager]);

  const canManageOvertimeSettings = useMemo(() => {
    return (
      isSuperAdmin ||
      isAdmin ||
      isBranchAdmin ||
      /admin|ceo|director|head|hr\s*manager|chief|president/i.test(roleName)
    );
  }, [isSuperAdmin, isAdmin, isBranchAdmin, roleName]);

  useEffect(() => {
    if (permsLoading) return;
    fetchData();
  }, [permsLoading, fetchData]);

  // Strict client-side guarantee: if not a leader/manager, employee sees ONLY their own records
  const visibleRecords = useMemo(() => {
    if (isLeader) return data.records;
    const myId = data.myEmployee?.id || currentEmp?.id;
    if (!myId) return data.records;
    return data.records.filter((r) => r.employee_id === myId);
  }, [isLeader, data.records, data.myEmployee?.id, currentEmp?.id]);

  const visibleEmployees = useMemo(() => {
    if (isLeader) return data.employees;
    const emp = data.myEmployee || (currentEmp as unknown as Employee);
    if (!emp) return data.employees;
    return [emp];
  }, [isLeader, data.employees, data.myEmployee, currentEmp]);

  const scopedData = useMemo(() => {
    return {
      ...data,
      records: visibleRecords,
      employees: visibleEmployees,
    };
  }, [data, visibleRecords, visibleEmployees]);

  const filters = useAttendanceFilters(visibleRecords, visibleEmployees, todayYMD);

  const currentBranchName =
    effectiveBranchName && effectiveBranchName !== "Select Branch" && effectiveBranchName !== "Selected Branch"
      ? effectiveBranchName
      : userBranchName || scopedData.employees[0]?.branches?.name || "Main Office";

  const holidaysState = useHolidays(data.targetBranch);

  const metrics = useAttendanceMetrics({
    records: visibleRecords,
    employees: visibleEmployees,
    workLocations: data.workLocations,
    activeScopeRecords: filters.activeScopeRecords,
    todayYMD,
    branchName: currentBranchName,
    rosterDate: filters.rosterDate,
    matrixMonth: filters.matrixMonth,
    filterDepartment: filters.filterDepartment,
    searchQuery: filters.searchQuery,
    holidays: holidaysState.holidays,
  });

  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);
  const [showLogModal, setShowLogModal] = useState(false);

  const mutations = useAttendanceMutations({
    employees: data.employees,
    fetchData: data.fetchData,
    setSelectedRecord,
    setEditingRecord,
    selectedRecord,
  });

  const [newRecord, setNewRecord] = useState<NewRecordForm>({
    employee_id: "",
    date: toYMD(new Date()),
    clock_in: "08:00",
    clock_out: "17:00",
    status: "ontime",
    late_minutes: 0,
    notes: "",
    work_location_id: "",
  });

  const myTodayRecord = useMemo(() => {
    if (!data.myEmployee) return null;
    return data.records.find((r) => r.employee_id === data.myEmployee?.id && r.date === todayYMD) || null;
  }, [data.myEmployee, data.records, todayYMD]);

  const openLogModal = useCallback(() => {
    if (!canViewAll) setNewRecord((p) => ({ ...p, employee_id: data.myEmployee?.id || "" }));
    setShowLogModal(true);
  }, [canViewAll, data.myEmployee?.id]);

  const handleSaveNewRecord = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await mutations.handleSaveNewRecord(newRecord);
    if (ok) {
      setShowLogModal(false);
      setNewRecord({
        employee_id: "",
        date: todayYMD,
        clock_in: "08:00",
        clock_out: "17:00",
        status: "ontime",
        late_minutes: 0,
        notes: "",
        work_location_id: "",
      });
    }
  }, [mutations, newRecord, todayYMD]);

  const handleUpdateRecord = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingRecord) {
      await mutations.handleUpdateRecord(editingRecord);
    }
  }, [mutations, editingRecord]);

  const isFourPunchMode = useMemo(() => {
    const devices = data.biometricDevices || [];
    // Only branches with registered biometric fingerprint machine scan devices can use 4-punch mode
    if (devices.length === 0) return false;

    // If filtering by specific work location:
    if (filters.filterWorkLocation && filters.filterWorkLocation !== "all") {
      if (filters.filterWorkLocation === "main") {
        return devices.some((d) => !d.work_location_id);
      }
      const site = data.workLocations.find((wl) => wl.id === filters.filterWorkLocation);
      const siteAgreed = site ? Boolean(site.is_four_punch_enabled) : false;
      const hasDevice = devices.some((d) => d.work_location_id === filters.filterWorkLocation);
      return siteAgreed && hasDevice;
    }

    // When viewing all locations in a branch, check if the site with a machine explicitly agrees with 4 punches
    const hasAgreed4PunchSite = data.workLocations.some(
      (wl) => wl.is_four_punch_enabled && devices.some((d) => !d.work_location_id || d.work_location_id === wl.id)
    );
    return hasAgreed4PunchSite;
  }, [data.biometricDevices, data.workLocations, filters.filterWorkLocation]);

  return {
    canManage,
    canViewAll,
    canAccessOvertime,
    canManageOvertimeSettings,
    todayYMD,
    userBranchName,
    userBranchId,
    isFourPunchMode,
    selectedRecord,
    setSelectedRecord,
    editingRecord,
    setEditingRecord,
    showLogModal,
    setShowLogModal,
    newRecord,
    setNewRecord,
    myTodayRecord,
    data: scopedData,
    filters,
    metrics,
    mutations,
    holidays: holidaysState.holidays,
    holidaysState,
    openLogModal,
    handleSaveNewRecord,
    handleUpdateRecord,
  };
}
