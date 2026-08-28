import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { useBranchScope } from "@/context/BranchContext";
import { toast } from "@/components/Toast";
import { formatDate, calculateHours } from "../utils";
import type {
  Shift,
  ShiftAssignment,
  Branch,
  Employee,
  ViewMode,
  QuickFilter,
  DensityMode,
  ShiftForm,
  DaySummary,
} from "../types";

export function useShiftState() {
  const { user } = useAuth();
  const { isSuperAdmin, effectiveBranchId, userBranchId } = useBranchScope();
  const actorName =
    (user?.user_metadata?.display_name as string) || user?.email || "Unknown";

  // Core data
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [assignments, setAssignments] = useState<ShiftAssignment[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  // Navigation & View
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [density, setDensity] = useState<DensityMode>("comfortable");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterBranch, setFilterBranch] = useState("all");
  const [filterDept, setFilterDept] = useState("all");
  const [quickFilter, setQuickFilter] = useState<QuickFilter>("all");

  // Selection & Modals
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [selectedShiftIds, setSelectedShiftIds] = useState<string[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showCopyWeekModal, setShowCopyWeekModal] = useState(false);
  const [showWorkloadDrawer, setShowWorkloadDrawer] = useState(false);
  const [copyIncludeStaff, setCopyIncludeStaff] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Forms
  const [shiftForm, setShiftForm] = useState<ShiftForm>({
    name: "",
    branch_id: "",
    department: "",
    start_time: "09:00",
    end_time: "17:00",
    shift_date: formatDate(new Date()),
    capacity: 5,
    color: "#253C7D",
    notes: "",
  });
  const [duplicateDate, setDuplicateDate] = useState(formatDate(new Date()));
  const [assignEmployeeIds, setAssignEmployeeIds] = useState<string[]>([]);
  const [assignSearch, setAssignSearch] = useState("");
  const [assignDeptFilter, setAssignDeptFilter] = useState("all");

  const loadData = useCallback(async () => {
    try {
      const targetBranch = effectiveBranchId || (!isSuperAdmin ? userBranchId : null);

      let shiftQuery = supabase
        .from("shifts")
        .select("*, branches(name, location)")
        .is("deleted_at", null)
        .order("shift_date")
        .order("start_time");

      if (targetBranch) {
        shiftQuery = shiftQuery.eq("branch_id", targetBranch);
      }

      let empQuery = supabase
        .from("employees")
        .select("id, first_name, last_name, department, role, avatar_url, branch_id")
        .is("deleted_at", null)
        .order("first_name");

      if (targetBranch) {
        empQuery = empQuery.eq("branch_id", targetBranch);
      }

      let branchQuery = supabase.from("branches").select("id, name, location").order("name");
      if (targetBranch) {
        branchQuery = branchQuery.eq("id", targetBranch);
      }

      const [{ data: s, error: sErr }, { data: a, error: aErr }, { data: b }, { data: e }] =
        await Promise.all([
          shiftQuery,
          supabase.from("shift_assignments").select("*, employee:employees(first_name, last_name, role, department, avatar_url, branch_id)").is("deleted_at", null),
          branchQuery,
          empQuery,
        ]);

      if (sErr) throw sErr;
      if (aErr) throw aErr;

      const rawShifts = s || [];
      const shiftIds = new Set(rawShifts.map((sh) => sh.id));
      const filteredAssignments = targetBranch
        ? (a || []).filter((x: any) => shiftIds.has(x.shift_id) || x.employee?.branch_id === targetBranch)
        : (a || []);

      const shiftList = rawShifts.map((sh) => ({
        ...sh,
        assignmentCount: filteredAssignments.filter((x: any) => x.shift_id === sh.id).length,
      }));

      setShifts(shiftList);
      setAssignments(filteredAssignments);
      setBranches(b || []);
      setEmployees(e || []);

      if (selectedShift) {
        const updated = shiftList.find((sh) => sh.id === selectedShift.id);
        setSelectedShift(updated || null);
      }
    } catch (err) {
      console.error("Failed to load shift data:", err);
      toast("Error", "Could not load shift schedules", "error");
    } finally {
      setLoading(false);
    }
  }, [effectiveBranchId, isSuperAdmin, userBranchId, selectedShift]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadData(); }, [effectiveBranchId]);

  // Derived: departments
  const departments = useMemo(() => {
    const fromShifts = shifts.map((s) => s.department).filter(Boolean);
    const fromEmployees = employees.map((e) => e.department).filter(Boolean);
    return [...new Set([...fromShifts, ...fromEmployees])].sort();
  }, [shifts, employees]);

  // Derived: filtered shifts
  const filteredShifts = useMemo(() => {
    return shifts.filter((sh) => {
      const matchBranch = filterBranch === "all" || sh.branch_id === filterBranch;
      const matchDept = filterDept === "all" || sh.department === filterDept;
      const assignedCount = sh.assignmentCount ?? 0;
      let matchQuick = true;
      if (quickFilter === "open") matchQuick = assignedCount < sh.capacity;
      else if (quickFilter === "filled") matchQuick = assignedCount >= sh.capacity;
      if (!matchBranch || !matchDept || !matchQuick) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = sh.name?.toLowerCase().includes(q);
        const matchDepartment = sh.department?.toLowerCase().includes(q);
        const matchBranchName = sh.branches?.name?.toLowerCase().includes(q);
        const matchNotes = sh.notes?.toLowerCase().includes(q);
        const shiftAssignedEmp = assignments
          .filter((a) => a.shift_id === sh.id)
          .some((a) =>
            `${a.employee?.first_name || ""} ${a.employee?.last_name || ""} ${a.employee?.role || ""}`
              .toLowerCase().includes(q)
          );
        return matchName || matchDepartment || matchBranchName || matchNotes || shiftAssignedEmp;
      }
      return true;
    });
  }, [shifts, filterBranch, filterDept, quickFilter, searchQuery, assignments]);

  const getShiftsForDay = (date: Date): Shift[] => {
    const dateStr = formatDate(date);
    return filteredShifts.filter((s) => s.shift_date === dateStr);
  };

  const getDaySummary = (date: Date): DaySummary => {
    const dayShifts = getShiftsForDay(date);
    const totalCapacity = dayShifts.reduce((sum, s) => sum + (s.capacity || 1), 0);
    const totalAssigned = dayShifts.reduce((sum, s) => sum + (s.assignmentCount || 0), 0);
    const totalHours = dayShifts.reduce((sum, s) => sum + calculateHours(s.start_time, s.end_time), 0);
    return { count: dayShifts.length, totalCapacity, totalAssigned, totalHours };
  };

  const weekDates = useMemo(() => {
    const d = new Date(currentDate);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));
    return Array.from({ length: 7 }, (_, i) => {
      const dd = new Date(monday);
      dd.setDate(monday.getDate() + i);
      return dd;
    });
  }, [currentDate]);

  const weekShifts = useMemo(() => {
    const startStr = formatDate(weekDates[0]);
    const endStr = formatDate(weekDates[6]);
    return filteredShifts.filter((s) => s.shift_date >= startStr && s.shift_date <= endStr);
  }, [filteredShifts, weekDates]);

  // KPIs
  const kpiTotalShiftsThisWeek = weekShifts.length;
  const kpiTotalWeeklyCapacity = weekShifts.reduce((acc, s) => acc + (s.capacity || 1), 0);
  const kpiTotalWeeklyAssigned = weekShifts.reduce((acc, s) => acc + (s.assignmentCount || 0), 0);
  const kpiTotalWeeklyHours = weekShifts.reduce((acc, s) => acc + calculateHours(s.start_time, s.end_time), 0);
  const kpiTotalOpenSpots = Math.max(0, kpiTotalWeeklyCapacity - kpiTotalWeeklyAssigned);
  const kpiCoveragePercentage = kpiTotalWeeklyCapacity > 0
    ? Math.round((kpiTotalWeeklyAssigned / kpiTotalWeeklyCapacity) * 100)
    : 100;

  const totalOpenShiftsCount = shifts.filter((s) => (s.assignmentCount || 0) < s.capacity).length;
  const totalFilledShiftsCount = shifts.filter((s) => (s.assignmentCount || 0) >= s.capacity).length;

  // Staff Workload
  const staffWorkload = useMemo(() => {
    const startStr = formatDate(weekDates[0]);
    const endStr = formatDate(weekDates[6]);
    const currentWeekShiftIds = shifts
      .filter((s) => s.shift_date >= startStr && s.shift_date <= endStr)
      .map((s) => s.id);
    const weekAssignments = assignments.filter((a) => currentWeekShiftIds.includes(a.shift_id));

    return employees.map((emp) => {
      const empAssignments = weekAssignments.filter((a) => a.employee_id === emp.id);
      const totalHours = empAssignments.reduce((acc, a) => {
        const sh = shifts.find((s) => s.id === a.shift_id);
        return acc + (sh ? calculateHours(sh.start_time, sh.end_time) : 0);
      }, 0);
      return {
        employee: emp,
        shiftCount: empAssignments.length,
        totalHours: Math.round(totalHours * 10) / 10,
        isOvertime: totalHours > 40,
        isFullTime: totalHours >= 35 && totalHours <= 40,
        isUnscheduled: totalHours === 0,
      };
    }).sort((a, b) => b.totalHours - a.totalHours);
  }, [shifts, assignments, employees, weekDates]);

  const selectedShiftAssignments = useMemo(() => {
    if (!selectedShift) return [];
    return assignments.filter((a) => a.shift_id === selectedShift.id);
  }, [assignments, selectedShift]);

  const remainingSpots = selectedShift
    ? Math.max(0, selectedShift.capacity - selectedShiftAssignments.length)
    : 0;
  const isSelectedShiftFull = selectedShift
    ? selectedShiftAssignments.length >= selectedShift.capacity
    : false;

  const checkEmployeeConflict = (employeeId: string, shiftDate: string, excludeShiftId: string) => {
    return assignments.some((a) => {
      if (a.employee_id !== employeeId || a.shift_id === excludeShiftId) return false;
      const sh = shifts.find((s) => s.id === a.shift_id);
      return sh && sh.shift_date === shiftDate;
    });
  };

  // Reset assign modal state on close
  useEffect(() => {
    if (!showAssignModal) {
      setAssignSearch("");
      setAssignDeptFilter("all");
      setAssignEmployeeIds([]);
    }
  }, [showAssignModal]);

  return {
    actorName,
    // Data
    shifts, assignments, branches, employees, loading, departments,
    // Navigation & View
    currentDate, setCurrentDate, viewMode, setViewMode,
    density, setDensity, searchQuery, setSearchQuery,
    filterBranch, setFilterBranch, filterDept, setFilterDept,
    quickFilter, setQuickFilter,
    // Selection & Modals
    selectedShift, setSelectedShift, selectedShiftIds, setSelectedShiftIds,
    showCreateModal, setShowCreateModal, showEditModal, setShowEditModal,
    showDuplicateModal, setShowDuplicateModal, showDeleteConfirm, setShowDeleteConfirm,
    showAssignModal, setShowAssignModal, showCopyWeekModal, setShowCopyWeekModal,
    showWorkloadDrawer, setShowWorkloadDrawer,
    copyIncludeStaff, setCopyIncludeStaff, submitting, setSubmitting,
    // Forms
    shiftForm, setShiftForm, duplicateDate, setDuplicateDate,
    assignEmployeeIds, setAssignEmployeeIds,
    assignSearch, setAssignSearch, assignDeptFilter, setAssignDeptFilter,
    // Derived
    filteredShifts, getShiftsForDay, getDaySummary,
    weekDates, weekShifts,
    // KPIs
    kpiTotalShiftsThisWeek, kpiTotalWeeklyCapacity, kpiTotalWeeklyAssigned,
    kpiTotalWeeklyHours, kpiTotalOpenSpots, kpiCoveragePercentage,
    totalOpenShiftsCount, totalFilledShiftsCount,
    // Workload & Selected
    staffWorkload, selectedShiftAssignments, remainingSpots, isSelectedShiftFull,
    // Helpers
    checkEmployeeConflict, loadData,
  };
}
