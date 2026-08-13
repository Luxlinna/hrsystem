import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { distanceMeters, getCurrentPosition } from "@/lib/geo";
import { toYMD, todayYMD } from "@/lib/date";
import { hasRegisteredFingerprint, registerDeviceFingerprint, verifyDeviceFingerprint } from "@/lib/webauthn";
import { browserSupportsWebAuthn } from "@simplewebauthn/browser";

interface AttendanceRecord {
  id: string;
  employee_id: string;
  date: string;
  clock_in: string | null;
  clock_out: string | null;
  status: string;
  late_minutes: number;
  hours_worked: number | null;
  notes: string | null;
  created_at: string;
}

interface BranchGeofence {
  name: string;
  latitude: number | null;
  longitude: number | null;
  geofence_radius_m: number;
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

  const [branch, setBranch] = useState<BranchGeofence | null>(null);
  const [checkInStep, setCheckInStep] = useState<CheckInStep>("idle");
  const [checkInMessage, setCheckInMessage] = useState("");
  const [checkInDistance, setCheckInDistance] = useState<number | null>(null);
  const [checkInAccuracy, setCheckInAccuracy] = useState<number | null>(null);
  const [workStartTime, setWorkStartTime] = useState("09:00");
  const [hasFingerprint, setHasFingerprint] = useState(false);
  const [biometricError, setBiometricError] = useState("");

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
    supabase.from("system_settings").select("value").eq("key", "work_start_time").maybeSingle().then(({ data }) => {
      if (data?.value) setWorkStartTime(data.value);
    });
  }, []);

  useEffect(() => {
    if (!employeeId) return;
    hasRegisteredFingerprint(employeeId).then(setHasFingerprint);
  }, [employeeId]);

  const loadRecords = async () => {
    if (!employeeId) return;
    setLoading(true);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const fromDate = toYMD(thirtyDaysAgo);

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
        .select("branches(name, latitude, longitude, geofence_radius_m)")
        .eq("id", employeeId)
        .maybeSingle();
      const b = (data as any)?.branches as BranchGeofence | undefined;
      setBranch(b || null);
      setBranchLoading(false);
    })();
  }, [employeeId]);

  // Ask the browser for the current GPS position and check it against the
  // employee's branch geofence before allowing the actual clock-in insert.
  const handleRequestClockIn = async () => {
    if (branchLoading) return; // branch data isn't in yet — avoid misreading "no geofence" as "not configured"
    if (!branch?.latitude || !branch?.longitude) {
      // No geofence configured for this branch — clock in without a location check.
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
        setCheckInMessage(`You're ${dist}m from ${branch.name} — within range. Confirm to clock in.`);
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
    setBiometricError("");
  };

  const handleConfirmClockIn = async () => {
    if (!browserSupportsWebAuthn()) {
      setBiometricError("This browser/device doesn't support fingerprint verification. Try a modern phone or laptop browser (Chrome, Safari, Edge).");
      return;
    }
    setBiometricError("");
    setProcessing(true);
    try {
      if (hasFingerprint) {
        await verifyDeviceFingerprint();
      } else {
        await registerDeviceFingerprint(navigator.platform || "This device");
        setHasFingerprint(true);
      }
    } catch (err: any) {
      setProcessing(false);
      setBiometricError(
        err?.name === "NotAllowedError"
          ? "Fingerprint check was cancelled or didn't match. Try again."
          : err?.message || "Fingerprint verification failed."
      );
      return;
    }
    await handleClockIn();
  };

  const handleClockIn = async () => {
    setProcessing(true);
    const now = new Date();
    const timeStr = now.toTimeString().split(" ")[0];
    const [startH, startM] = workStartTime.split(":").map(Number);
    const lateMinutes = Math.max(0, (now.getHours() * 60 + now.getMinutes()) - (startH * 60 + startM));
    const status = lateMinutes > 15 ? "late" : "present";

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
      showToast("error", "Failed to clock in. Please try again.");
    } else {
      showToast("success", `Clocked in at ${now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}${lateMinutes > 15 ? ` — ${lateMinutes} min late` : " — On time!"}`);
      setNotes("");
      loadRecords();
    }
  };

  const handleClockOut = async () => {
    if (!todayRecord) return;
    setProcessing(true);
    const now = new Date();
    const timeStr = now.toTimeString().split(" ")[0];

    const clockInTime = todayRecord.clock_in ? new Date(`${today}T${todayRecord.clock_in}`) : null;
    const hoursWorked = clockInTime ? parseFloat(((now.getTime() - clockInTime.getTime()) / 3600000).toFixed(2)) : null;

    const { error } = await supabase.from("attendance_records")
      .update({ clock_out: timeStr, hours_worked: hoursWorked })
      .eq("id", todayRecord.id);

    setProcessing(false);
    if (error) {
      showToast("error", "Failed to clock out. Please try again.");
    } else {
      const hrs = hoursWorked ? `${Math.floor(hoursWorked)}h ${Math.round((hoursWorked % 1) * 60)}m worked` : "";
      showToast("success", `Clocked out at ${now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}${hrs ? ` — ${hrs}` : ""}`);
      loadRecords();
    }
  };

  const isCheckedIn = !!todayRecord?.clock_in;
  const isCheckedOut = !!(todayRecord?.clock_in && todayRecord?.clock_out);

  const autoCheckedOutRef = useRef(false);
  useEffect(() => {
    if (!autoCheckOut || loading || autoCheckedOutRef.current) return;
    if (!isCheckedIn || isCheckedOut) return;
    autoCheckedOutRef.current = true;
    handleClockOut();
  }, [autoCheckOut, loading, isCheckedIn, isCheckedOut]);

  const getStatusColor = (status: string) => {
    const map: Record<string, string> = {
      present: "bg-emerald-50 text-emerald-700",
      late: "bg-amber-50 text-amber-700",
      absent: "bg-red-50 text-red-700",
      holiday: "bg-sky-50 text-sky-700",
    };
    return map[status] || "bg-gray-100 text-gray-600";
  };

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return toYMD(d);
  });

  const presentCount = records.filter((r) => r.status === "present" || r.status === "late").length;
  const lateCount = records.filter((r) => r.status === "late").length;
  const absentCount = records.filter((r) => r.status === "absent").length;
  const totalHours = records.reduce((s, r) => s + (r.hours_worked || 0), 0);

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

      {/* Live Clock + Check In/Out Panel */}
      <div className="bg-gradient-to-br from-[#253C7D] to-[#29ABE2] rounded-2xl p-6 text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div>
            <p className="text-white/70 text-[12px] font-medium uppercase tracking-wider mb-1">Live Clock</p>
            <p className="text-4xl font-bold font-mono tracking-tight">
              {currentTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </p>
            <p className="text-white/70 text-[13px] mt-1">
              {currentTime.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
            </p>
          </div>

          <div className="flex flex-col gap-2 md:w-80">
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
                  Clock In
                </button>
                {branch?.latitude && (
                  <p className="text-white/60 text-[11px] text-center">
                    Requires location (within {branch.geofence_radius_m}m of {branch.name}) and fingerprint verification
                  </p>
                )}
                <p className="text-white/60 text-[11px] text-center">
                  Work starts at {new Date(`2000-01-01T${workStartTime}`).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })} — arrivals after that are marked late
                </p>
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
                {biometricError && (
                  <div className="bg-red-500/20 rounded-xl px-4 py-3 flex items-start gap-2">
                    <i className="ri-fingerprint-line text-red-200 text-base shrink-0 mt-0.5" />
                    <p className="text-[12px] leading-relaxed">{biometricError}</p>
                  </div>
                )}
                <button
                  onClick={handleConfirmClockIn}
                  disabled={processing}
                  className="w-full flex items-center justify-center gap-2 bg-white text-[#253C7D] font-bold py-3 px-6 rounded-xl text-[14px] hover:bg-white/90 transition-colors disabled:opacity-60 cursor-pointer"
                >
                  <i className="ri-fingerprint-line text-lg" />
                  {processing ? "Verifying fingerprint..." : hasFingerprint ? "Confirm with Fingerprint" : "Register Fingerprint & Clock In"}
                </button>
                <p className="text-white/60 text-[11px] text-center">
                  {hasFingerprint
                    ? "Your device will ask for Touch ID / fingerprint / Windows Hello to confirm it's you."
                    : "First time here — you'll be asked to register this device's fingerprint, then it'll be required every time you clock in."}
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
                <div className="flex items-center gap-2 bg-white/20 rounded-xl px-4 py-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-300 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-400" />
                  </span>
                  <span className="text-[13px] font-semibold">Clocked in at {todayRecord?.clock_in?.slice(0, 5)}</span>
                </div>
                <button
                  onClick={handleClockOut}
                  disabled={processing}
                  className="w-full flex items-center justify-center gap-2 bg-white/20 backdrop-blur border border-white/40 text-white font-bold py-3 px-6 rounded-xl text-[14px] hover:bg-white/30 transition-colors disabled:opacity-60 cursor-pointer"
                >
                  <i className="ri-logout-circle-r-line text-lg" />
                  {processing ? "Processing..." : "Clock Out"}
                </button>
              </div>
            )}

            {isCheckedOut && (
              <div className="bg-white/20 rounded-xl px-5 py-4 text-center">
                <i className="ri-checkbox-circle-fill text-2xl text-green-300 mb-1 block" />
                <p className="font-bold text-[14px]">Day Complete</p>
                <p className="text-white/70 text-[12px] mt-0.5">
                  {todayRecord?.clock_in?.slice(0, 5)} → {todayRecord?.clock_out?.slice(0, 5)}
                  {todayRecord?.hours_worked ? ` · ${todayRecord.hours_worked}h worked` : ""}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Days Present", value: presentCount, icon: "ri-user-follow-line", color: "text-emerald-600 bg-emerald-50" },
          { label: "Late Arrivals", value: lateCount, icon: "ri-time-line", color: "text-amber-600 bg-amber-50" },
          { label: "Absences", value: absentCount, icon: "ri-user-unfollow-line", color: "text-red-500 bg-red-50" },
          { label: "Total Hours", value: `${totalHours.toFixed(0)}h`, icon: "ri-timer-line", color: "text-[#253C7D] bg-[#253C7D]/10" },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-gray-100 rounded-xl p-4">
            <div className={`w-8 h-8 flex items-center justify-center rounded-lg mb-2 ${s.color}`}>
              <i className={`${s.icon} text-sm`} />
            </div>
            <p className="text-xl font-bold text-gray-900">{s.value}</p>
            <p className="text-[11px] text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Last 7 Days mini-calendar */}
      <div>
        <p className="text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-3">Last 7 Days</p>
        <div className="flex gap-2 flex-wrap">
          {last7Days.map((d) => {
            const rec = records.find((r) => r.date === d);
            const dayName = new Date(d).toLocaleDateString("en-US", { weekday: "short" });
            const dayNum = new Date(d).getDate();
            const isT = d === today;
            return (
              <div
                key={d}
                className={`flex flex-col items-center gap-1 rounded-xl px-3 py-2.5 min-w-[52px] border ${
                  isT ? "border-[#253C7D] bg-[#253C7D]/5" :
                  rec?.status === "present" ? "border-emerald-200 bg-emerald-50" :
                  rec?.status === "late" ? "border-amber-200 bg-amber-50" :
                  rec?.status === "absent" ? "border-red-200 bg-red-50" :
                  "border-gray-100 bg-white"
                }`}
              >
                <span className="text-[10px] text-gray-400 font-medium">{dayName}</span>
                <span className={`text-[14px] font-bold ${isT ? "text-[#253C7D]" : "text-gray-700"}`}>{dayNum}</span>
                {rec ? (
                  <i className={`text-[11px] ${
                    rec.status === "present" ? "ri-check-line text-emerald-500" :
                    rec.status === "late" ? "ri-time-line text-amber-500" :
                    "ri-close-line text-red-400"
                  }`} />
                ) : (
                  <span className="text-[10px] text-gray-300">{isT ? "Today" : "—"}</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Attendance History */}
      <div>
        <p className="text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-3">Attendance History (30 days)</p>
        <div className="bg-white border border-gray-100 rounded-xl overflow-x-auto">
          <div className="min-w-[480px]">
            <div className="grid grid-cols-5 bg-gray-50 px-4 py-2.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
              <span>Date</span>
              <span>Clock In</span>
              <span>Clock Out</span>
              <span>Hours</span>
              <span>Status</span>
            </div>
            {records.slice(0, 20).map((r) => (
              <div key={r.id} className="grid grid-cols-5 px-4 py-3 border-t border-gray-50 text-[12px]">
                <span className="text-gray-700 font-medium">
                  {new Date(r.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </span>
                <span className="text-gray-600">{r.clock_in?.slice(0, 5) || "—"}</span>
                <span className="text-gray-600">{r.clock_out?.slice(0, 5) || "—"}</span>
                <span className="text-gray-600 font-medium">{r.hours_worked ? `${r.hours_worked}h` : "—"}</span>
                <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize w-fit ${getStatusColor(r.status)}`}>
                  {r.status}
                </span>
              </div>
            ))}
            {records.length === 0 && (
              <div className="text-center py-10 text-gray-400">
                <i className="ri-fingerprint-line text-3xl mb-2 block" />
                <p className="text-[13px]">No attendance records yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}