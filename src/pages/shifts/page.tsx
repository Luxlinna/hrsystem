import { useState, useEffect, useMemo, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/components/Toast";

interface Shift {
  id: string;
  name: string;
  branch_id: string;
  department: string;
  start_time: string;
  end_time: string;
  shift_date: string;
  capacity: number;
  color: string;
  notes: string;
  branches?: { name: string; location: string };
  assignmentCount?: number;
}

interface Branch {
  id: string;
  name: string;
  location: string;
}

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  department: string;
  role: string;
  avatar_url?: string | null;
}

interface ShiftAssignment {
  id: string;
  shift_id: string;
  employee_id: string;
  status: string;
  employee?: { first_name: string; last_name: string; role: string; department: string; avatar_url?: string | null };
}

type ViewMode = "week" | "day" | "list" | "month";
type QuickFilter = "all" | "open" | "filled";
type DensityMode = "comfortable" | "compact";

const DAYS_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const PRESET_COLORS = [
  { name: "Navy", value: "#253C7D" },
  { name: "Indigo", value: "#4F46E5" },
  { name: "Sky", value: "#0284C7" },
  { name: "Teal", value: "#0D9488" },
  { name: "Emerald", value: "#059669" },
  { name: "Amber", value: "#D97706" },
  { name: "Rose", value: "#E11D48" },
  { name: "Purple", value: "#7C3AED" },
];

const SHIFT_TEMPLATES = [
  { label: "Morning", name: "Morning Shift", start: "08:00", end: "16:00", color: "#0284C7", capacity: 4 },
  { label: "Standard Day", name: "Standard Day Shift", start: "09:00", end: "17:00", color: "#253C7D", capacity: 5 },
  { label: "Afternoon/Evening", name: "Evening Shift", start: "14:00", end: "22:00", color: "#7C3AED", capacity: 4 },
  { label: "Night Roster", name: "Night Shift", start: "22:00", end: "06:00", color: "#4F46E5", capacity: 3 },
  { label: "Weekend Full", name: "Weekend Shift", start: "10:00", end: "19:00", color: "#D97706", capacity: 6 },
];

const deptColors: Record<string, string> = {
  Operations: "#253C7D",
  Sales: "#29ABE2",
  IT: "#74C8EC",
  Finance: "#8B5CF6",
  Marketing: "#EC4899",
  "Customer Service": "#E07B39",
  HR: "#EF4444",
  Engineering: "#3B82F6",
  Legal: "#6B7280",
};

// Local YYYY-MM-DD
function formatDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getWeekDates(date: Date): Date[] {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  return Array.from({ length: 7 }, (_, i) => {
    const dd = new Date(monday);
    dd.setDate(monday.getDate() + i);
    return dd;
  });
}

function calculateHours(startTime: string, endTime: string): number {
  if (!startTime || !endTime) return 0;
  const [startH, startM] = startTime.split(":").map(Number);
  const [endH, endM] = endTime.split(":").map(Number);
  let startMinutes = startH * 60 + startM;
  let endMinutes = endH * 60 + endM;
  if (endMinutes < startMinutes) {
    endMinutes += 24 * 60; // overnight shift
  }
  return Math.round(((endMinutes - startMinutes) / 60) * 10) / 10;
}

