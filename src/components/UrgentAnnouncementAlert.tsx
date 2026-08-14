import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";

interface UrgentAnnouncement {
  id: string;
  title: string;
  content: string | null;
  category: string;
  published_at: string;
}

const ALERT_INTERVAL_MS = 30000;

export default function UrgentAnnouncementAlert() {
  const { user } = useAuth();
  const { role, isAdmin, loading: permissionsLoading } = usePermissions();
  const mustAcceptUrgentAnnouncements = !permissionsLoading && !isAdmin && (!role || ["Employee", "Staff"].includes(role.name));
  const [announcements, setAnnouncements] = useState<UrgentAnnouncement[]>([]);
  const [acceptedIds, setAcceptedIds] = useState<Set<string>>(new Set());
  const [accepting, setAccepting] = useState(false);
  const [acceptError, setAcceptError] = useState("");
  const lastBrowserAlertRef = useRef<Record<string, number>>({});

  const active = useMemo(
    () => announcements.find((a) => !acceptedIds.has(a.id)) || null,
    [announcements, acceptedIds]
  );

  const loadUrgentAnnouncements = async () => {
    if (!user?.id || !mustAcceptUrgentAnnouncements) {
      setAnnouncements([]);
      setAcceptedIds(new Set());
      return;
    }
    const [{ data: urgentData }, { data: ackData }] = await Promise.all([
      supabase
        .from("announcements")
        .select("id, title, content, category, published_at")
        .eq("priority", "urgent")
        .order("published_at", { ascending: false }),
      supabase
        .from("announcement_acknowledgements")
        .select("announcement_id")
        .eq("user_id", user.id),
    ]);

    setAnnouncements((urgentData || []) as UrgentAnnouncement[]);
    setAcceptedIds(new Set((ackData || []).map((row) => row.announcement_id)));
  };

  useEffect(() => {
    if (!user?.id || permissionsLoading) return;
    loadUrgentAnnouncements();

    const channel = supabase
      .channel("urgent-announcements-alert")
      .on("postgres_changes", { event: "*", schema: "public", table: "announcements" }, () => loadUrgentAnnouncements())
      .on("postgres_changes", { event: "*", schema: "public", table: "announcement_acknowledgements" }, () => loadUrgentAnnouncements())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, permissionsLoading, mustAcceptUrgentAnnouncements]);

  useEffect(() => {
    if (!mustAcceptUrgentAnnouncements || !active || !("Notification" in window)) return;

    const showBrowserAlert = async () => {
      if (Notification.permission === "default") await Notification.requestPermission();
      if (Notification.permission !== "granted") return;
      const now = Date.now();
      if (now - (lastBrowserAlertRef.current[active.id] || 0) < ALERT_INTERVAL_MS) return;
      lastBrowserAlertRef.current[active.id] = now;
      const link = `${__BASE_PATH__ === "/" ? "" : __BASE_PATH__}/announcements?highlight=${active.id}`;
      const options: NotificationOptions = {
        body: "Please open HRM_OPS and click Accept.",
        icon: "/favicon.png",
        requireInteraction: true,
        data: { link, source: "announcements", priority: "urgent" },
      };
      const registration = await navigator.serviceWorker?.ready.catch(() => null);
      if (registration?.showNotification) {
        await registration.showNotification(`Urgent announcement: ${active.title}`, {
          ...options,
          actions: [
            { action: "accept", title: "Accept" },
            { action: "close", title: "Close" },
          ],
        });
        return;
      }

      const notification = new Notification(`Urgent announcement: ${active.title}`, options);
      notification.onclick = () => {
        window.focus();
        window.location.href = link;
      };
    };

    showBrowserAlert();
    const timer = window.setInterval(showBrowserAlert, ALERT_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [active?.id, mustAcceptUrgentAnnouncements]);

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
    setAcceptedIds((prev) => new Set(prev).add(data?.announcement_id || announcementId));
  };

  if (!mustAcceptUrgentAnnouncements || !active) return null;

  return (
    <div className="fixed inset-x-3 top-3 lg:top-4 z-[70] flex justify-center pointer-events-none">
      <div className="pointer-events-auto w-full max-w-2xl bg-red-600 text-white rounded-xl shadow-lg border border-red-400/40 overflow-hidden">
        <div className="px-3 py-2.5 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
            <i className="ri-alarm-warning-line text-base" />
          </div>
          <div className="min-w-0 flex-1 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-white/75">Urgent acknowledgement required</p>
              <div className="flex items-baseline gap-2 min-w-0">
                <h3 className="text-[13px] font-bold leading-tight truncate">{active.title}</h3>
                {active.content && <p className="hidden sm:block text-[12px] text-white/80 truncate">{active.content}</p>}
              </div>
              {acceptError && <p className="text-[11px] text-white font-semibold mt-0.5">{acceptError}</p>}
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                type="button"
                onClick={accept}
                disabled={accepting}
                className="px-3 py-1.5 rounded-lg bg-white text-red-700 text-[12px] font-bold hover:bg-red-50 disabled:opacity-70 cursor-pointer"
              >
                {accepting ? "Accepting..." : "Accept"}
              </button>
              <Link
                to={`/announcements?highlight=${active.id}`}
                className="px-3 py-1.5 rounded-lg bg-white/10 text-white text-[12px] font-semibold hover:bg-white/20"
              >
                View Details
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
