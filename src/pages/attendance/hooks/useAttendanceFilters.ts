import { useState, useMemo, useCallback, useEffect } from "react";
import { toYMD } from "@/lib/date";
import { toast } from "@/components/Toast";
import type { AttendanceRecord, AttendanceTabKey, DatePreset, Employee, ViewMode } from "../types";
import { calcHours } from "../constants";

export function useAttendanceFilters(records: AttendanceRecord[], employees: Employee[], todayYMD: string) {
  const [activeTab, setActiveTab] = useState<AttendanceTabKey>("records");
  const [viewMode, setViewMode] = useState<ViewMode>("table");
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
  const [rosterDate, setRosterDate] = useState(toYMD(new Date()));

  const now = new Date();
  const [matrixMonth, setMatrixMonth] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`);

  const departments = useMemo(() => {
    const set = new Set<string>();
    employees.forEach((e) => { if (e.department) set.add(e.department); });
    return Array.from(set).sort();
  }, [employees]);

  const dateRangeBounds = useMemo(() => {
    const cur = new Date();
    if (filterDatePreset === "today") return { start: todayYMD, end: todayYMD };
    if (filterDatePreset === "yesterday") {
      const y = new Date(); y.setDate(y.getDate() - 1);
      const yStr = toYMD(y);
      return { start: yStr, end: yStr };
    }
    if (filterDatePreset === "this_week") {
      const start = new Date(cur); start.setDate(cur.getDate() - cur.getDay());
      return { start: toYMD(start), end: todayYMD };
    }
    if (filterDatePreset === "last_week") {
      const start = new Date(cur); start.setDate(cur.getDate() - cur.getDay() - 7);
      const end = new Date(start); end.setDate(start.getDate() + 6);
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
    if (filterDatePreset === "single_date" && singleDate) return { start: singleDate, end: singleDate };
    if (filterDatePreset === "custom_range") return { start: fromDate || "1970-01-01", end: toDate || "2099-12-31" };
    return null;
  }, [filterDatePreset, singleDate, fromDate, toDate, todayYMD]);

  const activeScopeRecords = useMemo(() => {
    if (dateRangeBounds) {
      return records.filter((r) => r.date >= dateRangeBounds.start && r.date <= dateRangeBounds.end);
    }
    return records;
  }, [records, dateRangeBounds]);

  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      if (filterStatus !== "all" && r.status !== filterStatus) return false;
      if (filterDepartment !== "all" && r.employees?.department !== filterDepartment) return false;
      if (filterWorkLocation !== "all" && r.work_location_id !== filterWorkLocation) return false;
      if (dateRangeBounds && (r.date < dateRangeBounds.start || r.date > dateRangeBounds.end)) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const empName = `${r.employees?.first_name || ""} ${r.employees?.last_name || ""}`.toLowerCase();
        const empRole = (r.employees?.role || "").toLowerCase();
        const dept = (r.employees?.department || "").toLowerCase();
        const notes = (r.notes || "").toLowerCase();
        const dateStr = r.date.toLowerCase();
        const site = (r.work_location?.name || "").toLowerCase();
        if (!empName.includes(q) && !empRole.includes(q) && !dept.includes(q) && !notes.includes(q) && !dateStr.includes(q) && !site.includes(q)) return false;
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

  useEffect(() => { setPage(1); }, [searchQuery, filterDepartment, filterStatus, filterWorkLocation, filterDatePreset, fromDate, toDate, singleDate, pageSize]);
  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [page, totalPages]);

  const changeRosterDate = useCallback((offsetDays: number) => {
    const d = new Date(`${rosterDate}T00:00:00`);
    d.setDate(d.getDate() + offsetDays);
    setRosterDate(toYMD(d));
  }, [rosterDate]);

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
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `attendance_export_${dateRangeBounds?.start || "all"}_to_${dateRangeBounds?.end || "all"}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast("Export Complete", `Exported ${filteredRecords.length} records to CSV`, "success");
  }, [filteredRecords, dateRangeBounds]);

  return {
    activeTab, setActiveTab,
    viewMode, setViewMode,
    searchQuery, setSearchQuery,
    filterDepartment, setFilterDepartment,
    filterStatus, setFilterStatus,
    filterWorkLocation, setFilterWorkLocation,
    pageSize, setPageSize,
    page, setPage,
    filterDatePreset, setFilterDatePreset,
    fromDate, setFromDate,
    toDate, setToDate,
    singleDate, setSingleDate,
    rosterDate, setRosterDate,
    matrixMonth, setMatrixMonth,
    departments,
    dateRangeBounds,
    activeScopeRecords,
    filteredRecords,
    pagedRecords,
    totalPages,
    changeRosterDate,
    handleExportCSV,
  };
}