export default function Shifts() {
  const { user } = useAuth();
  const actorName = (user?.user_metadata?.display_name as string) || user?.email || "Unknown";

  const [shifts, setShifts] = useState<Shift[]>([]);
  const [assignments, setAssignments] = useState<ShiftAssignment[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  // Navigation & View state
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [density, setDensity] = useState<DensityMode>("comfortable");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterBranch, setFilterBranch] = useState("all");
  const [filterDept, setFilterDept] = useState("all");
  const [quickFilter, setQuickFilter] = useState<QuickFilter>("all");

  // Selection, Modals & Productivity Drawers
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
  const [shiftForm, setShiftForm] = useState({
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

  const weekDates = useMemo(() => getWeekDates(currentDate), [currentDate]);

  const loadData = async () => {
    try {
      const [{ data: s, error: sErr }, { data: a, error: aErr }, { data: b }, { data: e }] = await Promise.all([
        supabase.from("shifts").select("*, branches(name, location)").is("deleted_at", null).order("shift_date").order("start_time"),
        supabase.from("shift_assignments").select("*, employee:employees(first_name, last_name, role, department, avatar_url)").is("deleted_at", null),
        supabase.from("branches").select("id, name, location").order("name"),
        supabase.from("employees").select("id, first_name, last_name, department, role, avatar_url").order("first_name"),
      ]);

      if (sErr) throw sErr;
      if (aErr) throw aErr;

      const shiftList = (s || []).map((sh) => ({
        ...sh,
        assignmentCount: (a || []).filter((x) => x.shift_id === sh.id).length,
      }));

      setShifts(shiftList);
      setAssignments(a || []);
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
  };

  const departments = useMemo(() => {
    const fromShifts = shifts.map((s) => s.department).filter(Boolean);
    const fromEmployees = employees.map((e) => e.department).filter(Boolean);
    return [...new Set([...fromShifts, ...fromEmployees])].sort();
  }, [shifts, employees]);

  useEffect(() => {
    loadData();
  }, []);

  // Keyboard Shortcuts for Rapid HR Management
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input or textarea
      if (["INPUT", "TEXTAREA", "SELECT"].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.key === "w" || e.key === "W") {
        setViewMode("week");
      } else if (e.key === "d" || e.key === "D") {
        setViewMode("day");
      } else if (e.key === "l" || e.key === "L") {
        setViewMode("list");
      } else if (e.key === "m" || e.key === "M") {
        setViewMode("month");
      } else if (e.key === "c" || e.key === "C") {
        openCreateModal();
      } else if (e.key === "t" || e.key === "T") {
        navigateToday();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (!showAssignModal) {
      setAssignSearch("");
      setAssignDeptFilter("all");
      setAssignEmployeeIds([]);
    }
  }, [showAssignModal]);

  const filteredShifts = useMemo(() => {
    return shifts.filter((sh) => {
      const matchBranch = filterBranch === "all" || sh.branch_id === filterBranch;
      const matchDept = filterDept === "all" || sh.department === filterDept;

      const assignedCount = sh.assignmentCount ?? 0;
      let matchQuick = true;
      if (quickFilter === "open") {
        matchQuick = assignedCount < sh.capacity;
      } else if (quickFilter === "filled") {
        matchQuick = assignedCount >= sh.capacity;
      }

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
              .toLowerCase()
              .includes(q)
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

  const getDaySummary = (date: Date) => {
    const dayShifts = getShiftsForDay(date);
    const totalCapacity = dayShifts.reduce((sum, s) => sum + (s.capacity || 1), 0);
    const totalAssigned = dayShifts.reduce((sum, s) => sum + (s.assignmentCount || 0), 0);
    const totalHours = dayShifts.reduce((sum, s) => sum + calculateHours(s.start_time, s.end_time), 0);
    return { count: dayShifts.length, totalCapacity, totalAssigned, totalHours };
  };

  const weekShifts = useMemo(() => {
    const startStr = formatDate(weekDates[0]);
    const endStr = formatDate(weekDates[6]);
    return filteredShifts.filter((s) => s.shift_date >= startStr && s.shift_date <= endStr);
  }, [filteredShifts, weekDates]);

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

  // Staff Workload Tracker (Hours per employee this week)
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

  const remainingSpots = selectedShift ? Math.max(0, selectedShift.capacity - selectedShiftAssignments.length) : 0;
  const isSelectedShiftFull = selectedShift ? selectedShiftAssignments.length >= selectedShift.capacity : false;

  const checkEmployeeConflict = (employeeId: string, shiftDate: string, excludeShiftId: string) => {
    const sameDayAssignments = assignments.filter((a) => {
      if (a.employee_id !== employeeId || a.shift_id === excludeShiftId) return false;
      const sh = shifts.find((s) => s.id === a.shift_id);
      return sh && sh.shift_date === shiftDate;
    });
    return sameDayAssignments.length > 0;
  };

  const applyTemplate = (tpl: typeof SHIFT_TEMPLATES[0]) => {
    setShiftForm((prev) => ({
      ...prev,
      name: tpl.name,
      start_time: tpl.start,
      end_time: tpl.end,
      color: tpl.color,
      capacity: tpl.capacity,
    }));
    toast("Preset Applied", `Loaded "${tpl.name}" template`, "info");
  };

  const openCreateModal = (presetDate?: string) => {
    setShiftForm({
      name: "Morning Shift",
      branch_id: branches[0]?.id || "",
      department: departments[0] || "Operations",
      start_time: "09:00",
      end_time: "17:00",
      shift_date: presetDate || formatDate(currentDate),
      capacity: 5,
      color: "#253C7D",
      notes: "",
    });
    setShowCreateModal(true);
  };

  const handleCreateShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shiftForm.name.trim() || !shiftForm.shift_date) {
      toast("Validation", "Please fill in all required shift fields", "error");
      return;
    }
    setSubmitting(true);
    const { data, error } = await supabase
      .from("shifts")
      .insert({
        name: shiftForm.name.trim(),
        branch_id: shiftForm.branch_id || null,
        department: shiftForm.department.trim() || null,
        start_time: shiftForm.start_time,
        end_time: shiftForm.end_time,
        shift_date: shiftForm.shift_date,
        capacity: Number(shiftForm.capacity) || 1,
        color: shiftForm.color || "#253C7D",
        notes: shiftForm.notes.trim() || null,
      })
      .select()
      .single();

    setSubmitting(false);
    if (error) {
      toast("Error", "Failed to create shift: " + error.message, "error");
      return;
    }

    toast("Success", `Shift "${shiftForm.name}" created!`, "success");
    setShowCreateModal(false);
    await loadData();
    if (data) {
      setSelectedShift({ ...data, assignmentCount: 0 });
    }
  };

  const openEditModal = (shift: Shift) => {
    setShiftForm({
      name: shift.name,
      branch_id: shift.branch_id || "",
      department: shift.department || "",
      start_time: shift.start_time?.slice(0, 5) || "09:00",
      end_time: shift.end_time?.slice(0, 5) || "17:00",
      shift_date: shift.shift_date,
      capacity: shift.capacity || 1,
      color: shift.color || "#253C7D",
      notes: shift.notes || "",
    });
    setShowEditModal(true);
  };

  const handleEditShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShift) return;
    setSubmitting(true);
    const { error } = await supabase
      .from("shifts")
      .update({
        name: shiftForm.name.trim(),
        branch_id: shiftForm.branch_id || null,
        department: shiftForm.department.trim() || null,
        start_time: shiftForm.start_time,
        end_time: shiftForm.end_time,
        shift_date: shiftForm.shift_date,
        capacity: Number(shiftForm.capacity) || 1,
        color: shiftForm.color || "#253C7D",
        notes: shiftForm.notes.trim() || null,
      })
      .eq("id", selectedShift.id);

    setSubmitting(false);
    if (error) {
      toast("Error", "Failed to update shift: " + error.message, "error");
      return;
    }

    toast("Success", "Shift updated", "success");
    setShowEditModal(false);
    loadData();
  };

  const openDuplicateModal = (shift: Shift) => {
    const nextDay = new Date(shift.shift_date);
    nextDay.setDate(nextDay.getDate() + 1);
    setDuplicateDate(formatDate(nextDay));
    setShowDuplicateModal(true);
  };

  // Quick 1-click duplicate to next day
  const quickDuplicateToNextDay = async (shift: Shift, e: React.MouseEvent) => {
    e.stopPropagation();
    const nextDay = new Date(shift.shift_date);
    nextDay.setDate(nextDay.getDate() + 1);
    const targetDate = formatDate(nextDay);

    const { error } = await supabase.from("shifts").insert({
      name: shift.name,
      branch_id: shift.branch_id || null,
      department: shift.department || null,
      start_time: shift.start_time,
      end_time: shift.end_time,
      shift_date: targetDate,
      capacity: shift.capacity,
      color: shift.color,
      notes: shift.notes,
    });

    if (error) {
      toast("Error", "Failed to duplicate shift: " + error.message, "error");
      return;
    }

    toast("Success", `Duplicated "${shift.name}" to ${targetDate}`, "success");
    loadData();
  };

  const handleDuplicateShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShift) return;
    setSubmitting(true);
    const { error } = await supabase.from("shifts").insert({
      name: `${selectedShift.name}`,
      branch_id: selectedShift.branch_id || null,
      department: selectedShift.department || null,
      start_time: selectedShift.start_time,
      end_time: selectedShift.end_time,
      shift_date: duplicateDate,
      capacity: selectedShift.capacity,
      color: selectedShift.color,
      notes: selectedShift.notes,
    });

    setSubmitting(false);
    if (error) {
      toast("Error", "Failed to duplicate shift: " + error.message, "error");
      return;
    }

    toast("Success", `Shift cloned to ${duplicateDate}`, "success");
    setShowDuplicateModal(false);
    loadData();
  };

  // High-Productivity: Copy Entire Week Schedule to Next Week
  const handleCopyWeekSchedule = async () => {
    if (weekShifts.length === 0) {
      toast("Notice", "No shifts scheduled in the current week to copy", "info");
      return;
    }

    setSubmitting(true);

    try {
      // 1. Prepare new shifts by shifting 7 days forward
      const newShiftsPayload = weekShifts.map((sh) => {
        const d = new Date(sh.shift_date);
        d.setDate(d.getDate() + 7);
        return {
          name: sh.name,
          branch_id: sh.branch_id || null,
          department: sh.department || null,
          start_time: sh.start_time,
          end_time: sh.end_time,
          shift_date: formatDate(d),
          capacity: sh.capacity,
          color: sh.color,
          notes: sh.notes,
        };
      });

      const { data: createdShifts, error: createError } = await supabase
        .from("shifts")
        .insert(newShiftsPayload)
        .select();

      if (createError) throw createError;

      // 2. If copy with staff is selected, clone assignments
      if (copyIncludeStaff && createdShifts) {
        const assignmentPayload: { shift_id: string; employee_id: string; status: string }[] = [];

        weekShifts.forEach((origShift, idx) => {
          const newShift = createdShifts[idx];
          if (!newShift) return;

          const origAssignments = assignments.filter((a) => a.shift_id === origShift.id);
          origAssignments.forEach((a) => {
            assignmentPayload.push({
              shift_id: newShift.id,
              employee_id: a.employee_id,
              status: "scheduled",
            });
          });
        });

        if (assignmentPayload.length > 0) {
          await supabase.from("shift_assignments").insert(assignmentPayload);
        }
      }

      toast("Success", `Copied ${weekShifts.length} shift(s) to next week!`, "success");
      setShowCopyWeekModal(false);
      navigateNext(); // Jump to next week automatically
      await loadData();
    } catch (err: any) {
      console.error(err);
      toast("Error", "Failed to copy week schedule: " + err.message, "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Bulk Delete Selected Shifts
  const handleBulkDelete = async () => {
    if (selectedShiftIds.length === 0) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedShiftIds.length} selected shift(s)?`)) return;

    setSubmitting(true);
    const { error } = await supabase.from("shifts").update({
      deleted_at: new Date().toISOString(),
      deleted_by: actorName,
    }).in("id", selectedShiftIds);
    setSubmitting(false);

    if (error) {
      toast("Error", "Failed to delete shifts: " + error.message, "error");
      return;
    }

    toast("Success", `Deleted ${selectedShiftIds.length} shift(s) (moved to Recycle Bin)`, "success");
    setSelectedShiftIds([]);
    setSelectedShift(null);
    loadData();
  };

  const handleDeleteShift = async () => {
    if (!selectedShift) return;
    setSubmitting(true);
    const { error } = await supabase.from("shifts").update({
      deleted_at: new Date().toISOString(),
      deleted_by: actorName,
    }).eq("id", selectedShift.id);
    setSubmitting(false);
    if (error) {
      toast("Error", "Failed to delete shift: " + error.message, "error");
      return;
    }

    toast("Success", "Shift deleted (moved to Recycle Bin)", "success");
    setSelectedShift(null);
    setShowDeleteConfirm(false);
    loadData();
  };

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShift || assignEmployeeIds.length === 0) return;
    setSubmitting(true);

    const { count } = await supabase
      .from("shift_assignments")
      .select("id", { count: "exact", head: true })
      .eq("shift_id", selectedShift.id)
      .is("deleted_at", null);

    const currentCount = count ?? 0;
    const availableSpots = selectedShift.capacity - currentCount;

    if (availableSpots <= 0) {
      setSubmitting(false);
      toast("Error", "This shift is already full. No additional employees can be assigned.", "error");
      loadData();
      return;
    }

    const idsToAssign = assignEmployeeIds.slice(0, availableSpots);
    if (idsToAssign.length < assignEmployeeIds.length) {
      toast("Warning", `Only ${availableSpots} spot(s) were remaining. Assigned ${idsToAssign.length} employee(s).`, "info");
    }

    const payload = idsToAssign.map((empId) => ({
      shift_id: selectedShift.id,
      employee_id: empId,
      status: "scheduled",
    }));

    const { error } = await supabase.from("shift_assignments").insert(payload);
    setSubmitting(false);

    if (error) {
      toast("Error", "Failed to assign employees: " + error.message, "error");
      return;
    }

    toast("Success", `${idsToAssign.length} staff member${idsToAssign.length === 1 ? "" : "s"} scheduled!`, "success");
    setAssignEmployeeIds([]);
    setShowAssignModal(false);
    loadData();
  };

  const removeAssignment = async (assignId: string) => {
    const { error } = await supabase
      .from("shift_assignments")
      .update({ deleted_at: new Date().toISOString(), deleted_by: actorName })
      .eq("id", assignId);

    if (error) {
      toast("Error", "Failed to remove assignment: " + error.message, "error");
      return;
    }

    toast("Success", "Staff removed from shift (moved to Recycle Bin)", "success");
    loadData();
  };

  const navigatePrev = () => {
    const d = new Date(currentDate);
    if (viewMode === "month") {
      d.setMonth(d.getMonth() - 1);
    } else if (viewMode === "day") {
      d.setDate(d.getDate() - 1);
    } else {
      d.setDate(d.getDate() - 7);
    }
    setCurrentDate(d);
  };

  const navigateNext = () => {
    const d = new Date(currentDate);
    if (viewMode === "month") {
      d.setMonth(d.getMonth() + 1);
    } else if (viewMode === "day") {
      d.setDate(d.getDate() + 1);
    } else {
      d.setDate(d.getDate() + 7);
    }
    setCurrentDate(d);
  };

  const navigateToday = () => {
    setCurrentDate(new Date());
  };

  const handleExportCSV = () => {
    if (filteredShifts.length === 0) {
      toast("Warning", "No shifts to export in current filter", "info");
      return;
    }

    const headers = ["Shift Date", "Shift Name", "Start Time", "End Time", "Duration (Hours)", "Department", "Branch", "Capacity", "Assigned Count", "Assigned Employees", "Notes"];
    const rows = filteredShifts.map((s) => {
      const shiftStaff = assignments
        .filter((a) => a.shift_id === s.id)
        .map((a) => `${a.employee?.first_name || ""} ${a.employee?.last_name || ""}`.trim())
        .join("; ");
      const hours = calculateHours(s.start_time, s.end_time);

      return [
        `"${s.shift_date}"`,
        `"${s.name.replace(/"/g, '""')}"`,
        `"${s.start_time}"`,
        `"${s.end_time}"`,
        hours,
        `"${(s.department || "").replace(/"/g, '""')}"`,
        `"${(s.branches?.name || "").replace(/"/g, '""')}"`,
        s.capacity,
        s.assignmentCount || 0,
        `"${shiftStaff.replace(/"/g, '""')}"`,
        `"${(s.notes || "").replace(/"/g, '""')}"`,
      ].join(",");
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `shift_schedule_${formatDate(currentDate)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast("Success", "Schedule exported to CSV", "success");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-[#253C7D] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex">
      {/* Main Content Area */}
      <div className={`flex-1 min-w-0 transition-all duration-200 ${selectedShift ? "sm:mr-[380px] lg:mr-[400px]" : ""}`}>
        <div className="p-6 lg:p-10">

          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-[#1A1A1A]">
                Shift Scheduling
              </h1>
              <p className="text-[13px] text-gray-500 mt-1">
                {kpiTotalShiftsThisWeek} shifts this week &middot; {kpiTotalWeeklyHours} total scheduled hours &middot; {kpiCoveragePercentage}% staffing coverage
              </p>
            </div>

            {/* Header Action Suite */}
            <div className="flex flex-wrap items-center gap-2">
              <Link
                to={`/reports?module=shifts&from=${formatDate(weekDates[0])}&to=${formatDate(weekDates[6])}`}
                title="Open detailed Shift Scheduling Report in Reports Center"
                className="inline-flex items-center gap-1.5 border border-blue-200 bg-blue-50/80 text-blue-800 px-3.5 py-2.5 rounded-xl text-xs font-semibold hover:bg-blue-100 transition-colors whitespace-nowrap cursor-pointer shadow-2xs"
              >
                <i className="ri-file-chart-line text-xs text-blue-700" />
                <span>Shift Reports</span>
              </Link>

              <button
                onClick={() => setShowWorkloadDrawer(true)}
                title="View weekly staff workload & hours allocation"
                className="inline-flex items-center gap-1.5 border border-gray-200 bg-white text-gray-700 px-3.5 py-2.5 rounded-xl text-xs font-semibold hover:bg-gray-50 transition-colors whitespace-nowrap cursor-pointer shadow-2xs"
              >
                <i className="ri-user-star-line text-xs text-[#253C7D]" />
                <span>Workload</span>
              </button>

              <button
                onClick={() => setShowCopyWeekModal(true)}
                title="Duplicate entire weekly schedule to next week in 1 click"
                className="inline-flex items-center gap-1.5 border border-gray-200 bg-white text-gray-700 px-3.5 py-2.5 rounded-xl text-xs font-semibold hover:bg-gray-50 transition-colors whitespace-nowrap cursor-pointer shadow-2xs"
              >
                <i className="ri-file-copy-2-line text-xs text-[#253C7D]" />
                <span>Copy Week ({weekShifts.length})</span>
              </button>

              <button
                onClick={handleExportCSV}
                title="Export schedule to CSV"
                className="inline-flex items-center gap-1.5 border border-gray-200 bg-white text-gray-700 px-3 py-2.5 rounded-xl text-xs font-semibold hover:bg-gray-50 transition-colors whitespace-nowrap cursor-pointer shadow-2xs"
              >
                <i className="ri-download-2-line text-xs text-gray-500" />
                <span>Export</span>
              </button>

              <button
                onClick={() => openCreateModal()}
                className="inline-flex items-center gap-1.5 bg-[#253C7D] text-white px-4 py-2.5 rounded-xl text-xs font-semibold hover:bg-[#1F336A] transition-colors whitespace-nowrap cursor-pointer shadow-xs active:scale-98"
              >
                <i className="ri-add-line font-bold text-sm" />
                <span>Create Shift</span>
              </button>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
            {[
              { label: "Weekly Shifts", value: kpiTotalShiftsThisWeek, subtext: `${shifts.length} total shifts in system`, icon: "ri-time-line", color: "text-[#253C7D]" },
              { label: "Staffing Coverage", value: `${kpiCoveragePercentage}%`, subtext: `${kpiTotalWeeklyAssigned}/${kpiTotalWeeklyCapacity} slots staffed`, icon: "ri-user-follow-line", color: "text-emerald-600" },
              { label: "Open Slots", value: kpiTotalOpenSpots, subtext: kpiTotalOpenSpots > 0 ? `${kpiTotalOpenSpots} understaffed` : "All filled", icon: "ri-user-add-line", color: kpiTotalOpenSpots > 0 ? "text-amber-600" : "text-emerald-600" },
              { label: "Scheduled Hours", value: `${kpiTotalWeeklyHours} hrs`, subtext: `Across ${branches.length} branches`, icon: "ri-calendar-check-line", color: "text-violet-600" },
            ].map((s) => (
              <div key={s.label} className="bg-white border border-gray-100 rounded-xl p-4 shadow-2xs">
                <div className="flex items-center justify-between">
                  <i className={`${s.icon} ${s.color} text-xl`} />
                  <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">{s.label}</span>
                </div>
                <p className="text-xl font-bold text-gray-900 mt-2">{s.value}</p>
                <p className="text-[11px] text-gray-500 mt-0.5">{s.subtext}</p>
              </div>
            ))}
          </div>

          {/* Productivity Toolbar */}
          <div className="bg-white border border-gray-200/80 rounded-xl p-3.5 mb-5 shadow-2xs space-y-3">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">

              {/* Left: View Switcher & Date Navigation */}
              <div className="flex flex-wrap items-center gap-3">
                {/* View Switcher Pills */}
                <div className="flex items-center p-0.5 bg-gray-100/90 rounded-lg border border-gray-200/60">
                  {(
                    [
                      { id: "week", label: "Week", icon: "ri-calendar-view" },
                      { id: "day", label: "Day", icon: "ri-time-line" },
                      { id: "list", label: "List", icon: "ri-list-check" },
                      { id: "month", label: "Month", icon: "ri-calendar-2-line" },
                    ] as { id: ViewMode; label: string; icon: string }[]
                  ).map((v) => (
                    <button
                      key={v.id}
                      onClick={() => setViewMode(v.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold rounded-md transition-all cursor-pointer ${viewMode === v.id
                          ? "bg-white text-[#253C7D] font-bold shadow-2xs"
                          : "text-gray-600 hover:text-gray-900"
                        }`}
                    >
                      <i className={`${v.icon} text-xs`} />
                      <span>{v.label}</span>
                    </button>
                  ))}
                </div>

                {/* Density Toggle (Comfortable vs Compact) */}
                <div className="hidden sm:flex items-center p-0.5 bg-gray-100/90 rounded-lg border border-gray-200/60">
                  <button
                    onClick={() => setDensity("comfortable")}
                    title="Comfortable card spacing"
                    className={`px-2 py-1 text-[11px] font-semibold rounded ${density === "comfortable" ? "bg-white text-[#253C7D] shadow-2xs font-bold" : "text-gray-500"}`}
                  >
                    Normal
                  </button>
                  <button
                    onClick={() => setDensity("compact")}
                    title="Compact view for high density"
                    className={`px-2 py-1 text-[11px] font-semibold rounded ${density === "compact" ? "bg-white text-[#253C7D] shadow-2xs font-bold" : "text-gray-500"}`}
                  >
                    Compact
                  </button>
                </div>

                {/* Date Navigation */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={navigatePrev}
                    title="Previous period (P)"
                    className="w-7 h-7 flex items-center justify-center bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 cursor-pointer shadow-2xs"
                  >
                    <i className="ri-arrow-left-s-line text-base" />
                  </button>

                  <span className="text-[13px] font-bold text-gray-800 min-w-[130px] text-center px-1">
                    {viewMode === "month" && (
                      `${MONTH_NAMES[currentDate.getMonth()]} ${currentDate.getFullYear()}`
                    )}
                    {viewMode === "day" && (
                      currentDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })
                    )}
                    {(viewMode === "week" || viewMode === "list") && (
                      `${weekDates[0].toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${weekDates[6].toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
                    )}
                  </span>

                  <button
                    onClick={navigateNext}
                    title="Next period (N)"
                    className="w-7 h-7 flex items-center justify-center bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 cursor-pointer shadow-2xs"
                  >
                    <i className="ri-arrow-right-s-line text-base" />
                  </button>

                  <button
                    onClick={navigateToday}
                    title="Jump to Today (T)"
                    className="px-2 py-1 text-[11px] font-bold text-[#253C7D] hover:bg-[#253C7D]/10 rounded-md transition-colors cursor-pointer"
                  >
                    Today
                  </button>
                </div>
              </div>

              {/* Right: Search Input & Dropdowns */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative flex-1 sm:w-52">
                  <i className="ri-search-line absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search shift or staff..."
                    className="w-full pl-7 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-800 placeholder:text-gray-400 focus:outline-none focus:bg-white focus:border-[#253C7D] transition-colors"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <i className="ri-close-circle-fill text-xs" />
                    </button>
                  )}
                </div>

                <select
                  value={filterBranch}
                  onChange={(e) => setFilterBranch(e.target.value)}
                  className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs bg-white text-gray-700 font-medium focus:outline-none focus:border-[#253C7D] cursor-pointer"
                >
                  <option value="all">All Branches ({branches.length})</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>

                <select
                  value={filterDept}
                  onChange={(e) => setFilterDept(e.target.value)}
                  className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs bg-white text-gray-700 font-medium focus:outline-none focus:border-[#253C7D] cursor-pointer"
                >
                  <option value="all">All Departments ({departments.length})</option>
                  {departments.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quick Filter Chips Strip */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-100">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mr-1">Filter By:</span>

                <button
                  onClick={() => setQuickFilter("all")}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${quickFilter === "all"
                      ? "bg-[#253C7D] text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                >
                  All ({shifts.length})
                </button>

                <button
                  onClick={() => setQuickFilter("open")}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer flex items-center gap-1 ${quickFilter === "open"
                      ? "bg-amber-600 text-white"
                      : "bg-amber-50 text-amber-800 hover:bg-amber-100"
                    }`}
                >
                  <i className="ri-user-add-line text-xs" />
                  <span>Needs Staff ({totalOpenShiftsCount})</span>
                </button>

                <button
                  onClick={() => setQuickFilter("filled")}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer flex items-center gap-1 ${quickFilter === "filled"
                      ? "bg-emerald-600 text-white"
                      : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                    }`}
                >
                  <i className="ri-check-line text-xs" />
                  <span>Fully Staffed ({totalFilledShiftsCount})</span>
                </button>
              </div>

              {(searchQuery || filterBranch !== "all" || filterDept !== "all" || quickFilter !== "all") && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setFilterBranch("all");
                    setFilterDept("all");
                    setQuickFilter("all");
                  }}
                  className="text-[11px] font-semibold text-rose-600 hover:underline cursor-pointer flex items-center gap-1"
                >
                  <i className="ri-filter-off-line" /> Clear Filters
                </button>
              )}
            </div>
          </div>

          {/* Bulk Action Bar (when shifts are selected) */}
          {selectedShiftIds.length > 0 && (
            <div className="mb-4 p-3 bg-slate-900 text-white rounded-2xl flex items-center justify-between gap-3 shadow-lg animate-in slide-in-from-top duration-150">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-xl bg-white/20 flex items-center justify-center font-bold text-xs">
                  {selectedShiftIds.length}
                </span>
                <span className="text-xs font-semibold">shift(s) selected</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleBulkDelete}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1"
                >
                  <i className="ri-delete-bin-line text-xs" /> Delete Selected
                </button>
                <button
                  onClick={() => setSelectedShiftIds([])}
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  Deselect All
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* VIEW 1: WEEK GRID VIEW (HIGH PRODUCTIVITY) */}
          {/* ========================================================================= */}
          {viewMode === "week" && (
            <div className="bg-white border border-gray-200/90 rounded-xl overflow-x-auto shadow-2xs">
              <div className="min-w-[900px]">
                {/* Day Headers with Hours & Shifts count */}
                <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50/75 divide-x divide-gray-200">
                  {weekDates.map((date, i) => {
                    const isToday = formatDate(date) === formatDate(new Date());
                    const daySummary = getDaySummary(date);
                    return (
                      <div
                        key={i}
                        className={`p-3 relative group transition-colors ${isToday ? "bg-[#253C7D]/8" : ""
                          }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <span className={`text-[11px] font-bold uppercase tracking-wider ${isToday ? "text-[#253C7D]" : "text-gray-500"}`}>
                              {DAYS_SHORT[i]}
                            </span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className={`text-[18px] font-extrabold ${isToday ? "text-[#253C7D]" : "text-gray-900"}`}>
                                {date.getDate()}
                              </span>
                              {isToday && (
                                <span className="px-1.5 py-0.2 text-[9px] font-bold uppercase bg-[#253C7D] text-white rounded">
                                  Today
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Quick + Add button on day column header */}
                          <button
                            onClick={() => openCreateModal(formatDate(date))}
                            title={`Add shift on ${formatDate(date)}`}
                            className="w-6 h-6 rounded bg-white border border-gray-200 text-gray-500 hover:text-[#253C7D] hover:border-[#253C7D] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-2xs"
                          >
                            <i className="ri-add-line text-xs font-bold" />
                          </button>
                        </div>

                        {/* Day metrics summary */}
                        <div className="mt-2 pt-1.5 border-t border-gray-200/60 flex items-center justify-between text-[10px] text-gray-500">
                          <span>{daySummary.count} shift{daySummary.count === 1 ? "" : "s"}</span>
                          <span className="font-bold text-gray-700">{daySummary.totalHours}h</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Shift Cards Grid */}
                <div className="grid grid-cols-7 min-h-[380px] bg-slate-50/20 divide-x divide-gray-200">
                  {weekDates.map((date, i) => {
                    const dayShifts = getShiftsForDay(date);
                    const isToday = formatDate(date) === formatDate(new Date());

                    return (
                      <div
                        key={i}
                        className={`p-2 space-y-2 flex flex-col ${isToday ? "bg-[#253C7D]/2" : ""
                          }`}
                      >
                        {dayShifts.map((sh) => {
                          const aCount = sh.assignmentCount ?? 0;
                          const isFull = aCount >= sh.capacity;
                          const isSelected = selectedShift?.id === sh.id;
                          const shiftHours = calculateHours(sh.start_time, sh.end_time);
                          const shiftStaff = assignments.filter((a) => a.shift_id === sh.id);

                          return (
                            <div
                              key={sh.id}
                              onClick={() => setSelectedShift(isSelected ? null : sh)}
                              className={`group relative rounded-xl bg-white border transition-all duration-150 cursor-pointer shadow-2xs hover:shadow-md ${density === "compact" ? "p-2 space-y-1" : "p-2.5 space-y-1.5"
                                } ${isSelected
                                  ? "ring-2 ring-offset-1 border-transparent shadow-sm"
                                  : "hover:border-gray-300"
                                }`}
                              style={{
                                borderLeftWidth: "4px",
                                borderLeftColor: sh.color || "#253C7D",
                                ...(isSelected ? ({ "--tw-ring-color": sh.color || "#253C7D" } as CSSProperties) : {}),
                              }}
                            >
                              {/* Header: Title + Department */}
                              <div className="flex items-start justify-between gap-1">
                                <p className="text-[12px] font-bold text-gray-900 leading-snug line-clamp-1">
                                  {sh.name}
                                </p>
                                {sh.department && (
                                  <span
                                    className="text-[9px] font-semibold px-1 py-0.2 rounded shrink-0 uppercase tracking-wider"
                                    style={{
                                      backgroundColor: (deptColors[sh.department] || sh.color) + "18",
                                      color: deptColors[sh.department] || sh.color,
                                    }}
                                  >
                                    {sh.department}
                                  </span>
                                )}
                              </div>

                              {/* Time & Duration */}
                              <div className="flex items-center justify-between text-[10px] text-gray-500">
                                <span className="flex items-center gap-1 font-medium text-gray-700">
                                  <i className="ri-time-line text-gray-400" />
                                  {sh.start_time?.slice(0, 5)} – {sh.end_time?.slice(0, 5)}
                                </span>
                                <span className="text-[9px] text-gray-400">({shiftHours}h)</span>
                              </div>

                              {/* Branch Location */}
                              {sh.branches?.name && density !== "compact" && (
                                <p className="text-[9px] text-gray-400 truncate flex items-center gap-1">
                                  <i className="ri-map-pin-line text-[9px] text-gray-400" />
                                  <span className="truncate">{sh.branches.name}</span>
                                </p>
                              )}

                              {/* Staff Avatars & Capacity Progress */}
                              <div className="pt-1.5 border-t border-gray-100 flex items-center justify-between gap-1.5">
                                {/* Avatars */}
                                <div className="flex -space-x-1.5 overflow-hidden">
                                  {shiftStaff.slice(0, 3).map((a) => (
                                    <span
                                      key={a.id}
                                      title={`${a.employee?.first_name} ${a.employee?.last_name}`}
                                      className="w-5 h-5 rounded-full border border-white bg-slate-200 text-[#253C7D] flex items-center justify-center text-[8px] font-bold overflow-hidden shadow-2xs"
                                    >
                                      {a.employee?.avatar_url ? (
                                        <img src={a.employee.avatar_url} alt="" className="w-full h-full object-cover" />
                                      ) : (
                                        `${a.employee?.first_name?.[0] || ""}${a.employee?.last_name?.[0] || ""}`.toUpperCase()
                                      )}
                                    </span>
                                  ))}
                                  {shiftStaff.length > 3 && (
                                    <span className="w-5 h-5 rounded-full border border-white bg-slate-100 text-gray-600 flex items-center justify-center text-[8px] font-bold">
                                      +{shiftStaff.length - 3}
                                    </span>
                                  )}
                                  {shiftStaff.length === 0 && (
                                    <span className="text-[9px] text-gray-400 italic">No staff</span>
                                  )}
                                </div>

                                {/* Capacity Pill */}
                                <span
                                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 ${isFull
                                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                                      : aCount === 0
                                        ? "bg-rose-50 text-rose-600 font-semibold"
                                        : "bg-amber-50 text-amber-700 font-semibold"
                                    }`}
                                >
                                  {isFull ? (
                                    <>
                                      <i className="ri-check-line text-xs" />
                                      <span>Full</span>
                                    </>
                                  ) : (
                                    <span>{aCount}/{sh.capacity}</span>
                                  )}
                                </span>
                              </div>

                              {/* Quick Productivity Hover Toolbar */}
                              <div className="absolute right-2 top-2 hidden group-hover:flex items-center gap-0.5 bg-white/95 backdrop-blur-xs p-0.5 rounded-md shadow-xs border border-gray-200">
                                {!isFull ? (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedShift(sh);
                                      setShowAssignModal(true);
                                    }}
                                    title="Quick Assign Staff"
                                    className="w-5 h-5 flex items-center justify-center rounded hover:bg-[#253C7D]/10 text-[#253C7D] cursor-pointer"
                                  >
                                    <i className="ri-user-add-line text-xs" />
                                  </button>
                                ) : (
                                  <span
                                    title="Shift is at maximum capacity (Full)"
                                    className="w-5 h-5 flex items-center justify-center rounded text-emerald-600 bg-emerald-50 cursor-default"
                                  >
                                    <i className="ri-lock-line text-xs" />
                                  </span>
                                )}
                                <button
                                  onClick={(e) => quickDuplicateToNextDay(sh, e)}
                                  title="Duplicate to Next Day"
                                  className="w-5 h-5 flex items-center justify-center rounded hover:bg-gray-100 text-gray-600 hover:text-gray-900 cursor-pointer"
                                >
                                  <i className="ri-file-copy-line text-xs" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedShift(sh);
                                    openEditModal(sh);
                                  }}
                                  title="Edit Shift"
                                  className="w-5 h-5 flex items-center justify-center rounded hover:bg-gray-100 text-gray-600 hover:text-gray-900 cursor-pointer"
                                >
                                  <i className="ri-edit-line text-xs" />
                                </button>
                              </div>
                            </div>
                          );
                        })}

                        {dayShifts.length === 0 && (
                          <div
                            onClick={() => openCreateModal(formatDate(date))}
                            className="flex-1 min-h-[90px] rounded-lg border border-dashed border-gray-200 hover:border-[#253C7D]/50 hover:bg-[#253C7D]/2 flex flex-col items-center justify-center p-2 text-center transition-all cursor-pointer group/cell"
                          >
                            <i className="ri-add-line text-gray-300 group-hover/cell:text-[#253C7D] text-base transition-colors" />
                            <span className="text-[10px] text-gray-400 group-hover/cell:text-gray-600 font-medium">
                              Add Shift
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* VIEW 2: DAY TIMELINE / HOURLY ROSTER */}
          {/* ========================================================================= */}
          {viewMode === "day" && (() => {
            const dayShifts = getShiftsForDay(currentDate);
            return (
              <div className="bg-white border border-gray-200/80 rounded-xl p-5 shadow-2xs">
                <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                  <div>
                    <h3 className="text-base font-bold text-gray-900">
                      {currentDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {dayShifts.length} shifts scheduled &middot; {dayShifts.reduce((s, sh) => s + (sh.assignmentCount || 0), 0)} staff assigned &middot; {dayShifts.reduce((s, sh) => s + calculateHours(sh.start_time, sh.end_time), 0)} total hours
                    </p>
                  </div>
                  <button
                    onClick={() => openCreateModal(formatDate(currentDate))}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#253C7D] text-white text-xs font-semibold rounded-lg hover:bg-[#1F336A] transition-colors cursor-pointer"
                  >
                    <i className="ri-add-line" /> Add Shift Today
                  </button>
                </div>

                {dayShifts.length === 0 ? (
                  <div className="py-14 text-center text-gray-400">
                    <i className="ri-calendar-event-line text-4xl mb-2 block" />
                    <p className="text-sm font-semibold text-gray-700">No shifts scheduled for this day</p>
                    <button
                      onClick={() => openCreateModal(formatDate(currentDate))}
                      className="mt-3 px-4 py-2 bg-[#253C7D] text-white text-xs font-semibold rounded-lg hover:bg-[#1F336A] transition-colors cursor-pointer"
                    >
                      + Create Shift
                    </button>
                  </div>
                ) : (
                  <div className="mt-4 space-y-3">
                    {dayShifts.map((sh) => {
                      const shiftStaff = assignments.filter((a) => a.shift_id === sh.id);
                      const isFull = (sh.assignmentCount || 0) >= sh.capacity;
                      const isSelected = selectedShift?.id === sh.id;

                      return (
                        <div
                          key={sh.id}
                          onClick={() => setSelectedShift(isSelected ? null : sh)}
                          className={`p-4 rounded-xl border transition-all cursor-pointer ${isSelected ? "ring-2 ring-[#253C7D] border-transparent bg-gray-50/60" : "border-gray-100 bg-white hover:border-gray-200"
                            }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <span className="w-3.5 h-3.5 rounded-full shrink-0" style={{ backgroundColor: sh.color || "#253C7D" }} />
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="text-sm font-bold text-gray-900">{sh.name}</h4>
                                  {sh.department && (
                                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-gray-100 text-gray-700">
                                      {sh.department}
                                    </span>
                                  )}
                                  {sh.branches?.name && (
                                    <span className="text-[11px] text-gray-400 flex items-center gap-1">
                                      <i className="ri-map-pin-line text-xs" /> {sh.branches.name}
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-gray-500 mt-0.5">
                                  {sh.start_time} – {sh.end_time} &middot; {calculateHours(sh.start_time, sh.end_time)} hrs duration
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <div className="flex -space-x-1.5 overflow-hidden">
                                {shiftStaff.map((a) => (
                                  <span
                                    key={a.id}
                                    title={`${a.employee?.first_name} ${a.employee?.last_name}`}
                                    className="w-7 h-7 rounded-full border-2 border-white bg-slate-200 text-[#253C7D] flex items-center justify-center text-[9px] font-bold overflow-hidden"
                                  >
                                    {a.employee?.avatar_url ? (
                                      <img src={a.employee.avatar_url} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                      `${a.employee?.first_name?.[0] || ""}${a.employee?.last_name?.[0] || ""}`.toUpperCase()
                                    )}
                                  </span>
                                ))}
                              </div>

                              <span
                                className={`text-xs font-bold px-2.5 py-1 rounded-md ${isFull ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-amber-50 text-amber-700 border border-amber-200"
                                  }`}
                              >
                                {isFull ? "Fully Staffed" : `${sh.assignmentCount || 0}/${sh.capacity} Staffed`}
                              </span>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (isFull) return;
                                  setSelectedShift(sh);
                                  setShowAssignModal(true);
                                }}
                                disabled={isFull}
                                title={isFull ? "Shift is full" : "Assign staff"}
                                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${isFull
                                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                    : "bg-[#253C7D]/10 hover:bg-[#253C7D]/20 text-[#253C7D] cursor-pointer"
                                  }`}
                              >
                                {isFull ? "Full" : "+ Assign"}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()}

          {/* ========================================================================= */}
          {/* VIEW 3: LIST / TABLE VIEW */}
          {/* ========================================================================= */}
          {viewMode === "list" && (
            <div className="border border-gray-200/80 rounded-xl overflow-hidden bg-white shadow-2xs">
              <div className="grid grid-cols-12 bg-gray-50 px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider items-center">
                <div className="col-span-1 flex items-center">
                  <input
                    type="checkbox"
                    checked={filteredShifts.length > 0 && selectedShiftIds.length === filteredShifts.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedShiftIds(filteredShifts.map((s) => s.id));
                      } else {
                        setSelectedShiftIds([]);
                      }
                    }}
                    className="rounded border-gray-300 text-[#253C7D] focus:ring-[#253C7D] cursor-pointer"
                  />
                </div>
                <span className="col-span-3">Shift Name</span>
                <span className="col-span-2">Date & Time</span>
                <span className="col-span-2">Department</span>
                <span className="col-span-2">Branch</span>
                <span className="col-span-1">Staffing</span>
                <span className="col-span-1 text-right">Actions</span>
              </div>

              <div className="divide-y divide-gray-100">
                {filteredShifts.length === 0 ? (
                  <div className="text-center py-14 text-gray-400">
                    <i className="ri-calendar-line text-4xl mb-2 block" />
                    <p className="text-sm">No shifts found</p>
                  </div>
                ) : (
                  filteredShifts.map((sh) => {
                    const aCount = sh.assignmentCount || 0;
                    const isFull = aCount >= sh.capacity;
                    const isSelected = selectedShift?.id === sh.id;
                    const isChecked = selectedShiftIds.includes(sh.id);

                    return (
                      <div
                        key={sh.id}
                        onClick={() => setSelectedShift(isSelected ? null : sh)}
                        className={`grid grid-cols-12 px-5 py-3.5 items-center hover:bg-[#253C7D]/5 transition-colors cursor-pointer ${isSelected || isChecked ? "bg-[#253C7D]/10" : ""
                          }`}
                      >
                        <div className="col-span-1" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedShiftIds([...selectedShiftIds, sh.id]);
                              } else {
                                setSelectedShiftIds(selectedShiftIds.filter((id) => id !== sh.id));
                              }
                            }}
                            className="rounded border-gray-300 text-[#253C7D] focus:ring-[#253C7D] cursor-pointer"
                          />
                        </div>

                        <div className="col-span-3 flex items-center gap-2.5">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: sh.color || "#253C7D" }} />
                          <div>
                            <p className="text-[13px] font-semibold text-gray-900">{sh.name}</p>
                            <p className="text-[11px] text-gray-400">{calculateHours(sh.start_time, sh.end_time)} hrs duration</p>
                          </div>
                        </div>

                        <div className="col-span-2 text-[12px] text-gray-700">
                          {sh.shift_date}
                          <span className="block text-[11px] text-gray-400">{sh.start_time?.slice(0, 5)} – {sh.end_time?.slice(0, 5)}</span>
                        </div>

                        <div className="col-span-2 text-[13px] text-gray-700">{sh.department || "—"}</div>
                        <div className="col-span-2 text-[13px] text-gray-600">{sh.branches?.name || "All Branches"}</div>

                        <div className="col-span-1">
                          <span
                            className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full ${isFull ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                              }`}
                          >
                            {isFull ? "Full" : `${aCount}/${sh.capacity}`}
                          </span>
                        </div>

                        <div className="col-span-1 flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => {
                              if (isFull) return;
                              setSelectedShift(sh);
                              setShowAssignModal(true);
                            }}
                            disabled={isFull}
                            className={`p-1.5 rounded-lg transition-colors ${isFull ? "opacity-30 cursor-not-allowed text-gray-400" : "hover:bg-gray-100 text-gray-600 hover:text-[#253C7D] cursor-pointer"
                              }`}
                            title={isFull ? "Shift at capacity (Full)" : "Assign Staff"}
                          >
                            <i className="ri-user-add-line text-sm" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedShift(sh);
                              openEditModal(sh);
                            }}
                            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
                            title="Edit Shift"
                          >
                            <i className="ri-edit-line text-sm" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* VIEW 4: MONTH OVERVIEW VIEW */}
          {/* ========================================================================= */}
          {viewMode === "month" && (() => {
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth();
            const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7;
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            const prevMonthDays = new Date(year, month, 0).getDate();

            const cells: { date: Date; isCurrentMonth: boolean }[] = [];

            for (let i = firstDayIndex - 1; i >= 0; i--) {
              cells.push({ date: new Date(year, month - 1, prevMonthDays - i), isCurrentMonth: false });
            }
            for (let d = 1; d <= daysInMonth; d++) {
              cells.push({ date: new Date(year, month, d), isCurrentMonth: true });
            }
            while (cells.length % 7 !== 0 || cells.length < 35) {
              const nextD = cells.length - (firstDayIndex + daysInMonth) + 1;
              cells.push({ date: new Date(year, month + 1, nextD), isCurrentMonth: false });
            }

            return (
              <div className="bg-white border border-gray-200/80 rounded-xl overflow-hidden shadow-2xs">
                <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50 text-[11px] font-semibold text-gray-500 uppercase tracking-wider text-center py-2.5">
                  {DAYS_SHORT.map((d) => (
                    <div key={d}>{d}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 divide-x divide-y divide-gray-100">
                  {cells.map(({ date, isCurrentMonth }, idx) => {
                    const dateStr = formatDate(date);
                    const isToday = dateStr === formatDate(new Date());
                    const dayShifts = filteredShifts.filter((s) => s.shift_date === dateStr);

                    return (
                      <div
                        key={idx}
                        onClick={() => {
                          setCurrentDate(date);
                          setViewMode("day");
                        }}
                        className={`min-h-[105px] p-2 transition-all hover:bg-gray-50 cursor-pointer flex flex-col justify-between ${!isCurrentMonth ? "opacity-35 bg-gray-50/40" : ""
                          } ${isToday ? "bg-[#253C7D]/4" : ""}`}
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${isToday ? "bg-[#253C7D] text-white" : "text-gray-700"
                              }`}
                          >
                            {date.getDate()}
                          </span>
                          {dayShifts.length > 0 && (
                            <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-full bg-gray-100 text-gray-600">
                              {dayShifts.length}
                            </span>
                          )}
                        </div>

                        <div className="space-y-1 mt-1.5 flex-1">
                          {dayShifts.slice(0, 2).map((sh) => (
                            <div
                              key={sh.id}
                              className="text-[9px] font-semibold px-1.5 py-0.5 rounded truncate text-white"
                              style={{ backgroundColor: sh.color || "#253C7D" }}
                            >
                              {sh.name}
                            </div>
                          ))}
                          {dayShifts.length > 2 && (
                            <div className="text-[9px] font-bold text-gray-400 pl-1">
                              +{dayShifts.length - 2} more
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {/* Department Legend */}
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <span className="text-[11px] font-semibold text-gray-400 uppercase">Departments:</span>
            {Object.entries(deptColors).slice(0, 7).map(([dept, color]) => (
              <div key={dept} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-[11px] text-gray-600">{dept}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SHIFT DETAIL SLIDE-OVER DRAWER */}
      {/* ========================================================================= */}
      {selectedShift && (
        <div className="fixed right-0 top-0 h-full w-full sm:w-[380px] lg:w-[400px] bg-white border-l border-gray-100 overflow-y-auto z-40 flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
          {/* Header Banner */}
          <div className="p-5 border-b border-gray-100" style={{ backgroundColor: (selectedShift.color || "#253C7D") + "15" }}>
            <div className="flex items-start justify-between">
              <div>
                <span
                  className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-md"
                  style={{
                    backgroundColor: (selectedShift.color || "#253C7D") + "25",
                    color: selectedShift.color || "#253C7D",
                  }}
                >
                  {selectedShift.department || "Operations"}
                </span>
                <h3 className="text-[16px] font-bold text-gray-900 mt-1">{selectedShift.name}</h3>
                <p className="text-[12px] text-gray-500 mt-0.5">
                  {new Date(selectedShift.shift_date + "T00:00:00").toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
              <button
                onClick={() => setSelectedShift(null)}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-black/5 cursor-pointer text-gray-500"
              >
                <i className="ri-close-line text-lg" />
              </button>
            </div>

            {/* Quick Shift Actions Strip */}
            <div className="mt-3 pt-2.5 border-t border-black/5 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => openEditModal(selectedShift)}
                  className="px-2.5 py-1 text-xs font-semibold bg-white rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-700 flex items-center gap-1 cursor-pointer"
                >
                  <i className="ri-edit-line text-xs" /> Edit
                </button>
                <button
                  onClick={() => openDuplicateModal(selectedShift)}
                  className="px-2.5 py-1 text-xs font-semibold bg-white rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-700 flex items-center gap-1 cursor-pointer"
                >
                  <i className="ri-file-copy-line text-xs" /> Duplicate
                </button>
              </div>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-2.5 py-1 text-xs font-semibold bg-red-50 text-red-600 hover:bg-red-100 rounded-lg flex items-center gap-1 cursor-pointer"
              >
                <i className="ri-delete-bin-line text-xs" /> Delete
              </button>
            </div>

            {/* Shift Metrics Grid */}
            <div className="grid grid-cols-2 gap-2 mt-3">
              <div className="bg-white rounded-lg p-2.5 border border-gray-100">
                <p className="text-[10px] text-gray-400">Time</p>
                <p className="text-[12px] font-bold text-gray-800 mt-0.5">
                  {selectedShift.start_time?.slice(0, 5)} – {selectedShift.end_time?.slice(0, 5)}
                </p>
              </div>
              <div className="bg-white rounded-lg p-2.5 border border-gray-100">
                <p className="text-[10px] text-gray-400">Capacity</p>
                <p
                  className="text-[12px] font-bold mt-0.5"
                  style={{ color: isSelectedShiftFull ? "#059669" : selectedShift.color || "#253C7D" }}
                >
                  {selectedShiftAssignments.length} / {selectedShift.capacity} {isSelectedShiftFull ? "(Full)" : "Staffed"}
                </p>
              </div>
              <div className="bg-white rounded-lg p-2.5 border border-gray-100">
                <p className="text-[10px] text-gray-400">Branch</p>
                <p className="text-[12px] font-semibold text-gray-800 mt-0.5 truncate">
                  {selectedShift.branches?.name || "All Branches"}
                </p>
              </div>
              <div className="bg-white rounded-lg p-2.5 border border-gray-100">
                <p className="text-[10px] text-gray-400">Department</p>
                <p className="text-[12px] font-semibold text-gray-800 mt-0.5 truncate">
                  {selectedShift.department || "Operations"}
                </p>
              </div>
            </div>

            {selectedShift.notes && (
              <div className="mt-2.5 bg-white rounded-lg p-2.5 border border-gray-100">
                <p className="text-[10px] text-gray-400 mb-0.5">Notes</p>
                <p className="text-[12px] text-gray-600 whitespace-pre-wrap">{selectedShift.notes}</p>
              </div>
            )}
          </div>

          {/* Assigned Staff Section */}
          <div className="p-5 flex-1 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-[12px] font-semibold text-gray-500 uppercase tracking-wider">
                  Assigned Employees ({selectedShiftAssignments.length}/{selectedShift.capacity})
                </h4>
                <p className="text-[11px] text-gray-400">
                  {isSelectedShiftFull ? (
                    <span className="text-emerald-600 font-semibold flex items-center gap-1">
                      <i className="ri-checkbox-circle-fill text-xs" /> Maximum capacity reached
                    </span>
                  ) : (
                    <span>{remainingSpots} spot(s) remaining</span>
                  )}
                </p>
              </div>

              <button
                onClick={() => setShowAssignModal(true)}
                disabled={isSelectedShiftFull}
                title={isSelectedShiftFull ? "Shift is at full capacity" : "Assign employees"}
                className="text-[12px] text-[#253C7D] font-semibold hover:underline disabled:opacity-40 disabled:cursor-not-allowed disabled:no-underline cursor-pointer flex items-center gap-1"
              >
                <i className={isSelectedShiftFull ? "ri-lock-line text-xs" : "ri-user-add-line text-xs"} />
                <span>{isSelectedShiftFull ? "Full" : "+ Assign Staff"}</span>
              </button>
            </div>

            {selectedShiftAssignments.length === 0 ? (
              <div className="text-center py-10">
                <i className="ri-user-add-line text-3xl text-gray-200" />
                <p className="text-[13px] text-gray-400 mt-2">No employees assigned yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {selectedShiftAssignments.map((a) => {
                  const hasConflict = checkEmployeeConflict(a.employee_id, selectedShift.shift_date, selectedShift.id);

                  return (
                    <div key={a.id} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100">
                      <span className="w-8 h-8 rounded-lg bg-[#253C7D]/10 text-[#253C7D] flex items-center justify-center text-xs font-bold shrink-0 overflow-hidden">
                        {a.employee?.avatar_url ? (
                          <img src={a.employee.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          `${a.employee?.first_name?.[0] || ""}${a.employee?.last_name?.[0] || ""}`.toUpperCase()
                        )}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-[13px] font-semibold text-gray-900 truncate">
                            {a.employee?.first_name} {a.employee?.last_name}
                          </p>
                          {hasConflict && (
                            <span className="px-1 py-0.2 bg-amber-100 text-amber-800 text-[8px] font-bold rounded">
                              Conflict
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-gray-500 truncate">{a.employee?.role || "Staff"}</p>
                      </div>
                      <span className="text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded-full font-medium capitalize">
                        {a.status || "scheduled"}
                      </span>
                      <button
                        onClick={() => removeAssignment(a.id)}
                        className="w-6 h-6 flex items-center justify-center rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                        title="Remove from shift"
                      >
                        <i className="ri-close-line text-xs" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DRAWER: STAFF WORKLOAD & HOURS ALLOCATION */}
      {/* ========================================================================= */}
      {showWorkloadDrawer && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex justify-end animate-in fade-in duration-200">
          <div className="w-full sm:w-[480px] bg-white h-full shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
            {/* Header */}
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-base font-bold flex items-center gap-2">
                  <i className="ri-user-star-line text-amber-400" />
                  <span>Weekly Staff Workload</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Hours & shift allocation for {weekDates[0].toLocaleDateString("en-US", { month: "short", day: "numeric" })} – {weekDates[6].toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </p>
              </div>
              <button
                onClick={() => setShowWorkloadDrawer(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer"
              >
                <i className="ri-close-line text-lg" />
              </button>
            </div>

            {/* List */}
            <div className="p-5 flex-1 overflow-y-auto space-y-2.5">
              {staffWorkload.map(({ employee: emp, totalHours, shiftCount, isOvertime, isUnscheduled }) => (
                <div
                  key={emp.id}
                  className={`p-3 rounded-2xl border transition-all ${isOvertime
                      ? "bg-amber-50/60 border-amber-200"
                      : isUnscheduled
                        ? "bg-slate-50/60 border-slate-200/80 opacity-70"
                        : "bg-white border-slate-200 shadow-2xs"
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-9 h-9 rounded-xl bg-[#253C7D]/10 text-[#253C7D] text-xs font-bold flex items-center justify-center overflow-hidden shrink-0">
                        {emp.avatar_url ? (
                          <img src={emp.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          `${emp.first_name[0]}${emp.last_name[0]}`
                        )}
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">{emp.first_name} {emp.last_name}</p>
                        <p className="text-[10px] text-slate-400 truncate">{emp.role || "Staff"} &middot; {emp.department}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className={`text-xs font-extrabold ${isOvertime ? "text-amber-600" : isUnscheduled ? "text-slate-400" : "text-emerald-600"}`}>
                        {totalHours} hrs
                      </span>
                      <span className="text-[10px] text-slate-400 block">{shiftCount} shift{shiftCount === 1 ? "" : "s"}</span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-2.5 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${isOvertime ? "bg-amber-500" : totalHours >= 30 ? "bg-emerald-500" : "bg-[#253C7D]"
                        }`}
                      style={{ width: `${Math.min(100, (totalHours / 40) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: COPY WEEK SCHEDULE AUTOMATION */}
      {/* ========================================================================= */}
      {showCopyWeekModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-6 border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#253C7D] flex items-center justify-center font-bold">
                  <i className="ri-file-copy-2-line text-lg" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Copy Week Schedule</h3>
              </div>
              <button onClick={() => setShowCopyWeekModal(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                <i className="ri-close-line text-lg" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs text-slate-600">
              <p>
                Duplicate all <span className="font-bold text-slate-900">{weekShifts.length} shifts</span> from the current week to the following week.
              </p>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Current Week:</span>
                  <span className="font-bold text-slate-800">{formatDate(weekDates[0])} – {formatDate(weekDates[6])}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Target Next Week:</span>
                  <span className="font-bold text-[#253C7D]">
                    {(() => {
                      const nextMon = new Date(weekDates[0]);
                      nextMon.setDate(nextMon.getDate() + 7);
                      const nextSun = new Date(weekDates[6]);
                      nextSun.setDate(nextSun.getDate() + 7);
                      return `${formatDate(nextMon)} – ${formatDate(nextSun)}`;
                    })()}
                  </span>
                </div>
              </div>

              {/* Checkbox: Copy Staff Assignments */}
              <label className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={copyIncludeStaff}
                  onChange={(e) => setCopyIncludeStaff(e.target.checked)}
                  className="rounded border-gray-300 text-[#253C7D] focus:ring-[#253C7D]"
                />
                <div>
                  <span className="font-bold text-slate-800 block">Include Employee Assignments</span>
                  <span className="text-[11px] text-slate-400">Keep workers assigned on duplicate shifts</span>
                </div>
              </label>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCopyWeekModal(false)}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCopyWeekSchedule}
                  disabled={submitting || weekShifts.length === 0}
                  className="flex-1 py-2.5 bg-[#253C7D] text-white text-xs font-bold rounded-xl hover:bg-[#1E293B] disabled:opacity-50 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {submitting ? "Cloning..." : `Clone ${weekShifts.length} Shifts`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CREATE / EDIT SHIFT (ENTERPRISE HERO DESIGN) */}
      {/* ========================================================================= */}
      {(showCreateModal || showEditModal) && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] border border-slate-100">

            {/* Modal Header */}
            <div
              className="p-5 text-white relative shrink-0 transition-colors"
              style={{
                background: `linear-gradient(135deg, ${shiftForm.color || "#253C7D"}ee, #1E293B)`,
              }}
            >
              <div className="flex items-start justify-between relative z-10">
                <div>
                  <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-md bg-white/20 text-white backdrop-blur-xs">
                    {showEditModal ? "Edit Schedule" : "New Schedule"}
                  </span>
                  <h2 className="text-xl font-bold text-white mt-1">
                    {showEditModal ? "Edit Shift Details" : "Create New Shift"}
                  </h2>
                  <p className="text-xs text-white/80 mt-0.5">
                    Configure timing, branch location, department, and staffing capacity
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setShowEditModal(false);
                  }}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
                >
                  <i className="ri-close-line text-lg" />
                </button>
              </div>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={showEditModal ? handleEditShift : handleCreateShift} className="p-6 overflow-y-auto space-y-5 flex-1">

              {/* Quick Shift Presets (on Create) */}
              {!showEditModal && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Quick Shift Presets
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {SHIFT_TEMPLATES.map((tpl) => {
                      const isActive = shiftForm.start_time === tpl.start && shiftForm.end_time === tpl.end;
                      return (
                        <button
                          key={tpl.name}
                          type="button"
                          onClick={() => applyTemplate(tpl)}
                          className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${isActive
                              ? "bg-blue-50 border-[#253C7D] ring-1 ring-[#253C7D] shadow-2xs"
                              : "bg-slate-50/70 border-slate-200 hover:bg-slate-100 hover:border-slate-300"
                            }`}
                        >
                          <p className="text-xs font-bold text-slate-900 truncate flex items-center justify-between">
                            <span>{tpl.label}</span>
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: tpl.color }} />
                          </p>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {tpl.start} – {tpl.end}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Shift Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Shift Name *</label>
                <input
                  required
                  type="text"
                  value={shiftForm.name}
                  onChange={(e) => setShiftForm({ ...shiftForm, name: e.target.value })}
                  placeholder="e.g., Morning Floor Shift, Operations Support"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#253C7D] focus:ring-2 focus:ring-[#253C7D]/10 transition-all"
                />
              </div>

              {/* Branch & Department in 2 Columns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Branch Location</label>
                  <select
                    value={shiftForm.branch_id}
                    onChange={(e) => setShiftForm({ ...shiftForm, branch_id: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-[#253C7D] cursor-pointer"
                  >
                    <option value="">All / No specific branch</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Department</label>
                  <select
                    value={shiftForm.department}
                    onChange={(e) => setShiftForm({ ...shiftForm, department: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-[#253C7D] cursor-pointer"
                  >
                    <option value="">Select department...</option>
                    {departments.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                    {!departments.includes(shiftForm.department) && shiftForm.department && (
                      <option value={shiftForm.department}>{shiftForm.department}</option>
                    )}
                  </select>
                </div>
              </div>

              {/* Date & Shift Timings */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Shift Date *</label>
                  <input
                    required
                    type="date"
                    value={shiftForm.shift_date}
                    onChange={(e) => setShiftForm({ ...shiftForm, shift_date: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-[#253C7D]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Start Time *</label>
                  <input
                    required
                    type="time"
                    value={shiftForm.start_time}
                    onChange={(e) => setShiftForm({ ...shiftForm, start_time: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-[#253C7D]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">End Time *</label>
                  <input
                    required
                    type="time"
                    value={shiftForm.end_time}
                    onChange={(e) => setShiftForm({ ...shiftForm, end_time: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:bg-white focus:border-[#253C7D]"
                  />
                </div>
              </div>

              {/* Live Duration Calculation Banner */}
              {(() => {
                const duration = calculateHours(shiftForm.start_time, shiftForm.end_time);
                const totalWorkingHours = Math.round(duration * (Number(shiftForm.capacity) || 1) * 10) / 10;
                return (
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-slate-700 font-semibold">
                      <i className="ri-time-line text-[#253C7D]" />
                      <span>Duration: <strong className="text-slate-900">{duration} hrs</strong></span>
                    </div>
                    <div className="text-slate-500">
                      Total Workload: <strong className="text-[#253C7D]">{totalWorkingHours} staff hrs</strong>
                    </div>
                  </div>
                );
              })()}

              {/* Capacity & Color Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Staff Capacity (Max Assigned)
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShiftForm({ ...shiftForm, capacity: Math.max(1, (shiftForm.capacity || 1) - 1) })}
                      className="w-10 h-10 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-700 font-bold cursor-pointer transition-colors"
                    >
                      <i className="ri-subtract-line text-sm" />
                    </button>

                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={shiftForm.capacity}
                      onChange={(e) => setShiftForm({ ...shiftForm, capacity: Math.max(1, parseInt(e.target.value) || 1) })}
                      className="flex-1 text-center py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:bg-white focus:border-[#253C7D]"
                    />

                    <button
                      type="button"
                      onClick={() => setShiftForm({ ...shiftForm, capacity: (shiftForm.capacity || 1) + 1 })}
                      className="w-10 h-10 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-700 font-bold cursor-pointer transition-colors"
                    >
                      <i className="ri-add-line text-sm" />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Shift Color Tag</label>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {PRESET_COLORS.map((c) => (
                      <button
                        type="button"
                        key={c.value}
                        onClick={() => setShiftForm({ ...shiftForm, color: c.value })}
                        title={c.name}
                        className={`w-7 h-7 rounded-full cursor-pointer transition-all ${shiftForm.color === c.value
                            ? "scale-115 ring-2 ring-offset-2 ring-slate-800 shadow-sm"
                            : "opacity-80 hover:opacity-100 hover:scale-105"
                          }`}
                        style={{ backgroundColor: c.value }}
                      />
                    ))}
                    <label
                      title="Custom Color"
                      className="w-7 h-7 rounded-full border border-dashed border-slate-300 hover:border-slate-500 flex items-center justify-center cursor-pointer transition-colors"
                    >
                      <i className="ri-palette-line text-xs text-slate-500" />
                      <input
                        type="color"
                        value={shiftForm.color}
                        onChange={(e) => setShiftForm({ ...shiftForm, color: e.target.value })}
                        className="sr-only"
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Optional Shift Notes</label>
                <textarea
                  value={shiftForm.notes}
                  onChange={(e) => setShiftForm({ ...shiftForm, notes: e.target.value })}
                  rows={2}
                  placeholder="Add any instructions, dress code, or special duties..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#253C7D] resize-none"
                />
              </div>

              {/* Action Footer */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setShowEditModal(false);
                  }}
                  className="px-5 py-2.5 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-[#253C7D] hover:bg-[#1E293B] text-white text-xs font-bold rounded-xl shadow-xs disabled:opacity-60 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  {submitting ? (
                    <>
                      <i className="ri-loader-4-line animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <i className={showEditModal ? "ri-check-line" : "ri-add-line"} />
                      <span>{showEditModal ? "Save Changes" : "Create Shift"}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: DUPLICATE SHIFT */}
      {/* ========================================================================= */}
      {showDuplicateModal && selectedShift && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl p-5">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="text-[15px] font-bold text-gray-900">Duplicate Shift</h3>
              <button onClick={() => setShowDuplicateModal(false)} className="text-gray-400 hover:text-gray-600">
                <i className="ri-close-line text-lg" />
              </button>
            </div>
            <form onSubmit={handleDuplicateShift} className="mt-4 space-y-4">
              <p className="text-xs text-gray-500">
                Clone <span className="font-bold text-gray-800">{selectedShift.name}</span> to a new date:
              </p>
              <div>
                <label className="block text-[12px] font-semibold text-gray-700 mb-1">Target Date *</label>
                <input
                  required
                  type="date"
                  value={duplicateDate}
                  onChange={(e) => setDuplicateDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#253C7D]"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDuplicateModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-[#253C7D] text-white text-xs font-semibold rounded-lg hover:bg-[#1F336A] disabled:opacity-60"
                >
                  {submitting ? "Duplicating..." : "Duplicate"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: DELETE CONFIRM */}
      {/* ========================================================================= */}
      {showDeleteConfirm && selectedShift && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl p-5">
            <h3 className="text-[15px] font-bold text-gray-900">Delete Shift?</h3>
            <p className="text-xs text-gray-500 mt-1.5">
              Are you sure you want to delete <span className="font-semibold text-gray-800">{selectedShift.name}</span>? Any assigned workers will be removed.
            </p>
            <div className="flex items-center justify-end gap-2 mt-5">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteShift}
                disabled={submitting}
                className="px-4 py-2 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700 disabled:opacity-60 cursor-pointer"
              >
                {submitting ? "Deleting..." : "Delete Shift"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ASSIGN EMPLOYEES (CLEAN HERO MODAL - NO SCROLLBARS) */}
      {/* ========================================================================= */}
      {showAssignModal && selectedShift && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] border border-slate-100">

            {/* 1. Hero Header with Shift Theme Gradient */}
            <div
              className="p-5 text-white relative overflow-hidden shrink-0"
              style={{
                background: `linear-gradient(135deg, ${selectedShift.color || "#253C7D"}ee, #1E293B)`,
              }}
            >
              <div className="flex items-start justify-between relative z-10">
                <div className="min-w-0 pr-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-md bg-white/20 text-white backdrop-blur-xs">
                      {selectedShift.department || "Operations"}
                    </span>
                    {selectedShift.branches?.name && (
                      <span className="px-2 py-0.5 text-[10px] font-medium rounded-md bg-black/20 text-white/90 flex items-center gap-1">
                        <i className="ri-map-pin-2-fill text-[10px] text-amber-300" />
                        {selectedShift.branches.name}
                      </span>
                    )}
                  </div>

                  <h2 className="text-xl font-bold text-white mt-1.5 truncate">
                    Assign Staff &bull; {selectedShift.name}
                  </h2>

                  <p className="text-xs text-white/80 mt-0.5 flex items-center gap-2">
                    <span>
                      {new Date(selectedShift.shift_date + "T00:00:00").toLocaleDateString("en-US", {
                        weekday: "short", month: "short", day: "numeric"
                      })}
                    </span>
                    <span>&middot;</span>
                    <span>{selectedShift.start_time?.slice(0, 5)} – {selectedShift.end_time?.slice(0, 5)}</span>
                    <span>&middot;</span>
                    <span>{calculateHours(selectedShift.start_time, selectedShift.end_time)} hrs</span>
                  </p>
                </div>

                <button
                  onClick={() => setShowAssignModal(false)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
                >
                  <i className="ri-close-line text-lg" />
                </button>
              </div>

              {/* Live Staffing Capacity Gauge Strip */}
              <div className="mt-4 pt-3 border-t border-white/15 flex items-center justify-between relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center font-black text-sm text-white shadow-inner">
                    {selectedShiftAssignments.length + assignEmployeeIds.length}/{selectedShift.capacity}
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-white/70 block">Target Staffing</span>
                    <span className="text-xs font-bold text-white">
                      {remainingSpots - assignEmployeeIds.length === 0 ? (
                        <span className="text-emerald-300 flex items-center gap-1">
                          <i className="ri-checkbox-circle-fill text-xs" /> Capacity full ({selectedShift.capacity} staff)
                        </span>
                      ) : (
                        <span className="text-amber-200">
                          {remainingSpots - assignEmployeeIds.length} open spot(s) remaining
                        </span>
                      )}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[11px] font-semibold text-white/70 block">Selection</span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-white text-[#253C7D] shadow-xs inline-block">
                    {assignEmployeeIds.length} of {remainingSpots} selected
                  </span>
                </div>
              </div>
            </div>

            {/* 2. Modal Body / Selection Roster */}
            <div className="p-5 flex-1 overflow-y-auto overflow-x-hidden space-y-4">

              {/* If shift is full */}
              {remainingSpots <= 0 ? (
                <div className="p-8 text-center bg-emerald-50/70 border border-emerald-200/80 rounded-2xl my-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-3 shadow-xs">
                    <i className="ri-shield-check-line text-2xl" />
                  </div>
                  <h3 className="text-base font-bold text-emerald-900">Shift is 100% Fully Staffed</h3>
                  <p className="text-xs text-emerald-700 mt-1 max-w-md mx-auto">
                    All {selectedShift.capacity} required employee positions are already assigned to this shift.
                  </p>
                  <div className="mt-4 flex justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAssignModal(false);
                        openEditModal(selectedShift);
                      }}
                      className="px-4 py-2 bg-[#253C7D] text-white text-xs font-bold rounded-xl hover:bg-[#1F336A] transition-colors cursor-pointer shadow-xs"
                    >
                      Increase Shift Capacity
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Clean Search & Department Filter Bar (No horizontal scrollbars) */}
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                      <input
                        type="text"
                        value={assignSearch}
                        onChange={(e) => setAssignSearch(e.target.value)}
                        placeholder="Search employee by name, department, or role..."
                        className="w-full pl-8 pr-7 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:bg-white focus:border-[#253C7D] transition-colors"
                      />
                      {assignSearch && (
                        <button
                          type="button"
                          onClick={() => setAssignSearch("")}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                        >
                          <i className="ri-close-circle-fill text-xs" />
                        </button>
                      )}
                    </div>

                    <select
                      value={assignDeptFilter}
                      onChange={(e) => setAssignDeptFilter(e.target.value)}
                      className="px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white text-gray-700 font-medium focus:outline-none focus:border-[#253C7D] cursor-pointer shrink-0"
                    >
                      <option value="all">All Departments ({employees.length})</option>
                      {departments.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>

                  {/* Employee Directory Selection Grid */}
                  <div>
                    {(() => {
                      const excludeIds = selectedShiftAssignments.map((a) => a.employee_id);
                      const available = employees.filter((emp) => !excludeIds.includes(emp.id));
                      const filtered = available.filter((emp) => {
                        if (assignDeptFilter !== "all" && emp.department !== assignDeptFilter) return false;
                        if (!assignSearch.trim()) return true;
                        const q = assignSearch.trim().toLowerCase();
                        return `${emp.first_name} ${emp.last_name} ${emp.department} ${emp.role}`.toLowerCase().includes(q);
                      });

                      const isMaxSelected = assignEmployeeIds.length >= remainingSpots;

                      return (
                        <div className="space-y-2">
                          {/* Roster Header with Auto-fill action */}
                          <div className="flex items-center justify-between text-xs px-1 text-slate-500">
                            <span className="font-semibold text-[11px]">
                              {filtered.length} available staff
                            </span>

                            {filtered.length > 0 && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (assignEmployeeIds.length === remainingSpots) {
                                    setAssignEmployeeIds([]);
                                  } else {
                                    const allFilteredIds = filtered.map((e) => e.id);
                                    setAssignEmployeeIds(allFilteredIds.slice(0, remainingSpots));
                                  }
                                }}
                                className="text-xs font-bold text-[#253C7D] hover:underline cursor-pointer flex items-center gap-1"
                              >
                                <i className="ri-magic-line text-xs" />
                                <span>{assignEmployeeIds.length === remainingSpots ? "Clear Selection" : `Auto-fill remaining ${remainingSpots} spot(s)`}</span>
                              </button>
                            )}
                          </div>

                          {filtered.length === 0 ? (
                            <div className="py-12 text-center text-slate-400 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                              <i className="ri-user-search-line text-3xl mb-1 block" />
                              <p className="text-xs font-semibold">No available employees found</p>
                              <p className="text-[11px] mt-0.5">Try clearing your search query or department filter</p>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[310px] overflow-y-auto overflow-x-hidden pr-1">
                              {filtered.map((emp) => {
                                const isChecked = assignEmployeeIds.includes(emp.id);
                                const hasConflict = checkEmployeeConflict(emp.id, selectedShift.shift_date, selectedShift.id);
                                const isSlotDisabled = !isChecked && isMaxSelected;

                                return (
                                  <div
                                    key={emp.id}
                                    onClick={() => {
                                      if (isSlotDisabled) {
                                        toast("Capacity Reached", `You can only select up to ${remainingSpots} staff members. Deselect one first to swap.`, "info");
                                        return;
                                      }
                                      if (isChecked) {
                                        setAssignEmployeeIds(assignEmployeeIds.filter((id) => id !== emp.id));
                                      } else {
                                        setAssignEmployeeIds([...assignEmployeeIds, emp.id]);
                                      }
                                    }}
                                    className={`p-3 rounded-2xl border transition-all select-none flex items-center justify-between gap-2.5 ${isSlotDisabled
                                        ? "opacity-40 cursor-not-allowed bg-slate-50 border-slate-200"
                                        : isChecked
                                          ? "bg-blue-50/80 border-[#253C7D] shadow-2xs ring-1 ring-[#253C7D] cursor-pointer"
                                          : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-2xs cursor-pointer"
                                      }`}
                                  >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                      <span className="w-9 h-9 rounded-xl bg-[#253C7D]/10 text-[#253C7D] font-bold text-xs flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
                                        {emp.avatar_url ? (
                                          <img src={emp.avatar_url} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                          `${emp.first_name[0] || ''}${emp.last_name[0] || ''}`.toUpperCase()
                                        )}
                                      </span>

                                      <div className="min-w-0">
                                        <div className="flex items-center gap-1">
                                          <p className="text-xs font-bold text-slate-900 truncate">
                                            {emp.first_name} {emp.last_name}
                                          </p>
                                          {hasConflict && (
                                            <span
                                              title="Assigned to another shift on this day"
                                              className="px-1 py-0.2 bg-amber-100 text-amber-800 text-[8px] font-bold rounded shrink-0"
                                            >
                                              Conflict
                                            </span>
                                          )}
                                        </div>
                                        <p className="text-[10px] text-slate-400 truncate">
                                          {emp.role || "Staff"} &middot; {emp.department}
                                        </p>
                                      </div>
                                    </div>

                                    {/* Selection Checkmark Bubble */}
                                    <div className="shrink-0">
                                      {isChecked ? (
                                        <div className="w-6 h-6 rounded-full bg-[#253C7D] text-white flex items-center justify-center text-xs shadow-2xs">
                                          <i className="ri-check-line font-bold" />
                                        </div>
                                      ) : isSlotDisabled ? (
                                        <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 text-[9px] font-bold">
                                          <i className="ri-lock-line text-xs" />
                                        </div>
                                      ) : (
                                        <div className="w-6 h-6 rounded-full border border-slate-300 bg-white hover:border-[#253C7D] transition-colors" />
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>

                  {/* 3. Selected Employees Tray */}
                  {assignEmployeeIds.length > 0 && (
                    <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                        <span>Selected for Assignment ({assignEmployeeIds.length}/{remainingSpots}):</span>
                        <button
                          type="button"
                          onClick={() => setAssignEmployeeIds([])}
                          className="text-[10px] text-slate-400 hover:text-rose-600 cursor-pointer font-semibold"
                        >
                          Clear All
                        </button>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5">
                        {assignEmployeeIds.map((id) => {
                          const emp = employees.find((e) => e.id === id);
                          if (!emp) return null;
                          return (
                            <span
                              key={id}
                              className="inline-flex items-center gap-1.5 pl-1.5 pr-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 shadow-2xs"
                            >
                              <span className="w-4.5 h-4.5 rounded-md bg-[#253C7D]/10 text-[#253C7D] text-[9px] font-bold flex items-center justify-center">
                                {emp.first_name[0]}{emp.last_name[0]}
                              </span>
                              <span>{emp.first_name} {emp.last_name}</span>
                              <button
                                type="button"
                                onClick={() => setAssignEmployeeIds(assignEmployeeIds.filter((x) => x !== id))}
                                className="w-4 h-4 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-600 flex items-center justify-center cursor-pointer ml-0.5"
                              >
                                <i className="ri-close-line text-xs" />
                              </button>
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* 4. Action Footer */}
            {remainingSpots > 0 && (
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3 shrink-0">
                <div className="text-xs text-slate-500">
                  {assignEmployeeIds.length === 0 ? (
                    <span>Click on staff cards above to select</span>
                  ) : assignEmployeeIds.length === remainingSpots ? (
                    <span className="text-emerald-600 font-bold flex items-center gap-1">
                      <i className="ri-checkbox-circle-fill text-sm" /> All available spots filled
                    </span>
                  ) : (
                    <span>{remainingSpots - assignEmployeeIds.length} more spot(s) can be selected</span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAssignModal(false)}
                    className="px-4 py-2.5 border border-slate-200 bg-white text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handleAssign}
                    disabled={submitting || assignEmployeeIds.length === 0 || assignEmployeeIds.length > remainingSpots}
                    className="px-5 py-2.5 bg-[#253C7D] hover:bg-[#1E293B] text-white text-xs font-bold rounded-xl shadow-xs disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    {submitting ? (
                      <>
                        <i className="ri-loader-4-line animate-spin" />
                        <span>Assigning...</span>
                      </>
                    ) : (
                      <>
                        <i className="ri-user-add-line" />
                        <span>Assign {assignEmployeeIds.length > 0 ? `(${assignEmployeeIds.length} Staff)` : "Staff"}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}