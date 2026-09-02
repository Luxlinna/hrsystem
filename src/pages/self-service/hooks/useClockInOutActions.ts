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
    const lateMinutes = Math.max(0, nowZ.minutesOfDay - (startH * 60 + startM));
    const status = lateMinutes > 0 ? "late" : "ontime";

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
      showToast(
        "success",
        `Checked in at ${now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}${lateMinutes > 0 ? ` — ${lateMinutes} min late` : " — On time!"}`
      );
      setNotes("");
      setEarlyCheckoutReason("");
      loadRecords();
      notifyAttendanceEvent({
        employeeName,
        employeeId,
        type: "in",
        isException: lateMinutes > 0,
        exceptionMinutes: lateMinutes,
        date: today,
        time: timeStr,
        branchName: branch?.name,
      });
    }
  }, [todayOutsideWork, daySchedule, scheduleSettings.timezone, workStartTime, employeeId, today, notes, defaultWorkLocationId, resetCheckInFlow, showToast, setNotes, setEarlyCheckoutReason, loadRecords, employeeName, branch?.name]);

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

    let earlyLeaveMinutes = 0;
    if (workEndTime) {
      const [endH, endM] = workEndTime.split(":").map(Number);
      earlyLeaveMinutes = Math.max(0, endH * 60 + endM - nowZ.minutesOfDay);
    } else {
      earlyLeaveMinutes = Math.max(0, defaultEndMin - nowZ.minutesOfDay);
    }

    const requiresReason = earlyLeaveMinutes > 0;
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
      const earlyNote = earlyLeaveMinutes > 0 ? ` — ${earlyLeaveMinutes} min early` : "";
      showToast("success", `Checked out at ${now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}${hrs ? ` — ${hrs}` : ""}${earlyNote}`);
      loadRecords();
      notifyAttendanceEvent({
        employeeName,
        employeeId,
        type: "out",
        isException: earlyLeaveMinutes > 0,
        exceptionMinutes: earlyLeaveMinutes,
        date: today,
        time: timeStr,
        branchName: branch?.name,
      });
    }
  }, [todayOutsideWork, todayRecord, scheduleSettings, today, workEndTime, earlyCheckoutReason, showToast, loadRecords, employeeName, employeeId, branch?.name]);

  return {
    processing,
    setProcessing,
    handleClockIn,
    handleClockOut,
  };
}
