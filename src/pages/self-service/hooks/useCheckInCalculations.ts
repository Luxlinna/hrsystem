import { useMemo } from "react";
import { addDaysYMD, zonedParts, zonedTimeToInstant } from "@/lib/date";
import { computeHoursWorked } from "@/lib/workSchedule";
import type { AttendanceRecord } from "../types";

interface UseCheckInCalculationsProps {
  records: AttendanceRecord[];
  todayRecord: AttendanceRecord | null;
  currentTime: Date;
  today: string;
  scheduleSettings: {
    timezone: string;
    earlyLeaveGraceMinutes: number;
    breakStartTime: string;
    breakEndTime: string;
  };
  workStartTime: string;
  workEndTime: string | null;
}

export function useCheckInCalculations({
  records,
  todayRecord,
  currentTime,
  today,
  scheduleSettings,
  workStartTime,
  workEndTime,
}: UseCheckInCalculationsProps) {
  const isCheckedIn = !!todayRecord?.clock_in;
  const isCheckedOut = !!(todayRecord?.clock_in && todayRecord?.clock_out);

  const earlyCheckoutMinutesNow = (() => {
    if (!workEndTime || !isCheckedIn || isCheckedOut) return 0;
    const [endH, endM] = workEndTime.split(":").map(Number);
    return Math.max(0, endH * 60 + endM - zonedParts(currentTime, scheduleSettings.timezone).minutesOfDay);
  })();
  const isEarlyCheckoutNow = earlyCheckoutMinutesNow > scheduleSettings.earlyLeaveGraceMinutes;

  const presentCount = records.filter(
    (r) => r.status === "ontime" || r.status === "present" || r.status === "late"
  ).length;
  const lateCount = records.filter((r) => r.status === "late").length;
  const earlyLeaveCount = records.filter(
    (r) => (r.early_leave_minutes || 0) > scheduleSettings.earlyLeaveGraceMinutes
  ).length;
  const absentCount = records.filter((r) => r.status === "absent").length;
  const totalHours = records.reduce((s, r) => s + (r.hours_worked || 0), 0);

  const daysWithHours = records.filter((r) => (r.hours_worked || 0) > 0).length;
  const avgHours = daysWithHours > 0 ? totalHours / daysWithHours : 0;
  const punctuality = presentCount > 0 ? Math.round(((presentCount - lateCount) / presentCount) * 100) : 0;

  const elapsedHours = (() => {
    if (!isCheckedIn || isCheckedOut || !todayRecord?.clock_in) return 0;
    const [ciH, ciM, ciS] = todayRecord.clock_in.split(":").map(Number);
    const start = zonedTimeToInstant(today, ciH, ciM, ciS, scheduleSettings.timezone);
    return computeHoursWorked(start, currentTime, scheduleSettings.breakStartTime, scheduleSettings.breakEndTime);
  })();

  const shiftProgress = (() => {
    if (!workEndTime) return null;
    const [sh, sm] = workStartTime.split(":").map(Number);
    const [eh, em] = workEndTime.split(":").map(Number);
    const start = sh * 60 + sm;
    const end = eh * 60 + em;
    if (end <= start) return null;
    const nowMin = zonedParts(currentTime, scheduleSettings.timezone).minutesOfDay;
    return Math.min(100, Math.max(0, ((nowMin - start) / (end - start)) * 100));
  })();

  const last7Days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDaysYMD(today, -i)), [today]);

  return {
    isCheckedIn,
    isCheckedOut,
    earlyCheckoutMinutesNow,
    isEarlyCheckoutNow,
    presentCount,
    lateCount,
    earlyLeaveCount,
    absentCount,
    totalHours,
    daysWithHours,
    avgHours,
    punctuality,
    elapsedHours,
    shiftProgress,
    past7Days: last7Days,
  };
}
