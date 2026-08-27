import { supabase } from "@/lib/supabase";
import type { ReportConfig } from "../types";
import { matchesEmployeeFilters, formatDateTime } from "../reportsUtils";
import type { ReportResult } from "./reportTypes";

export const fetchShiftsReport = async (config: ReportConfig): Promise<ReportResult> => {
  let shiftQuery = supabase
    .from("shifts")
    .select("id, name, branch_id, department, start_time, end_time, shift_date, capacity, color, notes, deleted_at, deleted_by, branches(name)")
    .order("shift_date", { ascending: false })
    .order("start_time", { ascending: true });

  if (config.dateFrom) shiftQuery = shiftQuery.gte("shift_date", config.dateFrom);
  if (config.dateTo) shiftQuery = shiftQuery.lte("shift_date", config.dateTo);

  const [{ data: shiftData, error: sErr }, { data: assignData, error: aErr }] = await Promise.all([
    shiftQuery,
    supabase
      .from("shift_assignments")
      .select("id, shift_id, employee_id, status, deleted_at, deleted_by, employees(first_name, last_name, department, role, branches(name))"),
  ]);

  if (sErr) console.error("fetchShifts shifts error:", sErr);
  if (aErr) console.error("fetchShifts assignments error:", aErr);

  const calcHours = (start?: string, end?: string): number => {
    if (!start || !end) return 0;
    const [sH, sM] = start.split(":").map(Number);
    const [eH, eM] = end.split(":").map(Number);
    let sm = sH * 60 + sM;
    let em = eH * 60 + eM;
    if (em < sm) em += 24 * 60;
    return Math.round(((em - sm) / 60) * 10) / 10;
  };

  const mapped: any[] = [];
  const shiftsList = shiftData || [];
  const assignsList = assignData || [];

  shiftsList.forEach((s: any) => {
    const shiftAssigns = assignsList.filter((a: any) => a.shift_id === s.id);
    const durationHours = calcHours(s.start_time, s.end_time);
    const timeDisplay = s.start_time && s.end_time ? `${s.start_time.slice(0, 5)} – ${s.end_time.slice(0, 5)}` : "—";
    const branchName = s.branches?.name || "—";
    const capacity = s.capacity || 1;
    const activeShiftAssigns = shiftAssigns.filter((a: any) => !a.deleted_at && !s.deleted_at);

    if (shiftAssigns.length > 0) {
      shiftAssigns.forEach((a: any) => {
        const empName = `${a.employees?.first_name || ""} ${a.employees?.last_name || ""}`.trim() || "Assigned Staff";
        const empDept = a.employees?.department || s.department || "—";
        const empBranch = a.employees?.branches?.name || branchName;
        const isDeleted = Boolean(a.deleted_at || s.deleted_at);
        const delAt = a.deleted_at || s.deleted_at;
        const delBy = a.deleted_by || s.deleted_by;

        mapped.push({
          id: a.id,
          shift_date: s.shift_date,
          shift_name: s.name,
          employee: empName,
          department: empDept,
          branch: empBranch,
          time: `${timeDisplay} (${durationHours}h)`,
          hours: durationHours,
          capacity: capacity,
          staffing: `${activeShiftAssigns.length}/${capacity}`,
          status: isDeleted ? "deleted" : (a.status || "scheduled"),
          notes: s.notes || "",
          deleted_at: delAt || null,
          deleted_by: delBy || "—",
          deleted_at_formatted: formatDateTime(delAt),
        });
      });
    } else {
      const isDeleted = Boolean(s.deleted_at);
      mapped.push({
        id: s.id,
        shift_date: s.shift_date,
        shift_name: s.name,
        employee: "— (Open / Needs Staff)",
        department: s.department || "—",
        branch: branchName,
        time: `${timeDisplay} (${durationHours}h)`,
        hours: durationHours,
        capacity: capacity,
        staffing: `0/${capacity}`,
        status: isDeleted ? "deleted" : "open",
        notes: s.notes || "",
        deleted_at: s.deleted_at || null,
        deleted_by: s.deleted_by || "—",
        deleted_at_formatted: formatDateTime(s.deleted_at),
      });
    }
  });

  const filtered = mapped.filter((r) => matchesEmployeeFilters(r, config));
  const cols = ["Shift Date", "Shift Name", "Employee", "Department", "Branch", "Time", "Hours", "Capacity", "Staffing", "Status", "Deleted By", "Deleted Date & Time", "Notes"];

  const activeRows = filtered.filter((r) => r.status !== "deleted");
  const totalScheduledHours = activeRows.reduce((acc, r) => acc + (r.status !== "open" ? r.hours : 0), 0);
  const assignedStaffCount = activeRows.filter((r) => r.status !== "open").length;
  const openSlotsCount = activeRows.filter((r) => r.status === "open").length;
  const totalCapacitySum = shiftsList.filter((s: any) => !s.deleted_at).reduce((acc: number, s: any) => acc + (s.capacity || 1), 0);
  const coveragePct = totalCapacitySum > 0 ? Math.round((assignedStaffCount / totalCapacitySum) * 100) : 100;
  const deletedCount = filtered.filter((r) => r.status === "deleted" || Boolean(r.deleted_at)).length;

  const summary: Record<string, string | number> = {
    "Total Shifts": shiftsList.length,
    "Scheduled Hours": `${Math.round(totalScheduledHours * 10) / 10} hrs`,
    "Staff Assigned": assignedStaffCount,
    "Open Slots": openSlotsCount,
    "Staffing Coverage": `${coveragePct}%`,
    ...(deletedCount > 0 ? { "Deleted Shifts / Slots": deletedCount } : {}),
  };

  return { rows: filtered, columns: cols, summary };
};
