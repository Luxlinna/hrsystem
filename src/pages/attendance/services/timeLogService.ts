import { supabase } from "@/lib/supabase";
import { logActivity } from "@/lib/audit";
import type { WorkLocation } from "../types";

export interface SaveTimeLogParams {
  employeeId: string;
  date: string;
  time24h: string;
  logType: "in" | "out";
  logSiteId: string;
  sites: WorkLocation[];
  remark: string;
  actorName: string;
  actorRole: string;
  effectiveBranch?: string | null;
  displayTime: string;
  customStatus?: "ontime" | "late";
  customLateMinutes?: number;
  workStartTime?: string;
  graceMinutes?: number;
}

export async function saveTimeLogRecord(params: SaveTimeLogParams) {
  const {
    employeeId, date, time24h, logType, logSiteId, sites,
    remark, actorName, actorRole, effectiveBranch, displayTime,
  } = params;

  const { data: existing, error: fetchErr } = await supabase
    .from("attendance_records")
    .select("*")
    .eq("employee_id", employeeId).eq("date", date)
    .is("deleted_at", null).maybeSingle();

  if (fetchErr) throw fetchErr;
  const formattedRemark = remark.trim() ? `[Time Log] ${remark.trim()}` : null;

  const effectiveLocId = (logSiteId && logSiteId !== "main") ? logSiteId : null;

  if (logType === "in") {
    const schedStart = params.workStartTime || "09:00";
    const grace = params.graceMinutes ?? 15;
    const [stH, stM] = schedStart.split(":").map(Number);
    const [inH, inM] = time24h.slice(0, 5).split(":").map(Number);
    const startMin = (isNaN(stH) ? 9 : stH) * 60 + (isNaN(stM) ? 0 : stM);
    const punchMin = inH * 60 + inM;
    const graceThresholdMin = startMin + grace;
    const isLate = punchMin > graceThresholdMin;
    const autoLateMinutes = isLate ? punchMin - graceThresholdMin : 0;
    const autoStatus = isLate ? "late" : "ontime";

    const finalStatus = params.customStatus || autoStatus;
    const finalLateMinutes = params.customLateMinutes !== undefined
      ? params.customLateMinutes
      : (finalStatus === "late" ? autoLateMinutes : 0);

    if (existing) {
      let hoursWorked = existing.hours_worked;
      if (existing.clock_out) {
        const [outH, outM] = existing.clock_out.slice(0, 5).split(":").map(Number);
        const totalM = outH * 60 + outM - (inH * 60 + inM);
        hoursWorked = totalM > 0 ? parseFloat((totalM / 60).toFixed(2)) : 0;
      }
      await supabase.from("attendance_records").update({
        clock_in: time24h,
        clock_in_branch_id: effectiveBranch || existing.clock_in_branch_id || null,
        work_location_id: effectiveLocId || existing.work_location_id || null,
        status: finalStatus,
        late_minutes: finalLateMinutes,
        hours_worked: hoursWorked,
        notes: [existing.notes, formattedRemark].filter(Boolean).join(" | ") || null,
      }).eq("id", existing.id);
    } else {
      await supabase.from("attendance_records").insert({
        employee_id: employeeId,
        date,
        clock_in: time24h,
        clock_in_branch_id: effectiveBranch || null,
        work_location_id: effectiveLocId,
        status: finalStatus,
        late_minutes: finalLateMinutes,
        notes: formattedRemark,
      });
    }
  } else {
    if (existing) {
      let hoursWorked = existing.hours_worked;
      if (existing.clock_in) {
        const [inH, inM] = existing.clock_in.slice(0, 5).split(":").map(Number);
        const [outH, outM] = time24h.slice(0, 5).split(":").map(Number);
        const totalM = outH * 60 + outM - (inH * 60 + inM);
        hoursWorked = totalM > 0 ? parseFloat((totalM / 60).toFixed(2)) : 0;
      }
      await supabase.from("attendance_records").update({
        clock_out: time24h,
        clock_out_branch_id: effectiveBranch || existing.clock_out_branch_id || null,
        work_location_id: effectiveLocId || existing.work_location_id || null,
        hours_worked: hoursWorked,
        notes: [existing.notes, formattedRemark].filter(Boolean).join(" | ") || null,
      }).eq("id", existing.id);
    } else {
      await supabase.from("attendance_records").insert({
        employee_id: employeeId,
        date,
        clock_out: time24h,
        clock_out_branch_id: effectiveBranch || null,
        work_location_id: effectiveLocId,
        status: "ontime",
        notes: formattedRemark,
      });
    }
  }

  logActivity({
    module: "attendance",
    action: "created",
    entityType: "attendance_record",
    actorName,
    actorRole,
    description: `Logged manual ${logType === "in" ? "Time In" : "Time Out"} (${displayTime}) on ${date}`,
    branchId: effectiveBranch,
  });
}
