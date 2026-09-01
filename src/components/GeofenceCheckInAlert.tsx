import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { distanceMeters } from "@/lib/geo";
import { todayYMD, zonedParts, zonedDayOfWeek, zonedTimeToInstant } from "@/lib/date";
import { DEFAULT_WORK_SCHEDULE, getScheduleForDate, settingsFromRows, computeHoursWorked } from "@/lib/workSchedule";
import { useAuth } from "@/context/AuthContext";
import { notifyGeofenceEvent } from "@/lib/attendanceNotify";

interface BranchGeofence {
  name: string;
  latitude: number | null;
  longitude: number | null;
  geofence_radius_m: number;
}

type Mode = "checkin" | "checkout" | "auto_checkout" | "outside_warning" | "returned_notice";

// Check-in window in the morning
const CHECKIN_WINDOW = { startMin: 7 * 60, endMin: 11 * 60 + 59 };

export default function GeofenceCheckInAlert() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [alertState, setAlertState] = useState<{
    branchName?: string;
    mode: Mode;
    title: string;
    message: string;
  } | null>(null);
  const alertedModesRef = useRef<Set<string>>(new Set());
  const watchIdRef = useRef<number | null>(null);
  const autoCheckedOutRef = useRef(false);
  const geoPresenceRef = useRef<"inside" | "outside" | null>(null);

  useEffect(() => {
    if (!user?.email) return;
    let cancelled = false;

    const checkAttendanceSchedule = async () => {
      const today = todayYMD();
      const dedupeKey = (m: string) => `att_alert_${m}_${user.id}_${today}`;

      const { data: employee } = await supabase
        .from("employees")
        .select("id, first_name, last_name, branches(name, latitude, longitude, geofence_radius_m)")
        .eq("email", user.email)
        .maybeSingle();
      if (cancelled || !employee) return;

      const branch = (employee as any).branches as BranchGeofence | undefined;
      const employeeName = `${employee.first_name || ""} ${employee.last_name || ""}`.trim() || user.email || "Employee";

      // Skip alerts if employee has outside work scheduled or active today
      const { data: outsideTasks } = await supabase
        .from("tasks")
        .select("id, due_date, work_status, work_checked_in_at, created_at")
        .eq("assigned_to", employee.id)
        .eq("is_outside_work", true)
        .is("deleted_at", null);

      const hasOutsideToday = (outsideTasks || []).some(
        (t) => t.work_status === "checked_in"
          || (t.due_date === today && t.work_status !== "checked_out")
          || (t.work_checked_in_at && t.work_checked_in_at.startsWith(today) && t.work_status !== "checked_out")
          || (t.created_at && t.created_at.startsWith(today) && t.work_status !== "checked_out")
      );
      if (cancelled || hasOutsideToday) return;

      const { data: scheduleRows } = await supabase.from("system_settings").select("key, value");
      const scheduleSettings = scheduleRows ? settingsFromRows(scheduleRows) : DEFAULT_WORK_SCHEDULE;
      const daySchedule = getScheduleForDate(scheduleSettings);
      if (!daySchedule) return;

      const { data: todayRecord } = await supabase
        .from("attendance_records")
        .select("id, clock_in, clock_out, notes")
        .eq("employee_id", employee.id)
        .eq("date", today)
        .maybeSingle();
      if (cancelled) return;

      const hasClockedIn = !!todayRecord?.clock_in;
      const hasClockedOut = !!todayRecord?.clock_out;

      if (localStorage.getItem(dedupeKey("checkout_time"))) {
        alertedModesRef.current.add("checkout_time");
      }
      if (localStorage.getItem(dedupeKey("checkin_geo"))) {
        alertedModesRef.current.add("checkin_geo");
      }
      if (localStorage.getItem(dedupeKey("auto_checkout"))) {
        autoCheckedOutRef.current = true;
      }
      if (!geoPresenceRef.current) {
        geoPresenceRef.current = (localStorage.getItem(dedupeKey("geo_presence")) as "inside" | "outside") || null;
      }

      const nowZ = zonedParts(new Date(), scheduleSettings.timezone);
      const isSaturday = zonedDayOfWeek(new Date(), scheduleSettings.timezone) === 6;

      // Monday-Friday: Alert at 5:00 PM (17:00), Auto-checkout at 6:00 PM (18:00)
      // Saturday: Alert at 12:00 PM (12:00), Auto-checkout at 1:00 PM (13:00)
      const checkoutAlertMin = isSaturday ? 12 * 60 : 17 * 60;
      const autoCheckoutThresholdMin = isSaturday ? 13 * 60 : 18 * 60;
      const shiftEndLabel = isSaturday ? "12:00 PM" : "5:00 PM";
      const autoCheckoutLabel = isSaturday ? "1:00 PM" : "6:00 PM";

      // 1. AUTOMATIC CHECKOUT: If user forgot to checkout and threshold is reached (only once per day)
      if (hasClockedIn && !hasClockedOut && nowZ.minutesOfDay >= autoCheckoutThresholdMin && !autoCheckedOutRef.current && !localStorage.getItem(dedupeKey("auto_checkout"))) {
        autoCheckedOutRef.current = true;
        localStorage.setItem(dedupeKey("auto_checkout"), "1");
        const now = new Date();
        const timeStr = `${String(nowZ.hh).padStart(2, "0")}:${String(nowZ.mm).padStart(2, "0")}:${String(nowZ.ss).padStart(2, "0")}`;
        const [ciH, ciM, ciS] = (todayRecord.clock_in || "08:00:00").split(":").map(Number);
        const clockInInstant = zonedTimeToInstant(today, ciH, ciM, ciS, scheduleSettings.timezone);
        const hoursWorked = computeHoursWorked(clockInInstant, now, scheduleSettings.breakStartTime, scheduleSettings.breakEndTime);

        const autoNote = todayRecord.notes
          ? `${todayRecord.notes}\nAuto checkout at ${autoCheckoutLabel} (forgot to check out at ${shiftEndLabel})`
          : `Auto checkout at ${autoCheckoutLabel} (forgot to check out at ${shiftEndLabel})`;

        await supabase.from("attendance_records").update({
          clock_out: timeStr,
          hours_worked: hoursWorked,
          notes: autoNote,
        }).eq("id", todayRecord.id);

        setAlertState({
          mode: "auto_checkout",
          title: "Automatic Checkout Completed",
          message: `You were automatically checked out at ${autoCheckoutLabel} because checkout at ${shiftEndLabel} was missed.`,
        });

        if (Notification.permission === "granted") {
          new Notification("Automatic Checkout Completed", {
            body: `Your shift was automatically closed at ${autoCheckoutLabel}.`,
            icon: "/favicon.png",
          });
        }
        return;
      }

      // 2. CHECK-OUT TIME ALERT (Strictly ONCE per day: 5:00 PM on Mon-Fri, 12:00 PM on Sat)
      if (hasClockedIn && !hasClockedOut && nowZ.minutesOfDay >= checkoutAlertMin && nowZ.minutesOfDay < autoCheckoutThresholdMin) {
        if (!alertedModesRef.current.has("checkout_time") && !localStorage.getItem(dedupeKey("checkout_time"))) {
          alertedModesRef.current.add("checkout_time");
          localStorage.setItem(dedupeKey("checkout_time"), "1");

          const checkoutTitle = isSaturday
            ? "🔔 Saturday Shift Ended (12:00 PM)"
            : "🔔 Time to Check Out (5:00 PM)";
          const checkoutMsg = isSaturday
            ? "Saturday half-day shift ended at 12:00 PM. Please remember to check out."
            : "Work hours ended at 5:00 PM. Please remember to check out.";

          setAlertState({
            branchName: branch?.name,
            mode: "checkout",
            title: checkoutTitle,
            message: checkoutMsg,
          });

          const link = "/self-service?tab=checkin&quickCheckOut=1";
          const body = checkoutMsg;

          if (Notification.permission === "granted") {
            const n = new Notification(checkoutTitle, { body, icon: "/favicon.png" });
            n.onclick = () => { window.focus(); navigate(link); };
          }

          supabase.functions.invoke("send-push-notification", {
            body: { title: checkoutTitle, body, data: { link } },
          }).catch(() => {});
        }
      }

      // 3. Geofence Location Watch & 100m Morning Proximity Alert
      if (branch?.latitude && branch?.longitude && navigator.geolocation && !watchIdRef.current) {
        const handleLocationUpdate = (coords: { latitude: number; longitude: number }) => {
          const dist = distanceMeters(coords.latitude, coords.longitude, branch.latitude!, branch.longitude!);
          // Alert within ~100m proximity from company branch or geofence radius
          const proximityRadius = Math.max(branch.geofence_radius_m || 100, 100);

          // (A) Morning Check-In Proximity Alert (Around 100m from company if employee has not checked in yet)
          if (!hasClockedIn && dist <= proximityRadius) {
            if (!alertedModesRef.current.has("checkin_geo") && !localStorage.getItem(dedupeKey("checkin_geo"))) {
              const mins = zonedParts(new Date(), scheduleSettings.timezone).minutesOfDay;
              if (mins >= CHECKIN_WINDOW.startMin && mins <= CHECKIN_WINDOW.endMin) {
                alertedModesRef.current.add("checkin_geo");
                localStorage.setItem(dedupeKey("checkin_geo"), "1");

                const checkinTitle = `📍 Arrived Near ${branch.name} (~${Math.round(dist)}m)`;
                const checkinMsg = "Morning check-in reminder: You haven't checked in yet. Tap to check in now.";

                setAlertState({
                  branchName: branch.name,
                  mode: "checkin",
                  title: checkinTitle,
                  message: checkinMsg,
                });

                const link = "/self-service?tab=checkin&quickCheckIn=1";
                if (Notification.permission === "granted") {
                  const n = new Notification(checkinTitle, { body: checkinMsg, icon: "/favicon.png" });
                  n.onclick = () => { window.focus(); navigate(link); };
                }

                supabase.functions.invoke("send-push-notification", {
                  body: { title: checkinTitle, body: checkinMsg, data: { link } },
                }).catch(() => {});
              }
            }
          }

          // (B) Active Shift GPS Departure & Return Tracking
          if (hasClockedIn && !hasClockedOut) {
            const now = new Date();
            const timeLabel = now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });

            if (dist > proximityRadius) {
              // Stepped outside company perimeter
              if (geoPresenceRef.current !== "outside" && localStorage.getItem(dedupeKey("geo_presence")) !== "outside") {
                geoPresenceRef.current = "outside";
                localStorage.setItem(dedupeKey("geo_presence"), "outside");

                notifyGeofenceEvent({
                  employeeName,
                  employeeId: employee.id,
                  branchName: branch.name,
                  distanceMeters: dist,
                  radiusMeters: proximityRadius,
                  timeLabel,
                  type: "left_perimeter",
                });

                setAlertState({
                  branchName: branch.name,
                  mode: "outside_warning",
                  title: "Outside Workplace Perimeter",
                  message: `${employeeName} left ${branch.name} at ${timeLabel} (~${Math.round(dist)}m away).`,
                });
              }
            } else {
              // Returned back inside company perimeter
              if (geoPresenceRef.current === "outside" || localStorage.getItem(dedupeKey("geo_presence")) === "outside") {
                geoPresenceRef.current = "inside";
                localStorage.setItem(dedupeKey("geo_presence"), "inside");

                notifyGeofenceEvent({
                  employeeName,
                  employeeId: employee.id,
                  branchName: branch.name,
                  distanceMeters: dist,
                  radiusMeters: proximityRadius,
                  timeLabel,
                  type: "returned_perimeter",
                });

                setAlertState({
                  branchName: branch.name,
                  mode: "returned_notice",
                  title: `Welcome Back, ${employeeName}!`,
                  message: `Returned to ${branch.name} at ${timeLabel}. You are now back inside company perimeter.`,
                });

                setTimeout(() => {
                  setAlertState((curr) => (curr?.mode === "returned_notice" ? null : curr));
                }, 10000);
              }
            }
          }
        };

        // Immediate one-off position check for prompt morning arrival detection
        navigator.geolocation.getCurrentPosition(
          (pos) => handleLocationUpdate(pos.coords),
          () => {},
          { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 }
        );

        // Continuous watch for movement
        watchIdRef.current = navigator.geolocation.watchPosition(
          (pos) => handleLocationUpdate(pos.coords),
          () => {},
          { enableHighAccuracy: true, maximumAge: 15000, timeout: 15000 }
        );
      }
    };

    checkAttendanceSchedule();
    const interval = setInterval(checkAttendanceSchedule, 20000);

    return () => {
      cancelled = true;
      clearInterval(interval);
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [user?.id, user?.email, navigate]);

  if (!alertState) return null;

  const isCheckin = alertState.mode === "checkin";
  const isAuto = alertState.mode === "auto_checkout";
  const isOutside = alertState.mode === "outside_warning";
  const isReturned = alertState.mode === "returned_notice";
  const link = isCheckin ? "/self-service?tab=checkin&quickCheckIn=1" : "/self-service?tab=checkin&quickCheckOut=1";

  const getBgColor = () => {
    if (isAuto) return "bg-amber-600";
    if (isOutside) return "bg-rose-600";
    if (isReturned) return "bg-emerald-600";
    return "bg-[#253C7D]";
  };

  const getIcon = () => {
    if (isAuto) return "ri-time-line text-xl";
    if (isCheckin) return "ri-map-pin-user-line text-xl";
    if (isOutside) return "ri-map-pin-distance-line text-xl";
    if (isReturned) return "ri-checkbox-circle-line text-xl";
    return "ri-logout-box-r-line text-xl";
  };

  return (
    <div className="fixed bottom-20 lg:bottom-5 left-1/2 -translate-x-1/2 z-[60] w-[92%] max-w-md animate-in slide-in-from-bottom-4 duration-200">
      <div className={`${getBgColor()} text-white rounded-2xl shadow-2xl px-4 py-3.5 flex items-center gap-3 border border-white/20 backdrop-blur-md`}>
        <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
          <i className={getIcon()} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-bold leading-snug">{alertState.title}</p>
          <p className="text-[11px] text-white/80 leading-relaxed mt-0.5">{alertState.message}</p>
        </div>
        {(isCheckin || alertState.mode === "checkout") && (
          <button
            onClick={() => {
              setAlertState(null);
              navigate(link);
            }}
            className="bg-white text-[#253C7D] text-[12px] font-bold px-3.5 py-1.5 rounded-xl shrink-0 shadow-xs hover:bg-white/95 transition-colors cursor-pointer"
          >
            {isCheckin ? "Check In" : "Check Out"}
          </button>
        )}
        <button onClick={() => setAlertState(null)} className="text-white/60 hover:text-white shrink-0 p-1 cursor-pointer">
          <i className="ri-close-line text-lg" />
        </button>
      </div>
    </div>
  );
}

