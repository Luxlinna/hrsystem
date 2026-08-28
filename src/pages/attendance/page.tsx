import React, { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { useBranchScope } from "@/context/BranchContext";
import { toast } from "@/components/Toast";
import { logActivity } from "@/lib/audit";
import { toYMD, todayYMD as todayYMDLib } from "@/lib/date";
import type {
  Employee,
  AttendanceRecord,
  NewRecordForm,
  AttendanceTabKey,
  ViewMode,
  DatePreset,
  EmployeeSummaryItem,
  WorkLocation,
} from "./types";
import { calcHours, calcHoursNum } from "./constants";
import { AttendanceHeader } from "./components/AttendanceHeader";
import { SelfCheckInBanner } from "./components/SelfCheckInBanner";
import { AttendanceKpiBar } from "./components/AttendanceKpiBar";
import { AttendanceControlBar } from "./components/AttendanceControlBar";
import { RecordDetailsDrawer } from "./components/RecordDetailsDrawer";
import { LogAttendanceModal } from "./components/LogAttendanceModal";
import { EditAttendanceModal } from "./components/EditAttendanceModal";
import { RecordsTab } from "./tabs/RecordsTab";
import { PartnerBranchPrivacyShield } from "@/components/PartnerBranchPrivacyShield";

export default function AttendancePage() {
  const { user } = useAuth();
  const actorName = (user?.user_metadata?.display_name as string) || user?.email || "Unknown";
  const { role, isAdmin, loading: permsLoading } = usePermissions();
  const { isSuperAdmin, isBranchAdmin, effectiveBranchId, userBranchId, userBranchName, targetBranch, isPartnerBranchBlocked } = useBranchScope();

  const roleName = (role?.name || "").toLowerCase();
  const isLeader =
    (isSuperAdmin ||
    isBranchAdmin ||
    isAdmin ||
    /manager|lead|head|admin|ceo|director|chief|president|officer/i.test(roleName) ||
    !!role?.attendance_view_all_employees ||
    !!role?.attendance_view_own_branch) && !isPartnerBranchBlocked;
  const canManage = isLeader;
  const canViewAll = isLeader;

  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [myEmployee, setMyEmployee] = useState<Employee | null>(null);
  const [workLocations, setWorkLocations] = useState<WorkLocation[]>([]);
  const [loading, setLoading] = useState(true);

  // Tabs & Views
  const [activeTab, setActiveTab] = useState<AttendanceTabKey>("records");
  const [viewMode, setViewMode] = useState<ViewMode>("table");

  // Filters & Historical Date Ranges
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterWorkLocation, setFilterWorkLocation] = useState("all");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [filterDatePreset, setFilterDatePreset] = useState<DatePreset>("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [singleDate, setSingleDate] = useState(toYMD(new Date()));

  // Historical Date for "Live Who's In Today / Day Roster"
  const [rosterDate, setRosterDate] = useState(toYMD(new Date()));

  // Monthly Matrix Selector (YYYY-MM)
  const now = new Date();
  const [matrixMonth, setMatrixMonth] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`);

  // Modals & Panels
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);
  const [showLogModal, setShowLogModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);
  const [saving, setSaving] = useState(false);

  // Live Digital Clock State
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

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

  const fetchData = useCallback(async () => {
    if (isPartnerBranchBlocked || !targetBranch) {
      setRecords([]);
      setEmployees([]);
      setWorkLocations([]);
      setLoading(false);
      return;
    }

    // Fetch work locations for this branch (for dropdown + filter)
    const { data: wlData } = await supabase
      .from("work_locations")
      .select("id, branch_id, name, description, is_default")
      .eq("branch_id", targetBranch)
      .is("deleted_at", null)
      .order("is_default", { ascending: false })
      .order("name");
    setWorkLocations((wlData as WorkLocation[]) || []);

    setLoading(true);
    try {
      if (isLeader) {
        const empQuery = supabase
          .from("employees")
          .select("id, first_name, last_name, department, role, avatar_url, branch_id, branches(id, name), default_work_location_id")
          .is("deleted_at", null)
          .eq("status", "active")
          .eq("branch_id", targetBranch)
          .order("first_name");

        const { data: team, error: empErr } = await empQuery;
        if (empErr) console.warn("Error fetching attendance employees:", empErr);

        const empList = (team as unknown as Employee[]) || [];
        setEmployees(empList);

        const ids = empList.map((e) => e.id);

        let recPromise: PromiseLike<any>;
        if (ids.length > 0) {
          recPromise = supabase
            .from("attendance_records")
            .select("*, employees(id, first_name, last_name, department, role, avatar_url, branch_id, branches(id, name), default_work_location_id), work_location:work_locations(id, name)")
            .is("deleted_at", null)
            .in("employee_id", ids)
            .order("date", { ascending: false })
            .limit(2000);
        } else {
          recPromise = Promise.resolve({ data: [] });
        }

        const { data: recData, error: recErr } = await recPromise;
        if (recErr) console.warn("Error fetching attendance records:", recErr);
        setRecords((recData as unknown as AttendanceRecord[]) || []);
      } else {
        // Individual employee view
        let empRecord = myEmployee;
        if (!empRecord && user?.email) {
          const { data: me } = await supabase
            .from("employees")
            .select("id, first_name, last_name, department, role, avatar_url, branch_id, branches(id, name), default_work_location_id")
            .eq("email", user.email)
            .eq("branch_id", targetBranch)
            .is("deleted_at", null)
            .maybeSingle();
          if (me) {
            empRecord = me as unknown as Employee;
            setMyEmployee(empRecord);
          }
        }

        if (empRecord && (empRecord as any).branch_id === targetBranch) {
          setEmployees([empRecord]);
          const { data: recData } = await supabase
            .from("attendance_records")
            .select("*, employees(id, first_name, last_name, department, role, avatar_url, branch_id, branches(id, name), default_work_location_id), work_location:work_locations(id, name)")
            .eq("employee_id", empRecord.id)
            .is("deleted_at", null)
            .order("date", { ascending: false })
            .limit(1000);
          setRecords((recData as unknown as AttendanceRecord[]) || []);
        } else {
          setEmployees([]);
          setRecords([]);
        }
      }
    } catch (err) {
      console.error("Failed to load attendance data:", err);
      toast("Error", "Could not load attendance data", "error");
    } finally {
      setLoading(false);
    }
  }, [isPartnerBranchBlocked, targetBranch, isLeader, myEmployee, user?.email]);

  useEffect(() => {
    if (permsLoading) return;
    fetchData();
  }, [permsLoading, fetchData]);

  // Today's date string in company timezone
  const todayYMD = todayYMDLib();

  // Current user's today record
  const myTodayRecord = useMemo(() => {
    if (!myEmployee) return null;
    return records.find((r) => r.employee_id === myEmployee.id && r.date === todayYMD) || null;
  }, [myEmployee, records, todayYMD]);

  // Departments for filtering
  const departments = useMemo(() => {
    const set = new Set<string>();
    employees.forEach((e) => {
      if (e.department) set.add(e.department);
    });
    return Array.from(set).sort();
  }, [employees]);

  // Date Range Bounds Resolver
  const dateRangeBounds = useMemo(() => {
    const cur = new Date();
    if (filterDatePreset === "today") return { start: todayYMD, end: todayYMD };

    if (filterDatePreset === "yesterday") {
      const y = new Date();
      y.setDate(y.getDate() - 1);
      const yStr = toYMD(y);
      return { start: yStr, end: yStr };
    }

    if (filterDatePreset === "this_week") {
      const start = new Date(cur);
      start.setDate(cur.getDate() - cur.getDay());
      return { start: toYMD(start), end: todayYMD };
    }

    if (filterDatePreset === "last_week") {
      const start = new Date(cur);
      start.setDate(cur.getDate() - cur.getDay() - 7);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      return { start: toYMD(start), end: toYMD(end) };
    }

    if (filterDatePreset === "this_month") {
      const start = new Date(cur.getFullYear(), cur.getMonth(), 1);
      return { start: toYMD(start), end: todayYMD };
    }

    if (filterDatePreset === "last_month") {
      const start = new Date(cur.getFullYear(), cur.getMonth() - 1, 1);
      const end = new Date(cur.getFullYear(), cur.getMonth(), 0);
      return { start: toYMD(start), end: toYMD(end) };
    }

    if (filterDatePreset === "this_year") {
      const start = new Date(cur.getFullYear(), 0, 1);
      return { start: toYMD(start), end: todayYMD };
    }

    if (filterDatePreset === "last_year") {
      const start = new Date(cur.getFullYear() - 1, 0, 1);
      const end = new Date(cur.getFullYear() - 1, 11, 31);
      return { start: toYMD(start), end: toYMD(end) };
    }

    if (filterDatePreset === "single_date" && singleDate) {
      return { start: singleDate, end: singleDate };
    }

    if (filterDatePreset === "custom_range") {
      return {
        start: fromDate || "1970-01-01",
        end: toDate || "2099-12-31",
      };
    }

    return null;
  }, [filterDatePreset, singleDate, fromDate, toDate, todayYMD]);

  // Filtered Records
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      if (filterStatus !== "all" && r.status !== filterStatus) return false;
      if (filterDepartment !== "all" && r.employees?.department !== filterDepartment) return false;
      if (filterWorkLocation !== "all" && r.work_location_id !== filterWorkLocation) return false;

      if (dateRangeBounds) {
        if (r.date < dateRangeBounds.start || r.date > dateRangeBounds.end) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const empName = `${r.employees?.first_name || ""} ${r.employees?.last_name || ""}`.toLowerCase();
        const empRole = (r.employees?.role || "").toLowerCase();
        const dept = (r.employees?.department || "").toLowerCase();
        const notes = (r.notes || "").toLowerCase();
        const dateStr = r.date.toLowerCase();
        const site = (r.work_location?.name || "").toLowerCase();
        if (!empName.includes(q) && !empRole.includes(q) && !dept.includes(q) && !notes.includes(q) && !dateStr.includes(q) && !site.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [records, filterStatus, filterDepartment, filterWorkLocation, dateRangeBounds, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pagedRecords = useMemo(
    () => filteredRecords.slice((safePage - 1) * pageSize, safePage * pageSize),
    [filteredRecords, safePage, pageSize]
  );

  useEffect(() => {
    setPage(1);
  }, [searchQuery, filterDepartment, filterStatus, filterWorkLocation, filterDatePreset, fromDate, toDate, singleDate, pageSize]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  // Scope records for KPI calculation
  const activeScopeRecords = useMemo(() => {
    if (dateRangeBounds) {
      return records.filter((r) => r.date >= dateRangeBounds.start && r.date <= dateRangeBounds.end);
    }
    return records;
  }, [records, dateRangeBounds]);

  const presentCount = useMemo(
    () => activeScopeRecords.filter((r) => r.status === "ontime" || r.status === "present" || r.status === "remote").length,
    [activeScopeRecords]
  );
  const lateCount = useMemo(() => activeScopeRecords.filter((r) => r.status === "late").length, [activeScopeRecords]);
  const absentCount = useMemo(() => activeScopeRecords.filter((r) => r.status === "absent").length, [activeScopeRecords]);
  const remoteCount = useMemo(() => activeScopeRecords.filter((r) => r.status === "remote").length, [activeScopeRecords]);
  const workingNow = useMemo(
    () => records.filter((r) => r.date === todayYMD && r.clock_in && !r.clock_out).length,
    [records, todayYMD]
  );

  // Today's attendance grouped by work site (for the site summary strip)
  const todayByWorkSite = useMemo(() => {
    if (workLocations.length === 0) return [];
    const todayRecs = records.filter((r) => r.date === todayYMD);
    return workLocations.map((wl) => {
      const siteRecs = todayRecs.filter((r) => r.work_location_id === wl.id);
      const present = siteRecs.filter((r) => r.status === "ontime" || r.status === "present" || r.status === "late" || r.status === "remote").length;
      const workingNowHere = siteRecs.filter((r) => r.clock_in && !r.clock_out).length;
      return { ...wl, present, workingNowHere, total: siteRecs.length };
    });
  }, [workLocations, records, todayYMD]);

  const rosterRecords = useMemo(() => records.filter((r) => r.date === rosterDate), [records, rosterDate]);

  // Employee Summary & Ratings
  const employeeSummary: EmployeeSummaryItem[] = useMemo(() => {
    return employees.map((emp) => {
      const empRecords = activeScopeRecords.filter((r) => r.employee_id === emp.id);
      const present = empRecords.filter((r) => r.status === "ontime" || r.status === "present" || r.status === "remote").length;
      const late = empRecords.filter((r) => r.status === "late").length;
      const absent = empRecords.filter((r) => r.status === "absent").length;
      const remote = empRecords.filter((r) => r.status === "remote").length;
      const totalHours = empRecords.reduce((acc, r) => acc + calcHoursNum(r.clock_in, r.clock_out), 0);
      const totalLateMinutes = empRecords.reduce((acc, r) => acc + (r.late_minutes || 0), 0);
      const totalDays = empRecords.length;
      const attendanceRate = totalDays > 0 ? Math.round(((present + late) / totalDays) * 100) : 0;
      const lastSeen = empRecords[0]?.date || "—";
      const rosterRecord = rosterRecords.find((r) => r.employee_id === emp.id);

      return {
        ...emp,
        present,
        late,
        absent,
        remote,
        totalHours: +totalHours.toFixed(1),
        totalLateMinutes,
        totalDays,
        attendanceRate,
        lastSeen,
        rosterRecord,
      };
    });
  }, [employees, activeScopeRecords, rosterRecords]);

  const filteredSummary = useMemo(() => {
    return employeeSummary.filter((e) => {
      if (filterDepartment !== "all" && e.department !== filterDepartment) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const name = `${e.first_name} ${e.last_name}`.toLowerCase();
        const roleName = (e.role || "").toLowerCase();
        const dept = (e.department || "").toLowerCase();
        if (!name.includes(q) && !roleName.includes(q) && !dept.includes(q)) return false;
      }
      return true;
    });
  }, [employeeSummary, filterDepartment, searchQuery]);

  // Days array for Monthly Matrix
  const matrixDays: MatrixDay[] = useMemo(() => {
    if (!matrixMonth) return [];
    const [yStr, mStr] = matrixMonth.split("-");
    const year = parseInt(yStr);
    const month = parseInt(mStr);
    const totalDays = new Date(year, month, 0).getDate();
    return Array.from({ length: totalDays }, (_, i) => {
      const dayNum = i + 1;
      const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
      const dObj = new Date(year, month - 1, dayNum);
      return {
        dayNum,
        dateStr,
        dayName: dObj.toLocaleDateString("en-US", { weekday: "narrow" }),
        isWeekend: dObj.getDay() === 0 || dObj.getDay() === 6,
      };
    });
  }, [matrixMonth]);

  // Manual Log Attendance Save
  const handleSaveNewRecord = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRecord.employee_id || !newRecord.date || saving) return;
    setSaving(true);

    // Resolve work_location_id: use selected site, or fall back to employee's default
    const selectedEmp = employees.find((e) => e.id === newRecord.employee_id);
    const workLocationId = newRecord.work_location_id || selectedEmp?.default_work_location_id || null;

    const { error } = await supabase.from("attendance_records").insert({
      employee_id: newRecord.employee_id,
      date: newRecord.date,
      clock_in: newRecord.clock_in || null,
      clock_out: newRecord.clock_out || null,
      status: newRecord.status,
      late_minutes: newRecord.status === "late" ? newRecord.late_minutes : 0,
      notes: newRecord.notes ? newRecord.notes.trim() : null,
      work_location_id: workLocationId,
    });

    setSaving(false);
    if (error) {
      const msg =
        error.code === "23505"
          ? `This employee already has an attendance record for ${newRecord.date}. Edit the existing record instead.`
          : "Failed to record attendance";
      toast("Error", msg, "error");
      return;
    }

    toast("Attendance Logged", `Record added for ${newRecord.date}.`, "success");
    logActivity({
      module: "attendance",
      action: "created",
      entityType: "attendance_record",
      actorName,
      actorRole: role?.name || "Staff",
      description: `Logged attendance for employee on ${newRecord.date} (${newRecord.status})`,
      branchId: targetBranch,
    });
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
    fetchData();
  }, [newRecord, saving, todayYMD, actorName, role?.name, targetBranch, fetchData]);

  // Update existing record
  const handleUpdateRecord = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord || saving) return;
    setSaving(true);

    const { error } = await supabase
      .from("attendance_records")
      .update({
        clock_in: editingRecord.clock_in || null,
        clock_out: editingRecord.clock_out || null,
        status: editingRecord.status,
        late_minutes: editingRecord.status === "late" ? editingRecord.late_minutes : 0,
        notes: editingRecord.notes ? editingRecord.notes.trim() : null,
        work_location_id: editingRecord.work_location_id || null,
      })
      .eq("id", editingRecord.id);

    setSaving(false);
    if (error) {
      toast("Error", "Failed to update record", "error");
      return;
    }

    toast("Attendance Updated", "Changes saved successfully.", "success");
    logActivity({
      module: "attendance",
      action: "updated",
      entityType: "attendance_record",
      entityId: String(editingRecord.id),
      actorName,
      actorRole: role?.name || "Staff",
      description: `Updated attendance record for employee on ${editingRecord.date}`,
      branchId: targetBranch,
    });
    setEditingRecord(null);
    if (selectedRecord && selectedRecord.id === editingRecord.id) {
      setSelectedRecord(editingRecord);
    }
    fetchData();
  }, [editingRecord, saving, selectedRecord, actorName, role?.name, targetBranch, fetchData]);

  // Delete Record
  const handleDeleteRecord = useCallback(async (id: number) => {
    if (!confirm("Move this attendance record to the Recycle Bin? It can be restored later.")) return;
    const { error } = await supabase
      .from("attendance_records")
      .update({ deleted_at: new Date().toISOString(), deleted_by: actorName })
      .eq("id", id);
    if (error) {
      toast("Error", "Failed to move record to the Recycle Bin", "error");
      return;
    }
    toast("Record Moved", "Attendance entry moved to the Recycle Bin.", "success");
    logActivity({
      module: "attendance",
      action: "deleted",
      entityType: "attendance_record",
      entityId: String(id),
      actorName,
      actorRole: role?.name || "Staff",
      description: `Moved attendance record #${id} to Recycle Bin`,
      branchId: targetBranch,
    });
    setSelectedRecord(null);
    setEditingRecord(null);
    fetchData();
  }, [actorName, role?.name, targetBranch, fetchData]);

  // Export CSV
  const handleExportCSV = useCallback(() => {
    if (filteredRecords.length === 0) {
      toast("Export", "No records to export with current filters", "warning");
      return;
    }

    const headers = ["Employee", "Department", "Role", "Work Site", "Date", "Check In", "Check Out", "Hours", "Status", "Late (Min)", "Notes"];
    const rows = filteredRecords.map((r) => [
      `"${r.employees ? `${r.employees.first_name} ${r.employees.last_name}` : "Unknown"}"`,
      `"${r.employees?.department || ""}"`,
      `"${r.employees?.role || ""}"`,
      `"${r.work_location?.name || ""}"`,
      r.date,
      r.clock_in || "",
      r.clock_out || "",
      calcHours(r.clock_in, r.clock_out),
      r.status,
      r.late_minutes || 0,
      `"${(r.notes || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `attendance_export_${dateRangeBounds?.start || "all"}_to_${dateRangeBounds?.end || "all"}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast("Export Complete", `Exported ${filteredRecords.length} records to CSV`, "success");
  }, [filteredRecords, dateRangeBounds]);

  const changeRosterDate = useCallback((offsetDays: number) => {
    const d = new Date(`${rosterDate}T00:00:00`);
    d.setDate(d.getDate() + offsetDays);
    setRosterDate(toYMD(d));
  }, [rosterDate]);

  const openLogModal = useCallback(() => {
    if (!canViewAll) setNewRecord((p) => ({ ...p, employee_id: myEmployee?.id || "" }));
    setShowLogModal(true);
  }, [canViewAll, myEmployee?.id]);

  if (loading && records.length === 0) {
    return (
      <div className="attendance-hub min-h-screen flex flex-col items-center justify-center bg-[#F8F9FB]">
        <div className="w-9 h-9 border-3 border-[#253C7D] border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-semibold text-gray-500">Loading attendance control center...</p>
      </div>
    );
  }

  if (isPartnerBranchBlocked) {
    return (
      <div className="attendance-hub min-h-screen bg-[#F8F9FB] p-5 sm:p-7 lg:p-8 font-sans">
        <AttendanceHeader
          currentTime={currentTime}
          activeTab={activeTab}
          dateRangeBounds={dateRangeBounds}
          canViewAll={false}
          hasEmployee={false}
          onExportCSV={() => {}}
          onOpenLogModal={() => {}}
        />
        <PartnerBranchPrivacyShield
          moduleName="Attendance & Time Tracking"
          userBranchName={userBranchName}
          hasNoBranch={!userBranchId}
        />
      </div>
    );
  }

  return (
    <div className="attendance-hub min-h-screen bg-[#F8F9FB] p-5 sm:p-7 lg:p-8 font-sans">
      {/* Top Header & Actions */}
      <AttendanceHeader
        currentTime={currentTime}
        activeTab={activeTab}
        dateRangeBounds={dateRangeBounds}
        canViewAll={canViewAll}
        hasEmployee={!!myEmployee}
        onExportCSV={handleExportCSV}
        onOpenLogModal={openLogModal}
      />

      {/* Self Check-In Banner */}
      <SelfCheckInBanner
        myEmployee={myEmployee}
        myTodayRecord={myTodayRecord}
      />

      {/* Executive KPI Bar */}
      <AttendanceKpiBar
        filterDatePreset={filterDatePreset}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        presentCount={presentCount}
        workingNow={workingNow}
        lateCount={lateCount}
        remoteCount={remoteCount}
        absentCount={absentCount}
      />

      {/* Work Site Summary Strip — compact modern filter pills */}
      {canManage && todayByWorkSite.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1 mr-1">
            <i className="ri-building-2-line" /> Sites:
          </span>
          <button
            onClick={() => setFilterWorkLocation("all")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[12px] font-bold transition-all cursor-pointer ${
              filterWorkLocation === "all"
                ? "bg-[#253C7D] border-[#253C7D] text-white shadow-xs"
                : "bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
            }`}
          >
            <span>All Sites</span>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
              filterWorkLocation === "all" ? "bg-white/20 text-white" : "bg-gray-100 text-gray-600"
            }`}>
              {todayByWorkSite.reduce((sum, s) => sum + s.present, 0)}
            </span>
          </button>

          {todayByWorkSite.map((site) => {
            const isSelected = filterWorkLocation === site.id;
            return (
              <button
                key={site.id}
                onClick={() => setFilterWorkLocation(isSelected ? "all" : site.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[12px] font-bold transition-all cursor-pointer ${
                  isSelected
                    ? "bg-[#253C7D] border-[#253C7D] text-white shadow-xs"
                    : "bg-white border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                <i className={`ri-building-2-line text-xs ${isSelected ? "text-white" : "text-[#253C7D]"}`} />
                <span className="truncate max-w-[150px]">{site.name}</span>
                {site.is_default && (
                  <span className={`text-[10px] ${isSelected ? "text-amber-300" : "text-amber-500"}`} title="Default site">
                    ★
                  </span>
                )}
                <span
                  className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full ${
                    isSelected
                      ? "bg-white/20 text-white"
                      : site.present > 0
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {site.present} in
                </span>
                {site.workingNowHere > 0 && (
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-1 ${
                      isSelected
                        ? "bg-emerald-400/30 text-emerald-200"
                        : "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    {site.workingNowHere}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Control Bar: Search, Date Picker, Department, Status Filters & View Mode */}
      <AttendanceControlBar
        canManage={canManage}
        filteredRecordsCount={filteredRecords.length}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        filterDatePreset={filterDatePreset}
        setFilterDatePreset={setFilterDatePreset}
        singleDate={singleDate}
        setSingleDate={setSingleDate}
        fromDate={fromDate}
        setFromDate={setFromDate}
        toDate={toDate}
        setToDate={setToDate}
        departments={departments}
        filterDepartment={filterDepartment}
        setFilterDepartment={setFilterDepartment}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        workLocations={workLocations}
        filterWorkLocation={filterWorkLocation}
        setFilterWorkLocation={setFilterWorkLocation}
        viewMode={viewMode}
        setViewMode={setViewMode}
        todayYMD={todayYMD}
      />

      {/* Attendance Records List / Cards View */}
      <RecordsTab
        filteredRecords={filteredRecords}
        pagedRecords={pagedRecords}
        viewMode={viewMode}
        todayYMD={todayYMD}
        canManage={canManage}
        pageSize={pageSize}
        setPageSize={setPageSize}
        page={page}
        setPage={setPage}
        totalPages={totalPages}
        onSelectRecord={setSelectedRecord}
        onEditRecord={setEditingRecord}
        onDeleteRecord={handleDeleteRecord}
      />

      {/* Side Drawer: Record Details */}
      <RecordDetailsDrawer
        selectedRecord={selectedRecord}
        onClose={() => setSelectedRecord(null)}
        canManage={canManage}
        onOpenEditModal={setEditingRecord}
        onDeleteRecord={handleDeleteRecord}
      />

      {/* Modal: Manual Log Attendance */}
      <LogAttendanceModal
        isOpen={showLogModal}
        onClose={() => setShowLogModal(false)}
        canManage={canManage}
        employees={employees}
        workLocations={workLocations}
        myEmployee={myEmployee}
        newRecord={newRecord}
        setNewRecord={setNewRecord}
        saving={saving}
        onSubmit={handleSaveNewRecord}
      />

      {/* Modal: Edit Attendance Record */}
      <EditAttendanceModal
        editingRecord={editingRecord}
        setEditingRecord={setEditingRecord}
        workLocations={workLocations}
        saving={saving}
        onClose={() => setEditingRecord(null)}
        onSubmit={handleUpdateRecord}
      />
    </div>
  );
}
