import React, { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { toast } from "@/components/Toast";
import { toYMD, todayYMD as todayYMDLib } from "@/lib/date";
import type {
  Employee,
  AttendanceRecord,
  NewRecordForm,
  AttendanceTabKey,
  ViewMode,
  DatePreset,
  EmployeeSummaryItem,
  MatrixDay,
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
import { DayRosterTab } from "./tabs/DayRosterTab";
import { MonthlyMatrixTab } from "./tabs/MonthlyMatrixTab";
import { ScorecardTab } from "./tabs/ScorecardTab";

export default function AttendancePage() {
  const { user } = useAuth();
  const actorName = (user?.user_metadata?.display_name as string) || user?.email || "Unknown";
  const { role, isAdmin, loading: permsLoading } = usePermissions();
  const canViewAll = isAdmin || !!role?.attendance_view_all_employees;
  const canViewOwnBranch = !canViewAll && !!role?.attendance_view_own_branch;
  const canManage = canViewAll || canViewOwnBranch;

  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [myEmployee, setMyEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);

  // Tabs & Views
  const [activeTab, setActiveTab] = useState<AttendanceTabKey>("records");
  const [viewMode, setViewMode] = useState<ViewMode>("table");

  // Filters & Historical Date Ranges
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
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
    clock_in: "09:00",
    clock_out: "18:00",
    status: "present",
    late_minutes: 0,
    notes: "",
  });

  const fetchData = useCallback(async () => {
    setLoading(true);

    if (canViewAll) {
      const [recRes, empRes] = await Promise.all([
        supabase
          .from("attendance_records")
          .select("*, employees(id, first_name, last_name, department, role, avatar_url, branch_id, branches(id, name))")
          .is("deleted_at", null)
          .order("date", { ascending: false })
          .limit(2000),
        supabase
          .from("employees")
          .select("id, first_name, last_name, department, role, avatar_url, branch_id, branches(id, name)")
          .eq("status", "active")
          .order("first_name"),
      ]);
      if (recRes.data) setRecords(recRes.data as unknown as AttendanceRecord[]);
      if (empRes.data) setEmployees(empRes.data as unknown as Employee[]);
      setLoading(false);
      return;
    }

    if (!user?.email) {
      setLoading(false);
      return;
    }

    const { data: me } = await supabase
      .from("employees")
      .select("id, first_name, last_name, department, role, avatar_url, branch_id, branches(id, name)")
      .eq("email", user.email)
      .maybeSingle();

    setMyEmployee(me as unknown as Employee | null);

    if (!me) {
      setEmployees([]);
      setRecords([]);
      setLoading(false);
      return;
    }

    if (canViewOwnBranch && me.branch_id) {
      const { data: team } = await supabase
        .from("employees")
        .select("id, first_name, last_name, department, role, avatar_url, branch_id, branches(id, name)")
        .eq("status", "active")
        .eq("branch_id", me.branch_id)
        .order("first_name");
      setEmployees((team as unknown as Employee[]) || []);

      const ids = (team || []).map((e) => e.id);
      const { data: recData } = ids.length
        ? await supabase
            .from("attendance_records")
            .select("*, employees(id, first_name, last_name, department, role, avatar_url, branch_id, branches(id, name))")
            .is("deleted_at", null)
            .in("employee_id", ids)
            .order("date", { ascending: false })
            .limit(2000)
        : { data: [] };
      setRecords((recData as unknown as AttendanceRecord[]) || []);
      setLoading(false);
      return;
    }

    setEmployees([me as unknown as Employee]);
    const { data: recData } = await supabase
      .from("attendance_records")
      .select("*, employees(id, first_name, last_name, department, role, avatar_url, branch_id, branches(id, name))")
      .eq("employee_id", me.id)
      .is("deleted_at", null)
      .order("date", { ascending: false })
      .limit(1000);
    setRecords((recData as unknown as AttendanceRecord[]) || []);
    setLoading(false);
  }, [canViewAll, canViewOwnBranch, user?.email]);

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
        if (!empName.includes(q) && !empRole.includes(q) && !dept.includes(q) && !notes.includes(q) && !dateStr.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [records, filterStatus, filterDepartment, dateRangeBounds, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pagedRecords = useMemo(
    () => filteredRecords.slice((safePage - 1) * pageSize, safePage * pageSize),
    [filteredRecords, safePage, pageSize]
  );

  useEffect(() => {
    setPage(1);
  }, [searchQuery, filterDepartment, filterStatus, filterDatePreset, fromDate, toDate, singleDate, pageSize]);

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
    () => activeScopeRecords.filter((r) => r.status === "present" || r.status === "remote").length,
    [activeScopeRecords]
  );
  const lateCount = useMemo(() => activeScopeRecords.filter((r) => r.status === "late").length, [activeScopeRecords]);
  const absentCount = useMemo(() => activeScopeRecords.filter((r) => r.status === "absent").length, [activeScopeRecords]);
  const remoteCount = useMemo(() => activeScopeRecords.filter((r) => r.status === "remote").length, [activeScopeRecords]);
  const workingNow = useMemo(
    () => records.filter((r) => r.date === todayYMD && r.clock_in && !r.clock_out).length,
    [records, todayYMD]
  );

  const rosterRecords = useMemo(() => records.filter((r) => r.date === rosterDate), [records, rosterDate]);

  // Employee Summary & Ratings
  const employeeSummary: EmployeeSummaryItem[] = useMemo(() => {
    return employees.map((emp) => {
      const empRecords = activeScopeRecords.filter((r) => r.employee_id === emp.id);
      const present = empRecords.filter((r) => r.status === "present" || r.status === "remote").length;
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

    const { error } = await supabase.from("attendance_records").insert({
      employee_id: newRecord.employee_id,
      date: newRecord.date,
      clock_in: newRecord.clock_in || null,
      clock_out: newRecord.clock_out || null,
      status: newRecord.status,
      late_minutes: newRecord.status === "late" ? newRecord.late_minutes : 0,
      notes: newRecord.notes ? newRecord.notes.trim() : null,
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
    setShowLogModal(false);
    setNewRecord({
      employee_id: "",
      date: todayYMD,
      clock_in: "09:00",
      clock_out: "18:00",
      status: "present",
      late_minutes: 0,
      notes: "",
    });
    fetchData();
  }, [newRecord, saving, todayYMD, fetchData]);

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
      })
      .eq("id", editingRecord.id);

    setSaving(false);
    if (error) {
      toast("Error", "Failed to update record", "error");
      return;
    }

    toast("Attendance Updated", "Changes saved successfully.", "success");
    setEditingRecord(null);
    if (selectedRecord && selectedRecord.id === editingRecord.id) {
      setSelectedRecord(editingRecord);
    }
    fetchData();
  }, [editingRecord, saving, selectedRecord, fetchData]);

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
    setSelectedRecord(null);
    setEditingRecord(null);
    fetchData();
  }, [actorName, fetchData]);

  // Export CSV
  const handleExportCSV = useCallback(() => {
    if (filteredRecords.length === 0) {
      toast("Export", "No records to export with current filters", "warning");
      return;
    }

    const headers = ["Employee", "Department", "Role", "Date", "Check In", "Check Out", "Hours", "Status", "Late (Min)", "Notes"];
    const rows = filteredRecords.map((r) => [
      `"${r.employees ? `${r.employees.first_name} ${r.employees.last_name}` : "Unknown"}"`,
      `"${r.employees?.department || ""}"`,
      `"${r.employees?.role || ""}"`,
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
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        presentCount={presentCount}
        workingNow={workingNow}
        lateCount={lateCount}
        remoteCount={remoteCount}
        absentCount={absentCount}
      />

      {/* Control Bar: Tabs, View Switcher & Filters */}
      <AttendanceControlBar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
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
        viewMode={viewMode}
        setViewMode={setViewMode}
        todayYMD={todayYMD}
      />

      {/* Tab 1: Attendance Records Tab */}
      {activeTab === "records" && (
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
      )}

      {/* Tab 2: Day Roster & Presence Tab */}
      {activeTab === "live" && (
        <DayRosterTab
          rosterDate={rosterDate}
          setRosterDate={setRosterDate}
          todayYMD={todayYMD}
          filteredSummary={filteredSummary}
          onChangeRosterDate={changeRosterDate}
        />
      )}

      {/* Tab 3: Monthly Timesheet Matrix Tab */}
      {activeTab === "matrix" && (
        <MonthlyMatrixTab
          matrixMonth={matrixMonth}
          setMatrixMonth={setMatrixMonth}
          matrixDays={matrixDays}
          filteredSummary={filteredSummary}
          records={records}
          onSelectRecord={setSelectedRecord}
        />
      )}

      {/* Tab 4: Employee Punctuality & Scorecard Tab */}
      {activeTab === "summary" && (
        <ScorecardTab
          filteredSummary={filteredSummary}
        />
      )}

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
        saving={saving}
        onClose={() => setEditingRecord(null)}
        onSubmit={handleUpdateRecord}
      />
    </div>
  );
}
