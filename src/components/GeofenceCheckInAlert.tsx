import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { distanceMeters } from "@/lib/geo";
import { todayYMD, zonedParts, zonedDayOfWeek, zonedTimeToInstant } from "@/lib/date";
import { DEFAULT_WORK_SCHEDULE, getScheduleForDate, settingsFromRows, computeHoursWorked } from "@/lib/workSchedule";
import { useAuth } from "@/context/AuthContext";

interface BranchGeofence {
  name: string;
  latitude: number | null;
  longitude: number | null;
  geofence_radius_m: number;
}

type Mode = "checkin" | "checkout" | "auto_checkout";

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

  useEffect(() => {
    if (!user?.email) return;
    let cancelled = false;

    const checkAttendanceSchedule = async () => {
      const today = todayYMD();
      const dedupeKey = (m: string) => `att_alert_${m}_${user.id}_${today}`;

      const { data: employee } = await supabase
        .from("employees")
        .select("id, branches(name, latitude, longitude, geofence_radius_m)")
        .eq("email", user.email)
        .maybeSingle();
      if (cancelled || !employee) return;

      const branch = (employee as any).branches as BranchGeofence | undefined;

      // Skip alerts if employee has outside work scheduled or active today
      const { data: outsideTasks } = await supabase
        .from("tasks")
        .select("id, due_date, work_status, work_checked_in_at, created_at")
        .eq("assigned_to", employee.id)
        .eq("is_outside_work", true);

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

      const nowZ = zonedParts(new Date(), scheduleSettings.timezone);
      const isSaturday = zonedDayOfWeek(new Date(), scheduleSettings.timezone) === 6;

      // Monday-Friday: Alert at 5:00 PM (17:00), Auto-checkout at 6:00 PM (18:00)
      // Saturday: Alert at 12:00 PM (12:00), Auto-checkout at 1:00 PM (13:00)
      const checkoutAlertMin = isSaturday ? 12 * 60 : 17 * 60;
      const autoCheckoutThresholdMin = isSaturday ? 13 * 60 : 18 * 60;
      const shiftEndLabel = isSaturday ? "12:00 PM" : "5:00 PM";
      const autoCheckoutLabel = isSaturday ? "1:00 PM" : "6:00 PM";

      // 1. AUTOMATIC CHECKOUT: If user forgot to checkout and threshold is reached
      if (hasClockedIn && !hasClockedOut && nowZ.minutesOfDay >= autoCheckoutThresholdMin && !autoCheckedOutRef.current) {
        autoCheckedOutRef.current = true;
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

      // 2. CHECK-OUT TIME ALERT (5:00 PM on Mon-Fri, 12:00 PM on Sat)
      if (hasClockedIn && !hasClockedOut && nowZ.minutesOfDay >= checkoutAlertMin && nowZ.minutesOfDay < autoCheckoutThresholdMin) {
        if (!alertedModesRef.current.has("checkout_time") && !localStorage.getItem(dedupeKey("checkout_time"))) {
          alertedModesRef.current.add("checkout_time");
          localStorage.setItem(dedupeKey("checkout_time"), "1");

          setAlertState({
            branchName: branch?.name,
            mode: "checkout",
            title: `Time to Check Out (${shiftEndLabel})`,
            message: `Your shift ended at ${shiftEndLabel}. Please check out now (auto checkout at ${autoCheckoutLabel}).`,
          });

          const link = "/self-service?tab=checkin&quickCheckOut=1";
          const body = `Your shift ended at ${shiftEndLabel}. Tap to check out now.`;

          if (Notification.permission === "granted") {
            const n = new Notification(`Time to Check Out (${shiftEndLabel})`, { body, icon: "/favicon.png" });
            n.onclick = () => { window.focus(); navigate(link); };
          }

          supabase.functions.invoke("send-push-notification", {
            body: { title: `Time to Check Out (${shiftEndLabel})`, body, data: { link } },
          }).catch(() => {});
        }
      }

      // 3. Geofence Location Watch (if location is available)
      if (branch?.latitude && branch?.longitude && navigator.geolocation && !watchIdRef.current) {
        watchIdRef.current = navigator.geolocation.watchPosition(
          (pos) => {
            const dist = distanceMeters(pos.coords.latitude, pos.coords.longitude, branch.latitude!, branch.longitude!);
            if (dist > branch.geofence_radius_m) return;

            if (!hasClockedIn && !alertedModesRef.current.has("checkin_geo") && !localStorage.getItem(dedupeKey("checkin_geo"))) {
              const mins = zonedParts(new Date(), scheduleSettings.timezone).minutesOfDay;
              if (mins >= CHECKIN_WINDOW.startMin && mins <= CHECKIN_WINDOW.endMin) {
                alertedModesRef.current.add("checkin_geo");
                localStorage.setItem(dedupeKey("checkin_geo"), "1");
                setAlertState({
                  branchName: branch.name,
                  mode: "checkin",
                  title: `You're near ${branch.name}`,
                  message: "Tap to check in now.",
                });
              }
            }
          },
          () => {},
          { enableHighAccuracy: true, maximumAge: 30000, timeout: 20000 }
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
  const link = isCheckin ? "/self-service?tab=checkin&quickCheckIn=1" : "/self-service?tab=checkin&quickCheckOut=1";

  return (
    <div className="fixed bottom-20 lg:bottom-5 left-1/2 -translate-x-1/2 z-[60] w-[92%] max-w-md">
      <div className={`${isAuto ? "bg-amber-600" : "bg-[#253C7D]"} text-white rounded-2xl shadow-2xl px-4 py-3.5 flex items-center gap-3 border border-white/20 backdrop-blur-md`}>
        <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
          <i className={`${isAuto ? "ri-time-line text-xl" : isCheckin ? "ri-map-pin-user-line text-xl" : "ri-logout-box-r-line text-xl"}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-bold leading-snug">{alertState.title}</p>
          <p className="text-[11px] text-white/80 leading-relaxed mt-0.5">{alertState.message}</p>
        </div>
        {!isAuto && (
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
