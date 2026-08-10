import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { distanceMeters } from "@/lib/geo";
import { todayYMD } from "@/lib/date";
import { useAuth } from "@/context/AuthContext";

interface BranchGeofence {
  name: string;
  latitude: number | null;
  longitude: number | null;
  geofence_radius_m: number;
}

type Mode = "checkin" | "checkout";

// Check-in reminders only make sense in the morning, check-out reminders
// only in the afternoon/evening — outside these windows (e.g. lunchtime)
// no alert fires at all, even if the employee is right next to the office.
const CHECKIN_WINDOW = { startMin: 7 * 60, endMin: 11 * 60 + 59 };
const CHECKOUT_WINDOW = { startMin: 13 * 60, endMin: 19 * 60 };

const inWindow = (w: { startMin: number; endMin: number }) => {
  const now = new Date();
  const mins = now.getHours() * 60 + now.getMinutes();
  return mins >= w.startMin && mins <= w.endMin;
};

// Watches the employee's live position (while the app is open) and, once
// they come within the branch's radius during the right time-of-day
// window, shows a "tap to check in/out" banner and — if push is
// configured — fires a phone notification too, so it still reaches them
// if this tab is backgrounded. Each of check-in and check-out alerts at
// most once per day, regardless of how long they linger nearby.
export default function GeofenceCheckInAlert() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [nearby, setNearby] = useState<{ branchName: string; mode: Mode } | null>(null);
  const alertedModesRef = useRef<Set<Mode>>(new Set());
  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!user?.email) return;
    let cancelled = false;

    const today = todayYMD();
    const dedupeKey = (mode: Mode) => `geofence_alerted_${mode}_${user.id}_${today}`;

    (async () => {
      const { data: employee } = await supabase
        .from("employees")
        .select("id, branches(name, latitude, longitude, geofence_radius_m)")
        .eq("email", user.email)
        .maybeSingle();
      if (cancelled || !employee) return;

      const branch = (employee as any).branches as BranchGeofence | undefined;
      if (!branch?.latitude || !branch?.longitude) return;

      const { data: todayRecord } = await supabase
        .from("attendance_records")
        .select("clock_in, clock_out")
        .eq("employee_id", employee.id)
        .eq("date", today)
        .maybeSingle();
      if (cancelled) return;

      const hasClockedIn = !!todayRecord?.clock_in;
      const hasClockedOut = !!todayRecord?.clock_out;

      if (localStorage.getItem(dedupeKey("checkin"))) alertedModesRef.current.add("checkin");
      if (localStorage.getItem(dedupeKey("checkout"))) alertedModesRef.current.add("checkout");

      // Nothing left to remind about today (either both windows already
      // fired, or the day's attendance is already fully wrapped up).
      const checkinDone = hasClockedIn || alertedModesRef.current.has("checkin");
      const checkoutDone = hasClockedOut || alertedModesRef.current.has("checkout");
      if (checkinDone && checkoutDone) return;
      if (!navigator.geolocation) return;

      const fire = (mode: Mode) => {
        alertedModesRef.current.add(mode);
        localStorage.setItem(dedupeKey(mode), "1");
        setNearby({ branchName: branch.name, mode });

        const link = mode === "checkin" ? "/self-service?tab=checkin&quickCheckIn=1" : "/self-service?tab=checkin&quickCheckOut=1";
        const body = mode === "checkin" ? "Tap to check in." : "Tap to check out.";

        if (Notification.permission === "granted") {
          const n = new Notification(`You're near ${branch.name}`, { body, icon: "/favicon.png" });
          n.onclick = () => { window.focus(); navigate(link); };
        }

        supabase.functions.invoke("send-push-notification", {
          body: { title: `You're near ${branch.name}`, body, data: { link } },
        }).catch(() => {});
      };

      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          const dist = distanceMeters(pos.coords.latitude, pos.coords.longitude, branch.latitude!, branch.longitude!);
          if (dist > branch.geofence_radius_m) return;

          if (!hasClockedIn && !alertedModesRef.current.has("checkin") && inWindow(CHECKIN_WINDOW)) {
            fire("checkin");
          } else if (hasClockedIn && !hasClockedOut && !alertedModesRef.current.has("checkout") && inWindow(CHECKOUT_WINDOW)) {
            fire("checkout");
          }
        },
        () => {},
        { enableHighAccuracy: true, maximumAge: 30000, timeout: 20000 }
      );
    })();

    return () => {
      cancelled = true;
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, [user?.id, user?.email, navigate]);

  if (!nearby) return null;

  const isCheckin = nearby.mode === "checkin";
  const link = isCheckin ? "/self-service?tab=checkin&quickCheckIn=1" : "/self-service?tab=checkin&quickCheckOut=1";

  return (
    <div className="fixed bottom-20 lg:bottom-5 left-1/2 -translate-x-1/2 z-[60] w-[92%] max-w-sm">
      <div className="bg-[#253C7D] text-white rounded-2xl shadow-xl px-4 py-3 flex items-center gap-3">
        <i className="ri-map-pin-user-line text-xl shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold">You're near {nearby.branchName}</p>
          <p className="text-[11px] text-white/70">{isCheckin ? "Tap to check in now" : "Tap to check out now"}</p>
        </div>
        <button
          onClick={() => navigate(link)}
          className="bg-white text-[#253C7D] text-[12px] font-bold px-3 py-1.5 rounded-lg shrink-0 cursor-pointer"
        >
          {isCheckin ? "Check In" : "Check Out"}
        </button>
        <button onClick={() => setNearby(null)} className="text-white/60 hover:text-white shrink-0 cursor-pointer">
          <i className="ri-close-line text-lg" />
        </button>
      </div>
    </div>
  );
}
