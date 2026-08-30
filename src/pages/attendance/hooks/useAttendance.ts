import { useState, useMemo, useCallback, useEffect } from "react";
import { usePermissions } from "@/hooks/usePermissions";
import { useBranchScope } from "@/context/BranchContext";
import { toYMD, todayYMD as todayYMDLib } from "@/lib/date";
import type { AttendanceRecord, NewRecordForm } from "../types";
import { useAttendanceData } from "./useAttendanceData";
import { useAttendanceFilters } from "./useAttendanceFilters";
import { useAttendanceMetrics } from "./useAttendanceMetrics";
import { useAttendanceMutations } from "./useAttendanceMutations";

export function useAttendance() {
  const { role, isAdmin, loading: permsLoading } = usePermissions();
  const { isSuperAdmin, isBranchAdmin, userBranchName, userBranchId, isPartnerBranchBlocked } = useBranchScope();

  const roleName = (role?.name || "").toLowerCase();
  const isLeader =
    (isSuperAdmin ||
      isBranchAdmin ||
      isAdmin ||
      /manager|lead|head|admin|ceo|director|chief|president|officer/i.test(roleName) ||
      !!role?.attendance_view_all_employees ||
      !!role?.attendance_view_own_branch) &&
    !isPartnerBranchBlocked;

  const canManage = isLeader;
  const canViewAll = isLeader;
  const todayYMD = todayYMDLib();

  const data = useAttendanceData(isLeader);
  const { fetchData } = data;

  useEffect(() => {
    if (permsLoading) return;
    fetchData();
  }, [permsLoading, fetchData]);

  const filters = useAttendanceFilters(data.records, data.employees, todayYMD);

  const metrics = useAttendanceMetrics({
    records: data.records,
    employees: data.employees,
    workLocations: data.workLocations,
    activeScopeRecords: filters.activeScopeRecords,
    todayYMD,
    rosterDate: filters.rosterDate,
    matrixMonth: filters.matrixMonth,
    filterDepartment: filters.filterDepartment,
    searchQuery: filters.searchQuery,
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

  return {
    canManage,
    canViewAll,
    todayYMD,
    userBranchName,
    userBranchId,
    selectedRecord,
    setSelectedRecord,
    editingRecord,
    setEditingRecord,
    showLogModal,
    setShowLogModal,
    newRecord,
    setNewRecord,
    myTodayRecord,
    data,
    filters,
    metrics,
    mutations,
    openLogModal,
    handleSaveNewRecord,
    handleUpdateRecord,
  };
}
