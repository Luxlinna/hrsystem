import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { distanceMeters, getCurrentPosition } from "@/lib/geo";
import { addDaysYMD, todayYMD, zonedParts, zonedTimeToInstant } from "@/lib/date";
import { DEFAULT_WORK_SCHEDULE, computeHoursWorked, getScheduleForDate, settingsFromRows } from "@/lib/workSchedule";
import { zonedDayOfWeek } from "@/lib/date";
import { notifyAttendanceEvent } from "@/lib/attendanceNotify";

interface AttendanceRecord {
  id: string;
  employee_id: string;
  date: string;
  clock_in: string | null;
  clock_out: string | null;
  status: string;
  late_minutes: number;
  early_leave_minutes: number;
  hours_worked: number | null;
  notes: string | null;
  created_at: string;
}

interface BranchGeofence {
  name: string;
  latitude: number | null;
  longitude: number | null;
  geofence_radius_m: number;
  work_start_time: string | null;
  work_end_time: string | null;
}

interface Props {
  employeeId: string;
  employeeName: string;
  autoStart?: boolean;
  autoCheckOut?: boolean;
}

type CheckInStep = "idle" | "locating" | "confirm" | "denied" | "error";

export default function CheckInTab({ employeeId, employeeName, autoStart, autoCheckOut }: Props) {
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

  // A branch's own schedule (set in Branch Management) wins over the
  // company-wide default on weekdays — but not on Saturday, where the
  // company half-day hours (saturday_start/end_time) always apply, since
  // branches have no Saturday fields of their own.
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

  // Ask the browser for the current GPS position and check it against the
  // employee's branch geofence before allowing the actual check-in insert.
  const handleRequestClockIn = async () => {
    if (branchLoading) return; // branch data isn't in yet — avoid misreading "no geofence" as "not configured"
    if (!branch?.latitude || !branch?.longitude) {
      // No geofence configured for this branch — check in without a location check.
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
      // Surface the raw browser error code/message directly — temporary,
      // to pin down exactly which failure mode this is without needing the
      // user to dig through OS/browser settings menus blind.
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
    if (!autoStart || loading || branchLoading || autoStartedRef.current || todayRecord?.clock_in) return;
    autoStartedRef.current = true;
    handleRequestClockIn();
  }, [autoStart, loading, branchLoading, todayRecord]);

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
    if (!daySchedule) { showToast("error", "Today is not configured as a working day."); return; }
    // All clock times come from the company timezone (Admin → Settings →
    // Timezone, default Asia/Phnom_Penh), never from the device's own clock.
    const now = new Date();
    const nowZ = zonedParts(now, scheduleSettings.timezone);
    const timeStr = `${String(nowZ.hh).padStart(2, "0")}:${String(nowZ.mm).padStart(2, "0")}:${String(nowZ.ss).padStart(2, "0")}`;
    const [startH, startM] = workStartTime.split(":").map(Number);
    const lateMinutes = Math.max(0, nowZ.minutesOfDay - (startH * 60 + startM));
    const status = lateMinutes > scheduleSettings.lateGraceMinutes ? "late" : "present";

    // Upsert (not insert) on the employee/date unique constraint: a
    // double-tap, or the geofence auto-prompt racing a manual tap, then
    // safely collapses onto the same row instead of creating a duplicate.
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
    if (!todayRecord) return;
    const now = new Date();
    const nowZ = zonedParts(now, scheduleSettings.timezone);
    const timeStr = `${String(nowZ.hh).padStart(2, "0")}:${String(nowZ.mm).padStart(2, "0")}:${String(nowZ.ss).padStart(2, "0")}`;

    // Rebuild the check-in instant in the company timezone so durations are
    // exact even when the device sits in a different timezone.
    const [ciH, ciM, ciS] = (todayRecord.clock_in || "00:00:00").split(":").map(Number);
    const clockInTime = todayRecord.clock_in ? zonedTimeToInstant(today, ciH, ciM, ciS, scheduleSettings.timezone) : null;
    // Deduct the unpaid break (e.g. 12:00–13:00) so hours reflect actual work time.
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
    if (!autoCheckOut || loading || autoCheckedOutRef.current || isEarlyCheckoutNow) return;
    if (!isCheckedIn || isCheckedOut) return;
    autoCheckedOutRef.current = true;
    handleClockOut();
  }, [autoCheckOut, loading, isCheckedIn, isCheckedOut, isEarlyCheckoutNow]);

  const getStatusColor = (status: string) => {
    const map: Record<string, string> = {
      present: "bg-emerald-50 text-emerald-700",
      late: "bg-amber-50 text-amber-700",
      absent: "bg-red-50 text-red-700",
      holiday: "bg-sky-50 text-sky-700",
    };
    return map[status] || "bg-gray-100 text-gray-600";
  };

  const presentCount = records.filter((r) => r.status === "present" || r.status === "late").length;
  const lateCount = records.filter((r) => r.status === "late").length;
  const earlyLeaveCount = records.filter((r) => (r.early_leave_minutes || 0) > scheduleSettings.earlyLeaveGraceMinutes).length;
  const absentCount = records.filter((r) => r.status === "absent").length;
  const totalHours = records.reduce((s, r) => s + (r.hours_worked || 0), 0);

  const daysWithHours = records.filter((r) => (r.hours_worked || 0) > 0).length;
  const avgHours = daysWithHours > 0 ? totalHours / daysWithHours : 0;
  const punctuality = presentCount > 0 ? Math.round(((presentCount - lateCount) / presentCount) * 100) : 0;

  const fmtHM = (hours: number) => {
    const h = Math.floor(hours);
    const m = Math.round((hours % 1) * 60);
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  // Live "worked so far" counter — ticks with the clock while still on shift,
  // and stops counting through the unpaid break window.
  const elapsedHours = (() => {
    if (!isCheckedIn || isCheckedOut || !todayRecord?.clock_in) return 0;
    const [ciH, ciM, ciS] = todayRecord.clock_in.split(":").map(Number);
    const start = zonedTimeToInstant(today, ciH, ciM, ciS, scheduleSettings.timezone);
    return computeHoursWorked(start, currentTime, scheduleSettings.breakStartTime, scheduleSettings.breakEndTime);
  })();

  // How far through the scheduled shift we currently are.
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

  const fmtClock = (t: string) => new Date(`2000-01-01T${t}`).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

  // Today first, going backward — mirrors how the rest of this tab reads (most recent first).
  const last7Days = Array.from({ length: 7 }, (_, i) => addDaysYMD(today, -i));

  if (loading) return (
    <div className="flex items-center justify-center h-40">
      <div className="w-7 h-7 border-2 border-[#253C7D] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">
      {toast && (
        <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl text-[13px] font-semibold text-white ${toast.type === "success" ? "bg-[#253C7D]" : "bg-red-500"}`}>
          {toast.message}
        </div>
      )}

      {/* Live Clock + Today's Shift + Check In/Out Panel */}
      <div className="bg-gradient-to-br from-[#253C7D] via-[#2E5AA8] to-[#29ABE2] rounded-2xl p-5 sm:p-6 text-white">
        <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr_auto] gap-5 lg:gap-7 items-center">
          {/* Live clock */}
          <div className="lg:pr-7 lg:border-r lg:border-white/15">
            <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest mb-1">Live Clock</p>
            <p className="text-4xl font-bold font-mono tracking-tight tabular-nums">
              {currentTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: scheduleSettings.timezone })}
            </p>
            <p className="text-white/70 text-[12px] mt-1">
              {currentTime.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric", timeZone: scheduleSettings.timezone })}
            </p>
          </div>

          {/* Today's shift snapshot */}
          <div className="min-w-0">
            <div className="flex items-center justify-between gap-3 mb-2">
              <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest">Today's Shift</p>
              <span className="text-[11px] font-semibold text-white/70">
                {fmtClock(workStartTime)}{workEndTime ? ` – ${fmtClock(workEndTime)}` : ""}
              </span>
            </div>

            {/* Shift progress track with check-in / check-out markers */}
            {shiftProgress !== null && (
              <div className="relative h-2 rounded-full bg-white/15 overflow-hidden mb-3">
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-white/80 transition-all duration-1000"
                  style={{ width: `${shiftProgress}%` }}
                />
              </div>
            )}

            <div className="grid grid-cols-3 gap-2">
              <div className="bg-white/10 backdrop-blur rounded-xl px-3 py-2 border border-white/15">
                <p className="text-white/55 text-[10px] font-bold uppercase tracking-wider">In</p>
                <p className="text-[15px] font-bold tabular-nums mt-0.5">
                  {todayRecord?.clock_in?.slice(0, 5) || "—"}
                </p>
                {(todayRecord?.late_minutes || 0) > scheduleSettings.lateGraceMinutes && (
                  <p className="text-amber-200 text-[10px] font-semibold mt-0.5">{todayRecord?.late_minutes}m late</p>
                )}
              </div>
              <div className="bg-white/10 backdrop-blur rounded-xl px-3 py-2 border border-white/15">
                <p className="text-white/55 text-[10px] font-bold uppercase tracking-wider">Out</p>
                <p className="text-[15px] font-bold tabular-nums mt-0.5">
                  {todayRecord?.clock_out?.slice(0, 5) || "—"}
                </p>
                {(todayRecord?.early_leave_minutes || 0) > scheduleSettings.earlyLeaveGraceMinutes && (
                  <p className="text-orange-200 text-[10px] font-semibold mt-0.5">{todayRecord?.early_leave_minutes}m early</p>
                )}
              </div>
              <div className="bg-white/10 backdrop-blur rounded-xl px-3 py-2 border border-white/15">
                <p className="text-white/55 text-[10px] font-bold uppercase tracking-wider">
                  {isCheckedIn && !isCheckedOut ? "Working" : "Hours"}
                </p>
                <p className="text-[15px] font-bold tabular-nums mt-0.5">
                  {isCheckedIn && !isCheckedOut
                    ? fmtHM(elapsedHours)
                    : todayRecord?.hours_worked
                    ? fmtHM(todayRecord.hours_worked)
                    : "—"}
                </p>
                {isCheckedIn && !isCheckedOut && (
                  <p className="text-emerald-200 text-[10px] font-semibold mt-0.5 flex items-center gap-1">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75" />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-300" />
                    </span>
                    Live
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 lg:w-72">
            {!isCheckedIn && checkInStep === "idle" && (
              <div className="space-y-2">
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional note (e.g. working from home)..."
                  className="w-full px-3 py-2 bg-white/20 backdrop-blur border border-white/30 rounded-lg text-[12px] text-white placeholder:text-white/50 focus:outline-none focus:border-white/60"
                />
                <button
                  onClick={handleRequestClockIn}
                  disabled={processing || branchLoading}
                  className="w-full flex items-center justify-center gap-2 bg-white text-[#253C7D] font-bold py-3 px-6 rounded-xl text-[14px] hover:bg-white/90 transition-colors disabled:opacity-60 cursor-pointer"
                >
                  <i className="ri-map-pin-line text-lg" />
                  Check In
                </button>
                {branch?.latitude && (
                  <p className="text-white/60 text-[11px] text-center">
                    <i className="ri-map-pin-line mr-1" />
                    Within {branch.geofence_radius_m}m of {branch.name}
                  </p>
                )}
              </div>
            )}

            {!isCheckedIn && checkInStep === "locating" && (
              <div className="bg-white/20 rounded-xl px-5 py-4 text-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-[13px] font-semibold">Checking your location...</p>
              </div>
            )}

            {!isCheckedIn && checkInStep === "confirm" && (
              <div className="space-y-2">
                <div className="bg-white/20 rounded-xl px-4 py-3 flex items-start gap-2">
                  <i className="ri-checkbox-circle-fill text-emerald-300 text-base shrink-0 mt-0.5" />
                  <p className="text-[12px] leading-relaxed">{checkInMessage}</p>
                </div>
                <button
                  onClick={handleConfirmClockIn}
                  disabled={processing}
                  className="w-full flex items-center justify-center gap-2 bg-white text-[#253C7D] font-bold py-3 px-6 rounded-xl text-[14px] hover:bg-white/90 transition-colors disabled:opacity-60 cursor-pointer"
                >
                  <i className="ri-checkbox-circle-line text-lg" />
                  {processing ? "Checking in..." : "Confirm Check In"}
                </button>
                <p className="text-white/60 text-[11px] text-center">
                  Your arrival time will be recorded after you confirm.
                </p>
                <button
                  onClick={resetCheckInFlow}
                  disabled={processing}
                  className="w-full text-white/70 text-[11px] hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            )}

            {!isCheckedIn && (checkInStep === "denied" || checkInStep === "error") && (
              <div className="space-y-2">
                <div className="bg-white/20 rounded-xl px-4 py-3 flex items-start gap-2">
                  <i className={`${checkInStep === "denied" ? "ri-map-pin-off-line text-amber-300" : "ri-error-warning-line text-red-300"} text-base shrink-0 mt-0.5`} />
                  <p className="text-[12px] leading-relaxed">{checkInMessage}</p>
                </div>
                <button
                  onClick={handleRequestClockIn}
                  className="w-full flex items-center justify-center gap-2 bg-white/20 backdrop-blur border border-white/40 text-white font-bold py-2.5 px-6 rounded-xl text-[13px] hover:bg-white/30 transition-colors cursor-pointer"
                >
                  <i className="ri-refresh-line text-base" />
                  Try Again
                </button>
              </div>
            )}

            {isCheckedIn && !isCheckedOut && (
              <div className="space-y-2">
                {isEarlyCheckoutNow && (
                  <div className="space-y-1">
                    <div className="bg-amber-400/20 border border-amber-200/40 rounded-xl px-4 py-3">
                      <p className="text-[12px] font-semibold text-amber-100">
                        Checking out {earlyCheckoutMinutesNow} minutes early. Reason is required.
                      </p>
                    </div>
                    <textarea
                      value={earlyCheckoutReason}
                      onChange={(e) => setEarlyCheckoutReason(e.target.value)}
                      rows={3}
                      maxLength={300}
                      placeholder="Reason for early checkout..."
                      className="w-full px-3 py-2 bg-white/20 backdrop-blur border border-white/30 rounded-lg text-[12px] text-white placeholder:text-white/50 focus:outline-none focus:border-white/60 resize-none"
                    />
                  </div>
                )}
                <button
                  onClick={handleClockOut}
                  disabled={processing}
                  className="w-full flex items-center justify-center gap-2 bg-white/20 backdrop-blur border border-white/40 text-white font-bold py-3 px-6 rounded-xl text-[14px] hover:bg-white/30 transition-colors disabled:opacity-60 cursor-pointer"
                >
                  <i className="ri-logout-box-r-line text-lg" />
                  {processing ? "Checking out..." : "Check Out"}
                </button>
              </div>
            )}

            {isCheckedOut && (
              <div className="bg-white/15 border border-white/20 rounded-xl px-4 py-3 flex items-center gap-3">
                <i className="ri-checkbox-circle-fill text-xl text-emerald-300 shrink-0" />
                <div className="min-w-0">
                  <p className="font-bold text-[14px]">Day Complete</p>
                  <p className="text-white/70 text-[11px] mt-0.5">
                    {todayRecord?.hours_worked ? `${fmtHM(todayRecord.hours_worked)} logged today` : "Shift recorded"}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Strip — last 30 days */}
      <div className="bg-white border border-gray-200/80 rounded-2xl shadow-2xs overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 bg-gray-50/60">
          <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Last 30 Days</p>
          <p className="text-[11px] text-gray-400">{records.length} record{records.length === 1 ? "" : "s"}</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 divide-x divide-y lg:divide-y-0 divide-gray-100">
          {[
            { label: "Days Present", value: presentCount, sub: `${daysWithHours} with hours`, icon: "ri-user-follow-line", color: "text-emerald-600 bg-emerald-50" },
            { label: "Punctuality", value: `${punctuality}%`, sub: `${presentCount - lateCount} on time`, icon: "ri-shield-check-line", color: "text-teal-600 bg-teal-50" },
            { label: "Late Arrivals", value: lateCount, sub: `${scheduleSettings.lateGraceMinutes}m grace`, icon: "ri-time-line", color: "text-amber-600 bg-amber-50" },
            { label: "Early Leaves", value: earlyLeaveCount, sub: `${scheduleSettings.earlyLeaveGraceMinutes}m grace`, icon: "ri-logout-circle-line", color: "text-orange-600 bg-orange-50" },
            { label: "Absences", value: absentCount, sub: absentCount === 0 ? "Perfect record" : "Needs review", icon: "ri-user-unfollow-line", color: "text-rose-500 bg-rose-50" },
            { label: "Total Hours", value: `${totalHours.toFixed(0)}h`, sub: `avg ${avgHours.toFixed(1)}h/day`, icon: "ri-timer-line", color: "text-[#253C7D] bg-[#253C7D]/10" },
          ].map((s) => (
            <div key={s.label} className="px-4 py-3.5">
              <div className="flex items-center gap-2 mb-1.5">
                <div className={`w-6 h-6 flex items-center justify-center rounded-md shrink-0 ${s.color}`}>
                  <i className={`${s.icon} text-[11px]`} />
                </div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider truncate">{s.label}</p>
              </div>
              <p className="text-xl font-black text-gray-900 leading-none tabular-nums">{s.value}</p>
              <p className="text-[10px] text-gray-400 mt-1 truncate">{s.sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Last 7 Days — at-a-glance check in/out, not just a status dot */}
      <div className="bg-white border border-gray-200/80 rounded-2xl shadow-2xs overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 bg-gray-50/60">
          <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Last 7 Days</p>
          <div className="flex items-center gap-3 text-[10px] font-semibold text-gray-400">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400" />On time</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400" />Late</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-300" />Absent</span>
          </div>
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 p-3">
          {last7Days.map((d) => {
            const rec = records.find((r) => r.date === d);
            const dt = new Date(d);
            const dayName = dt.toLocaleDateString("en-US", { weekday: "short" });
            const dayNum = dt.getDate();
            const isT = d === today;
            const isLate = (rec?.late_minutes || 0) > scheduleSettings.lateGraceMinutes;
            const isEarly = !!rec?.clock_out && (rec?.early_leave_minutes || 0) > scheduleSettings.earlyLeaveGraceMinutes;

            const dotColor =
              rec?.status === "absent" ? "bg-rose-400" :
              isLate ? "bg-amber-400" :
              rec ? "bg-emerald-400" :
              "bg-gray-200";

            return (
              <div
                key={d}
                className={`rounded-xl border p-2.5 flex flex-col items-center gap-1 text-center ${
                  isT ? "border-[#253C7D] ring-1 ring-[#253C7D]/20 bg-[#253C7D]/[0.03]" : "border-gray-100 bg-white"
                }`}
              >
                <div className="flex items-center gap-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
                  <span className={`text-[10px] font-bold uppercase tracking-wide ${isT ? "text-[#253C7D]" : "text-gray-400"}`}>{dayName}</span>
                </div>
                <span className={`text-[15px] font-black tabular-nums leading-none ${isT ? "text-[#253C7D]" : "text-gray-800"}`}>{dayNum}</span>

                {rec ? (
                  <div className="w-full mt-1 pt-1.5 border-t border-gray-100 space-y-0.5">
                    <div className="flex items-center justify-center gap-1 text-[10px] font-semibold text-gray-600 tabular-nums">
                      <i className="ri-login-box-line text-emerald-500 text-[10px]" />
                      {rec.clock_in?.slice(0, 5) || "—"}
                    </div>
                    <div className="flex items-center justify-center gap-1 text-[10px] font-semibold text-gray-600 tabular-nums">
                      <i className="ri-logout-box-line text-gray-400 text-[10px]" />
                      {rec.clock_out?.slice(0, 5) || "—"}
                    </div>
                    {rec.hours_worked ? (
                      <p className="text-[10px] font-bold text-gray-900 tabular-nums pt-0.5">{fmtHM(rec.hours_worked)}</p>
                    ) : (isLate || isEarly) ? (
                      <p className={`text-[9px] font-bold pt-0.5 ${isLate ? "text-amber-600" : "text-orange-500"}`}>
                        {isLate ? `+${rec.late_minutes}m` : `−${rec.early_leave_minutes}m`}
                      </p>
                    ) : null}
                  </div>
                ) : (
                  <p className="text-[10px] text-gray-300 mt-1 pt-1.5 border-t border-gray-50">No record</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Attendance History */}
      <div className="bg-white border border-gray-200/80 rounded-2xl shadow-2xs overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 bg-gray-50/60">
          <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Attendance History</p>
          <p className="text-[11px] text-gray-400">
            {totalHours.toFixed(1)}h across {records.length} day{records.length === 1 ? "" : "s"}
          </p>
        </div>

        {records.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <i className="ri-fingerprint-line text-3xl mb-2 block text-gray-300" />
            <p className="text-[13px] font-semibold text-gray-600">No attendance records yet</p>
            <p className="text-[11px] text-gray-400 mt-0.5">Your check-ins for the last 30 days will appear here.</p>
          </div>
        ) : (
          <>
            {/* Mobile: stacked cards */}
            <div className="sm:hidden max-h-[420px] overflow-y-auto p-2 space-y-2">
              {records.map((r) => (
                <div key={r.id} className="bg-white border border-gray-100 rounded-xl p-3.5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[13px] font-semibold text-gray-800">
                      {new Date(r.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                    </span>
                    <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${getStatusColor(r.status)}`}>
                      {r.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-[12px]">
                    <div>
                      <p className="text-gray-400 text-[10px] uppercase tracking-wide">Check In</p>
                      <p className="text-gray-700 font-medium">{r.clock_in?.slice(0, 5) || "—"}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-[10px] uppercase tracking-wide">Check Out</p>
                      <p className="text-gray-700 font-medium">
                        {r.clock_out?.slice(0, 5) || "—"}
                        {r.clock_out && r.early_leave_minutes > scheduleSettings.earlyLeaveGraceMinutes && (
                          <span className="block text-orange-500 text-[10px] font-semibold">{r.early_leave_minutes}m early</span>
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-[10px] uppercase tracking-wide">Hours</p>
                      <p className="text-gray-700 font-medium">{r.hours_worked ? `${r.hours_worked}h` : "—"}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop/tablet: table */}
            <div className="hidden sm:block overflow-x-auto max-h-[440px] overflow-y-auto">
              <div className="min-w-[560px]">
                <div className="grid grid-cols-[1.4fr_1fr_1.3fr_1fr_0.9fr] bg-gray-50/90 backdrop-blur px-4 py-2.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider sticky top-0 z-10 border-b border-gray-100">
                  <span>Date</span>
                  <span>Check In</span>
                  <span>Check Out</span>
                  <span>Hours</span>
                  <span className="text-right">Status</span>
                </div>
                {records.map((r) => {
                  const isLate = (r.late_minutes || 0) > scheduleSettings.lateGraceMinutes;
                  const isEarly = !!r.clock_out && (r.early_leave_minutes || 0) > scheduleSettings.earlyLeaveGraceMinutes;
                  const dt = new Date(r.date);
                  return (
                    <div
                      key={r.id}
                      className={`grid grid-cols-[1.4fr_1fr_1.3fr_1fr_0.9fr] items-center px-4 py-2.5 border-b border-gray-50 last:border-0 text-[12px] hover:bg-slate-50/80 transition-colors ${
                        r.date === today ? "bg-[#253C7D]/[0.03]" : ""
                      }`}
                    >
                      <span className="text-gray-800 font-semibold">
                        {dt.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        <span className="text-gray-400 font-medium ml-1.5">
                          {dt.toLocaleDateString("en-US", { weekday: "short" })}
                        </span>
                        {r.date === today && (
                          <span className="ml-1.5 text-[9px] font-bold text-[#253C7D] bg-[#253C7D]/10 px-1.5 py-0.5 rounded">TODAY</span>
                        )}
                      </span>
                      <span className="text-gray-600 tabular-nums">
                        {r.clock_in?.slice(0, 5) || "—"}
                        {isLate && (
                          <span className="text-amber-600 text-[10px] font-semibold ml-1">+{r.late_minutes}m</span>
                        )}
                      </span>
                      <span className="text-gray-600 tabular-nums">
                        {r.clock_out?.slice(0, 5) || (r.clock_in ? <span className="text-emerald-600 font-semibold">Active</span> : "—")}
                        {isEarly && (
                          <span className="text-orange-500 text-[10px] font-semibold ml-1">−{r.early_leave_minutes}m</span>
                        )}
                      </span>
                      <span className="text-gray-800 font-bold tabular-nums">{r.hours_worked ? `${r.hours_worked}h` : "—"}</span>
                      <span className="flex justify-end">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${getStatusColor(r.status)}`}>
                          {r.status}
                        </span>
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
