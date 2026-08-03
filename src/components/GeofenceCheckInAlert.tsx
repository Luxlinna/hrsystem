import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { distanceMeters } from "@/lib/geo";
import { useAuth } from "@/context/AuthContext";

interface BranchGeofence {
  name: string;
  latitude: number | null;
  longitude: number | null;
  geofence_radius_m: number;
}

// Watches the employee's live position (while the app is open) and, once
// they come within the branch's check-in radius, shows a "tap to check in"
// banner and — if push is configured — fires a phone notification too, so
// it still reaches them if this tab is backgrounded.
export default function GeofenceCheckInAlert() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [nearby, setNearby] = useState<{ branchName: string } | null>(null);
  const alertedRef = useRef(false);
  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!user?.email) return;
    let cancelled = false;

    const today = new Date().toISOString().split("T")[0];
    const dedupeKey = `geofence_alerted_${user.id}_${today}`;
    if (localStorage.getItem(dedupeKey)) return;

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
        .select("clock_in")
        .eq("employee_id", employee.id)
        .eq("date", today)
        .maybeSingle();
      if (cancelled || todayRecord?.clock_in) return;

      if (!navigator.geolocation) return;

      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          if (alertedRef.current) return;
          const dist = distanceMeters(pos.coords.latitude, pos.coords.longitude, branch.latitude!, branch.longitude!);
          if (dist <= branch.geofence_radius_m) {
            alertedRef.current = true;
            localStorage.setItem(dedupeKey, "1");
            setNearby({ branchName: branch.name });

            if (Notification.permission === "granted") {
              const n = new Notification(`You're near ${branch.name}`, {
                body: "Tap to check in.",
                icon: "/favicon.png",
              });
              n.onclick = () => { window.focus(); navigate("/self-service?tab=checkin&quickCheckIn=1"); };
            }

            supabase.functions.invoke("send-push-notification", {
              body: {
                title: `You're near ${branch.name}`,
                body: "Tap to check in.",
                data: { link: "/self-service?tab=checkin&quickCheckIn=1" },
              },
            }).catch(() => {});
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

  return (
    <div className="fixed bottom-20 lg:bottom-5 left-1/2 -translate-x-1/2 z-[60] w-[92%] max-w-sm">
      <div className="bg-[#253C7D] text-white rounded-2xl shadow-xl px-4 py-3 flex items-center gap-3">
        <i className="ri-map-pin-user-line text-xl shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold">You're near {nearby.branchName}</p>
          <p className="text-[11px] text-white/70">Tap to check in now</p>
        </div>
        <button
          onClick={() => navigate("/self-service?tab=checkin&quickCheckIn=1")}
          className="bg-white text-[#253C7D] text-[12px] font-bold px-3 py-1.5 rounded-lg shrink-0 cursor-pointer"
        >
          Check In
        </button>
        <button onClick={() => setNearby(null)} className="text-white/60 hover:text-white shrink-0 cursor-pointer">
          <i className="ri-close-line text-lg" />
        </button>
      </div>
    </div>
  );
}
