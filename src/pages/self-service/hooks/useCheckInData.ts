import { useState, useEffect, useRef, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { distanceMeters, getCurrentPosition } from "@/lib/geo";
import { addDaysYMD, todayYMD, zonedParts, zonedTimeToInstant, zonedDayOfWeek } from "@/lib/date";
import { DEFAULT_WORK_SCHEDULE, computeHoursWorked, getScheduleForDate, settingsFromRows } from "@/lib/workSchedule";
import { notifyAttendanceEvent } from "@/lib/attendanceNotify";
import type { AttendanceRecord, BranchGeofence, OutsideWorkTask, CheckInStep } from "../types";

interface Props {
  employeeId: string;
  employeeName: string;
  autoStart?: boolean;
  autoCheckOut?: boolean;
}

export function useCheckInData({ employeeId, employeeName, autoStart, autoCheckOut }: Props) {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [toast, setToast] = useState<{ type: string; message: string } | null>(null);
  const [notes, setNotes] = useState("");
  const [earlyCheckoutReason, setEarlyCheckoutReason] = useState("");

  const [branch, setBranch] = useState<BranchGeofence | null>(null);
  const [checkInStep, setCheckInStep] = useState<CheckInStep>("idle");
  const [checkInMessage, setCheckInMessage] = useState("");
  const [checkInDistance, setCheckInDistance] = useState<number | null>(null);
  const [checkInAccuracy, setCheckInAccuracy] = useState<number | null>(null);
  const [globalWorkStartTime, setGlobalWorkStartTime] = useState("09:00");
  const [scheduleSettings, setScheduleSettings] = useState(DEFAULT_WORK_SCHEDULE);
  const [activeOutsideWork, setActiveOutsideWork] = useState<OutsideWorkTask | null>(null);
  const [todayOutsideWork, setTodayOutsideWork] = useState<OutsideWorkTask | null>(null);

  const today = todayYMD();

  const showToast = (type: string, message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    supabase.from("system_settings").select("key, value").then(({ data }) => {
      if (data) { const next = settingsFromRows(data); setScheduleSettings(next); setGlobalWorkStartTime(next.workStartTime); }
    });
  }, []);

  useEffect(() => {
    if (!employeeId) return;
    supabase
      .from("tasks")
      .select("id, title, due_date, work_status, work_checked_in_at, work_checked_out_at, work_address, created_at")
      .eq("assigned_to", employeeId)
      .eq("is_outside_work", true)
      .then(async ({ data }) => {
        const list = (data as any[]) || [];
        const task = list.find((t) => t.work_status === "checked_in")
          || list.find((t) => t.due_date === today || (t.work_checked_in_at && t.work_checked_in_at.startsWith(today)))
          || list.find((t) => t.created_at && t.created_at.startsWith(today) && t.work_status !== "checked_out")
          || null;

        setTodayOutsideWork(task);
        setActiveOutsideWork(task?.work_status === "checked_in" ? task : null);

        if (task?.work_checked_in_at && task.work_status === "checked_in") {
          const { data: existing } = await supabase
            .from("attendance_records")
            .select("id")
            .eq("employee_id", employeeId)
            .eq("date", today)
            .maybeSingle();
          if (!existing) {
            const ci = new Date(task.work_checked_in_at);
            const timeStr = `${String(ci.getHours()).padStart(2, "0")}:${String(ci.getMinutes()).padStart(2, "0")}:${String(ci.getSeconds()).padStart(2, "0")}`;
            await supabase.from("attendance_records").upsert({
              employee_id: employeeId,
              date: today,
              clock_in: timeStr,
              status: "present",
              notes: `Outside work: ${task.title}`,
            }, { onConflict: "employee_id,date" });
            loadRecords();
          }
        }
      });
  }, [employeeId, today]);

  const isSaturday = zonedDayOfWeek(currentTime, scheduleSettings.timezone) === 6;
  const daySchedule = getScheduleForDate(scheduleSettings);
  const workStartTime = (!isSaturday && branch?.work_start_time) || daySchedule?.startTime || globalWorkStartTime;
  const workEndTime = (!isSaturday && branch?.work_end_time) || daySchedule?.endTime || null;

  const loadRecords = async () => {
    if (!employeeId) return;
    setLoading(true);

    const fromDate = addDaysYMD(today, -30);

    const { data } = await supabase
      .from("attendance_records")
      .select("*")
      .eq("employee_id", employeeId)
      .gte("date", fromDate)
      .order("date", { ascending: false });

    const all = data || [];
    setRecords(all);
    setTodayRecord(all.find((r) => r.date === today) || null);
    setLoading(false);
  };

  useEffect(() => {
    loadRecords();
  }, [employeeId]);

  const [branchLoading, setBranchLoading] = useState(true);
  useEffect(() => {
    if (!employeeId) return;
    setBranchLoading(true);
    (async () => {
      const { data } = await supabase
        .from("employees")
        .select("branches(name, latitude, longitude, geofence_radius_m, work_start_time, work_end_time)")
        .eq("id", employeeId)
        .maybeSingle();
      const b = (data as any)?.branches as BranchGeofence | undefined;
      setBranch(b || null);
      setBranchLoading(false);
    })();
  }, [employeeId]);

  const handleRequestClockIn = async () => {
    if (todayOutsideWork && todayOutsideWork.work_status !== "checked_out") {
      showToast("error", "You have an outside work task today. Please check in via Task Management.");
      return;
    }
    if (branchLoading) return;
    if (!branch?.latitude || !branch?.longitude) {
      handleClockIn();
      return;
    }

    setCheckInStep("locating");
    try {
      const pos = await getCurrentPosition();
      const dist = Math.round(
        distanceMeters(pos.coords.latitude, pos.coords.longitude, branch.latitude, branch.longitude)
      );
      const accuracy = Math.round(pos.coords.accuracy);
      setCheckInDistance(dist);
      setCheckInAccuracy(accuracy);

      if (dist <= branch.geofence_radius_m) {
        setCheckInMessage(`You're ${dist}m from ${branch.name} — within range. Confirm to check in.`);
        setCheckInStep("confirm");
      } else {
        const accuracyNote =
          accuracy > branch.geofence_radius_m
            ? ` Your device's location is only accurate to about ±${accuracy}m right now (common on desktop/laptop computers without GPS), so this reading may not be exact — try again on a phone with GPS/location services on for a more precise result.`
            : "";
        setCheckInMessage(`You're ${dist}m from ${branch.name} — you need to be within ${branch.geofence_radius_m}m to check in.${accuracyNote}`);
        setCheckInStep("denied");
      }
    } catch (err: any) {
      const codeNote = err?.code != null ? ` (code ${err.code}${err?.message ? `: ${err.message}` : ""})` : err?.message ? ` (${err.message})` : "";
      setCheckInMessage(
        err?.code === 1
          ? `Location access was denied. Please enable location permissions for this site and try again.${codeNote}`
          : `Couldn't get your location. On a laptop/desktop, this is usually the OS-level Location Services setting, not just the browser — check Settings > Privacy > Location (Windows) or System Settings > Privacy & Security > Location Services (Mac), then try again.${codeNote}`
      );
      setCheckInStep("error");
    }
  };

  const autoStartedRef = useRef(false);
  useEffect(() => {
    if (!autoStart || loading || branchLoading || autoStartedRef.current || todayRecord?.clock_in || (todayOutsideWork && todayOutsideWork.work_status !== "checked_out")) return;
    autoStartedRef.current = true;
    handleRequestClockIn();
  }, [autoStart, loading, branchLoading, todayRecord, todayOutsideWork]);

  const resetCheckInFlow = () => {
    setCheckInStep("idle");
    setCheckInMessage("");
    setCheckInDistance(null);
    setCheckInAccuracy(null);
  };

  const handleConfirmClockIn = async () => {
    setProcessing(true);
    await handleClockIn();
  };

  const handleClockIn = async () => {
    if (todayOutsideWork && todayOutsideWork.work_status !== "checked_out") {
      showToast("error", "You have an outside work task today. Please check in via Task Management.");
      return;
    }
    if (!daySchedule) { showToast("error", "Today is not configured as a working day."); return; }
    const now = new Date();
    const nowZ = zonedParts(now, scheduleSettings.timezone);
    const timeStr = `${String(nowZ.hh).padStart(2, "0")}:${String(nowZ.mm).padStart(2, "0")}:${String(nowZ.ss).padStart(2, "0")}`;
    const [startH, startM] = workStartTime.split(":").map(Number);
    const lateMinutes = Math.max(0, nowZ.minutesOfDay - (startH * 60 + startM));
    const status = lateMinutes > scheduleSettings.lateGraceMinutes ? "late" : "present";

    const { error } = await supabase.from("attendance_records").upsert({
      employee_id: employeeId,
      date: today,
      clock_in: timeStr,
      status,
      late_minutes: lateMinutes,
      notes: notes || null,
    }, { onConflict: "employee_id,date" });

    setProcessing(false);
    resetCheckInFlow();
    if (error) {
      showToast("error", "Failed to check in. Please try again.");
    } else {
      showToast("success", `Checked in at ${now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}${lateMinutes > scheduleSettings.lateGraceMinutes ? ` — ${lateMinutes} min late` : " — On time!"}`);
      setNotes("");
      setEarlyCheckoutReason("");
      loadRecords();
      notifyAttendanceEvent({
        employeeName,
        employeeId,
        type: "in",
        isException: lateMinutes > scheduleSettings.lateGraceMinutes,
        exceptionMinutes: lateMinutes,
        date: today,
        time: timeStr,
        branchName: branch?.name,
      });
    }
  };

  const handleClockOut = async () => {
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
    const hoursWorked = clockInTime ? computeHoursWorked(clockInTime, now, scheduleSettings.breakStartTime, scheduleSettings.breakEndTime) : null;

    let earlyLeaveMinutes = 0;
    if (workEndTime) {
      const [endH, endM] = workEndTime.split(":").map(Number);
      earlyLeaveMinutes = Math.max(0, (endH * 60 + endM) - nowZ.minutesOfDay);
    }

    const requiresReason = earlyLeaveMinutes > scheduleSettings.earlyLeaveGraceMinutes;
    if (requiresReason && !earlyCheckoutReason.trim()) {
      showToast("error", "Please enter a reason before checking out early.");
      return;
    }

    setProcessing(true);

    const checkoutNotes = requiresReason
      ? [todayRecord.notes, `Early checkout reason: ${earlyCheckoutReason.trim()}`].filter(Boolean).join("\n")
      : todayRecord.notes;

    const { error } = await supabase.from("attendance_records")
      .update({ clock_out: timeStr, hours_worked: hoursWorked, early_leave_minutes: earlyLeaveMinutes, notes: checkoutNotes })
      .eq("id", todayRecord.id);

    setProcessing(false);
    if (error) {
      showToast("error", "Failed to check out. Please try again.");
    } else {
      const hrs = hoursWorked ? `${Math.floor(hoursWorked)}h ${Math.round((hoursWorked % 1) * 60)}m worked` : "";
      const earlyNote = earlyLeaveMinutes > scheduleSettings.earlyLeaveGraceMinutes ? ` — ${earlyLeaveMinutes} min early` : "";
      showToast("success", `Checked out at ${now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}${hrs ? ` — ${hrs}` : ""}${earlyNote}`);
      loadRecords();
      notifyAttendanceEvent({
        employeeName,
        employeeId,
        type: "out",
        isException: earlyLeaveMinutes > scheduleSettings.earlyLeaveGraceMinutes,
        exceptionMinutes: earlyLeaveMinutes,
        date: today,
        time: timeStr,
        branchName: branch?.name,
      });
    }
  };

  const isCheckedIn = !!todayRecord?.clock_in;
  const isCheckedOut = !!(todayRecord?.clock_in && todayRecord?.clock_out);
  const earlyCheckoutMinutesNow = (() => {
    if (!workEndTime || !isCheckedIn || isCheckedOut) return 0;
    const [endH, endM] = workEndTime.split(":").map(Number);
    return Math.max(0, (endH * 60 + endM) - zonedParts(currentTime, scheduleSettings.timezone).minutesOfDay);
  })();
  const isEarlyCheckoutNow = earlyCheckoutMinutesNow > scheduleSettings.earlyLeaveGraceMinutes;

  const autoCheckedOutRef = useRef(false);
  useEffect(() => {
    if (!autoCheckOut || loading || autoCheckedOutRef.current || isEarlyCheckoutNow || (todayOutsideWork && todayOutsideWork.work_status !== "checked_out")) return;
    if (!isCheckedIn || isCheckedOut) return;
    autoCheckedOutRef.current = true;
    handleClockOut();
  }, [autoCheckOut, loading, isCheckedIn, isCheckedOut, isEarlyCheckoutNow, todayOutsideWork]);

  const presentCount = records.filter((r) => r.status === "present" || r.status === "late").length;
  const lateCount = records.filter((r) => r.status === "late").length;
  const earlyLeaveCount = records.filter((r) => (r.early_leave_minutes || 0) > scheduleSettings.earlyLeaveGraceMinutes).length;
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

  const last7Days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDaysYMD(today, -i)),
    [today]
  );

  return {
    records,
    todayRecord,
    loading,
    processing,
    currentTime,
    toast,
    notes,
    setNotes,
    earlyCheckoutReason,
    setEarlyCheckoutReason,
    branch,
    branchLoading,
    checkInStep,
    checkInMessage,
    scheduleSettings,
    activeOutsideWork,
    todayOutsideWork,
    workStartTime,
    workEndTime,
    daySchedule,
    handleRequestClockIn,
    handleConfirmClockIn,
    handleClockIn,
    handleClockOut,
    resetCheckInFlow,
    isCheckedIn,
    isCheckedOut,
    earlyCheckoutMinutesNow,
    isEarlyCheckoutNow,
    past7Days: last7Days,
    // stats
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
  };
}
