import { supabase } from "@/lib/supabase";
import type { ReportConfig } from "../types";
import { matchesEmployeeFilters, formatDateTime } from "../reportsUtils";
import type { ReportResult } from "./reportTypes";

export const fetchDailyLogsReport = async (config: ReportConfig): Promise<ReportResult> => {
  let q = supabase
    .from("work_logs")
    .select("id, log_date, start_time, end_time, activity, notes, deleted_at, deleted_by, employees(first_name, last_name, department, branches(name))")
    .order("log_date", { ascending: false });

  if (config.dateFrom) q = q.gte("log_date", config.dateFrom);
  if (config.dateTo) q = q.lte("log_date", config.dateTo);
  const { data } = await q;

  const fmt = (t: string | null) => (t ? new Date(`2000-01-01T${t}`).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "");
  const mapped = (data || [])
    .map((r: any) => {
      const isDeleted = Boolean(r.deleted_at);
      return {
        id: r.id,
        employee: `${r.employees?.first_name || ""} ${r.employees?.last_name || ""}`.trim(),
        department: r.employees?.department || "—",
        branch: r.employees?.branches?.name || "—",
        date: r.log_date,
        time: r.start_time || r.end_time ? `${fmt(r.start_time)} – ${fmt(r.end_time)}` : "—",
        activity: r.activity,
        notes: r.notes || "",
        status: isDeleted ? "deleted" : "logged",
        deleted_at: r.deleted_at || null,
        deleted_by: r.deleted_by || "—",
        deleted_at_formatted: formatDateTime(r.deleted_at),
      };
    })
    .filter((r) => matchesEmployeeFilters(r, config));

  const cols = ["Employee", "Department", "Branch", "Date", "Time", "Activity", "Deleted By", "Deleted Date & Time", "Notes"];

  const deletedCount = mapped.filter((r) => r.status === "deleted" || Boolean(r.deleted_at)).length;
  const summary: Record<string, string | number> = {
    "Total Entries": mapped.length,
    "Employees Logged": new Set(mapped.map((r) => r.employee)).size,
    "Date Range": mapped.length ? `${mapped[mapped.length - 1].date} → ${mapped[0].date}` : "—",
    ...(deletedCount > 0 ? { "Deleted Entries": deletedCount } : {}),
  };

  return { rows: mapped, columns: cols, summary };
};

export const fetchMeetingRoomsReport = async (config: ReportConfig): Promise<ReportResult> => {
  let q = supabase
    .from("room_bookings")
    .select("id, title, date, start_time, end_time, attendees_count, status, deleted_at, deleted_by, meeting_rooms(name, floor), employees:booked_by(first_name, last_name, department, branches(name))")
    .order("date", { ascending: false })
    .order("start_time", { ascending: false });

  if (config.dateFrom) q = q.gte("date", config.dateFrom);
  if (config.dateTo) q = q.lte("date", config.dateTo);
  const { data, error } = await q;
  if (error) {
    console.error("fetchRoomBookings error:", error);
  }

  const fmtTime = (t: string | null) => (t ? new Date(`2000-01-01T${t}`).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "");
  const mapped = (data || [])
    .map((r: any) => {
      const empName = `${r.employees?.first_name || ""} ${r.employees?.last_name || ""}`.trim();
      const roomFloor = r.meeting_rooms?.floor || (r.meeting_rooms?.name?.includes("VIP") ? 5 : 3);
      const roomDisplay = r.meeting_rooms?.name
        ? `${r.meeting_rooms.name} (Floor ${roomFloor})`
        : "—";
      const isDeleted = Boolean(r.deleted_at);

      return {
        id: r.id,
        room_name: roomDisplay,
        title: r.title,
        employee: empName || "Unknown",
        department: r.employees?.department || "—",
        branch: r.employees?.branches?.name || "—",
        date: r.date,
        time: r.start_time || r.end_time ? `${fmtTime(r.start_time)} – ${fmtTime(r.end_time)}` : "—",
        attendees: r.attendees_count || 1,
        status: isDeleted ? "deleted" : (r.status || "approved"),
        deleted_at: r.deleted_at || null,
        deleted_by: r.deleted_by || "—",
        deleted_at_formatted: formatDateTime(r.deleted_at),
      };
    })
    .filter((r) => matchesEmployeeFilters(r, config));

  const cols = ["Room", "Title", "Booked By", "Department", "Branch", "Date", "Time", "Attendees", "Status", "Deleted By", "Deleted Date & Time"];

  const approved = mapped.filter((r) => r.status === "approved").length;
  const pending = mapped.filter((r) => r.status === "pending").length;
  const cancelled = mapped.filter((r) => r.status === "cancelled").length;
  const rejected = mapped.filter((r) => r.status === "rejected").length;
  const deletedCount = mapped.filter((r) => r.status === "deleted" || Boolean(r.deleted_at)).length;

  const summary: Record<string, string | number> = {
    "Total Bookings": mapped.length,
    Approved: approved,
    Pending: pending,
    "Cancelled / Rejected": cancelled + rejected,
    ...(deletedCount > 0 ? { "Deleted Bookings": deletedCount } : {}),
  };

  return { rows: mapped, columns: cols, summary };
};
