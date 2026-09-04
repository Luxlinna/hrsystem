import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { zonedDayOfWeek, zonedParts, zonedTimeToInstant } from "@/lib/date";
import { computeHoursWorked } from "@/lib/workSchedule";
import { notifyAttendanceEvent } from "@/lib/attendanceNotify";
import type { AttendanceRecord, BranchGeofence, OutsideWorkTask } from "../types";

interface UseClockInOutActionsProps {
  employeeId: string;
  employeeName: string;
  today: string;
  todayRecord: AttendanceRecord | null;
  branch: BranchGeofence | null;
  scheduleSettings: {
    timezone: string;
    lateGraceMinutes: number;
    earlyLeaveGraceMinutes: number;
    breakStartTime: string;
    breakEndTime: string;
  };
  daySchedule: { startTime: string; endTime: string } | null;
  workStartTime: string;
  workEndTime: string | null;
  defaultWorkLocationId: string | null;
  todayOutsideWork: OutsideWorkTask | null;
  notes: string;
  setNotes: (n: string) => void;
  earlyCheckoutReason: string;
  setEarlyCheckoutReason: (r: string) => void;
  resetCheckInFlow: () => void;
  showToast: (type: string, message: string) => void;
  loadRecords: () => Promise<void>;
}

export function useClockInOutActions({
  employeeId,
  employeeName,
  today,
  todayRecord,
  branch,
  scheduleSettings,
  daySchedule,
  workStartTime,
  workEndTime,
  defaultWorkLocationId,
  todayOutsideWork,
  notes,
  setNotes,
  earlyCheckoutReason,
  setEarlyCheckoutReason,
  resetCheckInFlow,
  showToast,
  loadRecords,
}: UseClockInOutActionsProps) {
  const [processing, setProcessing] = useState(false);

  const handleClockIn = useCallback(async () => {
    if (todayOutsideWork && todayOutsideWork.work_status !== "checked_out") {
      showToast("error", "You have an outside work task today. Please check in via Task Management.");
      return;
    }
    if (!daySchedule) {
      showToast("error", "Today is not configured as a working day.");
      return;
    }
    const now = new Date();
    const nowZ = zonedParts(now, scheduleSettings.timezone);
    const timeStr = `${String(nowZ.hh).padStart(2, "0")}:${String(nowZ.mm).padStart(2, "0")}:${String(nowZ.ss).padStart(2, "0")}`;
    const [startH, startM] = workStartTime.split(":").map(Number);
    const rawLateMinutes = Math.max(0, nowZ.minutesOfDay - (startH * 60 + startM));
    const effectiveLateGrace = branch?.late_grace_minutes ?? scheduleSettings.lateGraceMinutes ?? 15;
    const isLate = rawLateMinutes > effectiveLateGrace;
    const lateMinutes = isLate ? rawLateMinutes - effectiveLateGrace : 0;
    const status = isLate ? "late" : "ontime";

    const { error } = await supabase.from("attendance_records").upsert(
      {
        employee_id: employeeId,
        date: today,
        clock_in: timeStr,
        status,
        late_minutes: lateMinutes,
        notes: notes || null,
        work_location_id: defaultWorkLocationId || null,
      },
      { onConflict: "employee_id,date" }
    );

    setProcessing(false);
    resetCheckInFlow();
    if (error) {
      showToast("error", "Failed to check in. Please try again.");
    } else {
      const lateMessage = isLate
        ? ` — Late by ${lateMinutes}m (${rawLateMinutes}m after start, ${effectiveLateGrace}m grace)`
        : rawLateMinutes > 0
        ? ` — On time (${rawLateMinutes}m within grace chance)`
        : " — On time!";
      showToast(
        "success",
        `Checked in at ${now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}${lateMessage}`
      );
      setNotes("");
      setEarlyCheckoutReason("");
      loadRecords();
      notifyAttendanceEvent({
        employeeName,
        employeeId,
        type: "in",
        isException: isLate,
        exceptionMinutes: isLate ? lateMinutes : 0,
        date: today,
        time: timeStr,
        branchName: branch?.name,
      });
    }
  }, [todayOutsideWork, daySchedule, scheduleSettings, workStartTime, employeeId, today, notes, defaultWorkLocationId, resetCheckInFlow, showToast, setNotes, setEarlyCheckoutReason, loadRecords, employeeName, branch]);

  const handleClockOut = useCallback(async () => {
    if (todayOutsideWork && todayOutsideWork.work_status !== "checked_out") {
      showToast("error", "You have an outside work assignment today. Please check out via Task Management.");
      return;
    }
    if (!todayRecord) return;
    const now = new Date();
    const nowZ = zonedParts(now, scheduleSettings.timezone);
    const timeStr = `${String(nowZ.hh).padStart(2, "0")}:${String(nowZ.mm).padStart(2, "0")}:${String(nowZ.ss).padStart(2, "0")}`;

    const [ciH, ciM, ciS] = (todayRecord.clock_in || "00:00:00").split(":").map(Number);
    const clockInTime = todayRecord.clock_in ? zonedTimeToInstant(today, ciH, ciM, ciS, scheduleSettings.timezone) : null;
    const effectiveBreakStart = branch?.break_start_time?.slice(0, 5) || scheduleSettings.breakStartTime;
    const effectiveBreakEnd = branch?.break_end_time?.slice(0, 5) || scheduleSettings.breakEndTime;
    const hoursWorked = clockInTime
      ? computeHoursWorked(clockInTime, now, effectiveBreakStart, effectiveBreakEnd)
      : null;

    const isSaturday = zonedDayOfWeek(now, scheduleSettings.timezone) === 6;
    const defaultEndMin = isSaturday ? 12 * 60 : 17 * 60; // 12:00 PM Sat, 5:00 PM Mon-Fri

    let rawEarlyMinutes = 0;
    if (workEndTime) {
      const [endH, endM] = workEndTime.split(":").map(Number);
      rawEarlyMinutes = Math.max(0, endH * 60 + endM - nowZ.minutesOfDay);
    } else {
      rawEarlyMinutes = Math.max(0, defaultEndMin - nowZ.minutesOfDay);
    }

    const effectiveEarlyGrace = branch?.early_leave_grace_minutes ?? scheduleSettings.earlyLeaveGraceMinutes ?? 15;
    const isEarlyLeave = rawEarlyMinutes > effectiveEarlyGrace;
    const earlyLeaveMinutes = isEarlyLeave ? rawEarlyMinutes - effectiveEarlyGrace : 0;
    const requiresReason = isEarlyLeave;
    if (requiresReason && !earlyCheckoutReason.trim()) {
      showToast("error", "Please enter a reason before checking out early.");
      return;
    }

    setProcessing(true);
    const checkoutNotes = requiresReason
      ? [todayRecord.notes, `Early checkout reason: ${earlyCheckoutReason.trim()}`].filter(Boolean).join("\n")
      : todayRecord.notes;

    const { error } = await supabase
      .from("attendance_records")
      .update({ clock_out: timeStr, hours_worked: hoursWorked, early_leave_minutes: earlyLeaveMinutes, notes: checkoutNotes })
      .eq("id", todayRecord.id);

    setProcessing(false);
    if (error) {
      showToast("error", "Failed to check out. Please try again.");
    } else {
      const hrs = hoursWorked ? `${Math.floor(hoursWorked)}h ${Math.round((hoursWorked % 1) * 60)}m worked` : "";
      const earlyNote = isEarlyLeave ? ` — ${earlyLeaveMinutes} min early` : "";
      showToast("success", `Checked out at ${now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}${hrs ? ` — ${hrs}` : ""}${earlyNote}`);
      loadRecords();
      notifyAttendanceEvent({
        employeeName,
        employeeId,
        type: "out",
        isException: isEarlyLeave,
        exceptionMinutes: isEarlyLeave ? earlyLeaveMinutes : 0,
        date: today,
        time: timeStr,
        branchName: branch?.name,
      });
    }
  }, [todayOutsideWork, todayRecord, scheduleSettings, today, workEndTime, earlyCheckoutReason, showToast, loadRecords, employeeName, employeeId, branch]);

  return {
    processing,
    setProcessing,
    handleClockIn,
    handleClockOut,
  };
}
