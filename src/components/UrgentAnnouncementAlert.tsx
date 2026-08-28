import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { toast } from "@/components/Toast";

interface UrgentAnnouncement {
  id: string;
  title: string;
  content: string | null;
  category: string;
  published_at: string;
  urgent_alert_hours: number | null;
}

const ALERT_INTERVAL_MS = 30000;
const DEFAULT_URGENT_ALERT_HOURS = 24;

const playUrgentChime = () => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(880, now);
    gain1.gain.setValueAtTime(0.15, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.25);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(1174, now + 0.15);
    gain2.gain.setValueAtTime(0.2, now + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.15);
    osc2.stop(now + 0.45);
  } catch (e) {
    // Ignore audio restrictions gracefully
  }
};

export default function UrgentAnnouncementAlert() {
  const { user } = useAuth();
  const { role, isAdmin, loading: permissionsLoading } = usePermissions();
  const canManage = isAdmin || (!!role && !["Employee", "Staff"].includes(role.name));
  const mustAcceptUrgentAnnouncements = !permissionsLoading && !canManage && Boolean(user?.id);

  const [announcements, setAnnouncements] = useState<UrgentAnnouncement[]>([]);
  const [acceptedIds, setAcceptedIds] = useState<Set<string>>(new Set());
  const [accepting, setAccepting] = useState(false);
  const [acceptError, setAcceptError] = useState("");
  const lastAlertTimeRef = useRef<Record<string, number>>({});

  const getUrgentAlertWindowMs = (alertHours: number | null) => {
    const hours = Number(alertHours);
    return (Number.isFinite(hours) && hours > 0 ? hours : DEFAULT_URGENT_ALERT_HOURS) * 60 * 60 * 1000;
  };

  const isWithinUrgentAlertWindow = (announcement: UrgentAnnouncement): boolean => {
    const published = new Date(announcement.published_at).getTime();
    if (Number.isNaN(published)) return false;
    const age = Date.now() - published;
    return age >= 0 && age <= getUrgentAlertWindowMs(announcement.urgent_alert_hours);
  };

  const active = useMemo(
    () => announcements.find((a) => !acceptedIds.has(a.id) && isWithinUrgentAlertWindow(a)) || null,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [announcements, acceptedIds]
  );

  const loadUrgentAnnouncements = useCallback(async () => {
    if (!user?.id || !mustAcceptUrgentAnnouncements) {
      setAnnouncements([]);
      setAcceptedIds(new Set());
      return;
    }
    const [{ data: urgentData }, { data: ackData }] = await Promise.all([
      supabase
        .from("announcements")
        .select("id, title, content, category, published_at, urgent_alert_hours")
        .eq("priority", "urgent")
        .is("deleted_at", null)
        .order("published_at", { ascending: false }),
      supabase
        .from("announcement_acknowledgements")
        .select("announcement_id")
        .eq("user_id", user.id),
    ]);

    setAnnouncements((urgentData || []) as UrgentAnnouncement[]);
    setAcceptedIds(new Set((ackData || []).map((row) => row.announcement_id)));
  }, [user?.id, mustAcceptUrgentAnnouncements]);

  useEffect(() => {
    if (!user?.id || permissionsLoading) return;
    loadUrgentAnnouncements();

    const channel = supabase
      .channel("urgent-announcements-alert")
      .on("postgres_changes", { event: "*", schema: "public", table: "announcements" }, () => loadUrgentAnnouncements())
      .on("postgres_changes", { event: "*", schema: "public", table: "announcement_acknowledgements" }, () => loadUrgentAnnouncements())
      .subscribe();

    // Poll every 30 seconds while urgent announcements are still inside the alert window.
    const pollInterval = setInterval(() => {
      loadUrgentAnnouncements();
    }, ALERT_INTERVAL_MS);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(pollInterval);
    };
  }, [user?.id, permissionsLoading, mustAcceptUrgentAnnouncements, loadUrgentAnnouncements]);

  useEffect(() => {
    if (!mustAcceptUrgentAnnouncements || !active) return;

    const triggerAlert = async () => {
      const now = Date.now();
      const last = lastAlertTimeRef.current[active.id] || 0;
      if (now - last < ALERT_INTERVAL_MS - 1000) return;
      lastAlertTimeRef.current[active.id] = now;

      const published = new Date(active.published_at).getTime();
      const hoursAgo = Math.floor((now - published) / (60 * 60 * 1000));
      const timeAgo = hoursAgo > 0 ? `${hoursAgo}h ago` : `${Math.floor((now - published) / (60 * 1000))}m ago`;

      toast(
        "URGENT ANNOUNCEMENT",
        `Published ${timeAgo}: "${active.title}". Click Accept to dismiss.`,
        "error"
      );

      // Play audio chime
      playUrgentChime();

      // Web Browser Notification if available
      if ("Notification" in window) {
        if (Notification.permission === "default") {
          await Notification.requestPermission().catch(() => {});
        }
        if (Notification.permission === "granted") {
          const link = `${__BASE_PATH__ === "/" ? "" : __BASE_PATH__}/announcements?highlight=${active.id}`;
          const options = {
            body: `Urgent announcement published ${timeAgo}. Please click Accept in HRM_OPS.`,
            icon: "/favicon.png",
            requireInteraction: true,
            data: { link, source: "announcements", priority: "urgent" },
          };
          const registration = await navigator.serviceWorker?.ready.catch(() => null);
          if (registration?.showNotification) {
            await registration.showNotification(`Urgent Announcement: ${active.title}`, {
              ...options,
              actions: [
                { action: "accept", title: "Accept" },
                { action: "close", title: "Close" },
              ],
            }).catch(() => {});
          } else {
            const notification = new Notification(`Urgent Announcement: ${active.title}`, options);
            notification.onclick = () => {
              window.focus();
              window.location.href = link;
            };
          }
        }
      }
    };

    triggerAlert();
    const timer = window.setInterval(triggerAlert, ALERT_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [active, mustAcceptUrgentAnnouncements]);

  const accept = async () => {
    if (!active || !user?.id || accepting) return;
    setAccepting(true);
    setAcceptError("");
    const announcementId = active.id;
    const { data, error } = await supabase.from("announcement_acknowledgements").upsert(
      { announcement_id: announcementId, user_id: user.id, accepted_at: new Date().toISOString() },
      { onConflict: "announcement_id,user_id" }
    ).select("announcement_id").single();
    setAccepting(false);
    if (error) {
      setAcceptError("Could not accept yet. Please refresh and try again.");
      console.error("urgent announcement accept failed:", error.message);
      return;
    }
    toast("Accepted", "Urgent announcement acknowledged successfully.", "success");
    setAcceptedIds((prev) => new Set(prev).add(data?.announcement_id || announcementId));
  };

  if (!mustAcceptUrgentAnnouncements || !active) return null;

  return (
    <div className="fixed inset-x-3 top-3 lg:top-4 z-[70] flex justify-center pointer-events-none">
      <div className="pointer-events-auto w-full max-w-2xl bg-red-600 text-white rounded-xl shadow-2xl border-2 border-red-400 overflow-hidden animate-bounce" style={{ animationDuration: '3s' }}>
        <div className="px-4 py-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center shrink-0 animate-pulse">
            <i className="ri-alarm-warning-fill text-lg text-white" />
          </div>
          <div className="min-w-0 flex-1 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-white animate-ping" />
                <p className="text-[10px] font-bold uppercase tracking-wider text-white/90">Urgent announcement — Action required every 30s</p>
              </div>
              <div className="flex items-baseline gap-2 min-w-0 mt-0.5">
                <h3 className="text-[14px] font-bold leading-tight truncate">{active.title}</h3>
                {active.content && <p className="hidden sm:block text-[12px] text-white/80 truncate max-w-xs">{active.content}</p>}
              </div>
              {acceptError && <p className="text-[11px] text-white font-semibold mt-0.5">{acceptError}</p>}
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                type="button"
                onClick={accept}
                disabled={accepting}
                className="px-4 py-2 rounded-lg bg-white text-red-700 text-[13px] font-extrabold hover:bg-red-50 active:scale-95 disabled:opacity-70 transition-transform cursor-pointer shadow"
              >
                {accepting ? "Accepting..." : "Accept Now"}
              </button>
              <Link
                to={`/announcements?highlight=${active.id}`}
                className="px-3 py-2 rounded-lg bg-white/15 text-white text-[12px] font-semibold hover:bg-white/25 transition-colors"
              >
                View
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
