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
  author_name?: string | null;
}

const ALERT_INTERVAL_MS = 30000;
const DEFAULT_URGENT_ALERT_HOURS = 24;

import { playAnnouncementAlertSound } from "@/lib/alertSounds";
import { getStoredAlertDeliveryType, getStoredAlertIntervalSeconds } from "@/lib/announcementAlertTypes";

export default function UrgentAnnouncementAlert() {
  const { user } = useAuth();
  const { role, isAdmin, isBranchAdmin, loading: permissionsLoading } = usePermissions();
  const canManage = isAdmin || isBranchAdmin || (!!role && !["Employee", "Staff"].includes(role.name));
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
    () =>
      announcements.find(
        (a) =>
          !acceptedIds.has(a.id) &&
          isWithinUrgentAlertWindow(a) &&
          (!user?.email || a.author_name !== user.email)
      ) || null,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [announcements, acceptedIds, user?.email]
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
        .select("id, title, content, category, published_at, urgent_alert_hours, author_name")
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

  const alertDeliveryType = getStoredAlertDeliveryType();
  const intervalSec = getStoredAlertIntervalSeconds();

  useEffect(() => {
    if (!mustAcceptUrgentAnnouncements || !active) return;

    const intervalMs = intervalSec === 0 ? Infinity : Math.max(5000, intervalSec * 1000);

    const triggerAlert = async () => {
      const now = Date.now();
      const last = lastAlertTimeRef.current[active.id] || 0;
      if (last > 0 && intervalSec === 0) return;
      if (now - last < (intervalMs === Infinity ? 1000 : intervalMs - 1000)) return;
      lastAlertTimeRef.current[active.id] = now;

      // Play configured announcement alert sound
      playAnnouncementAlertSound();

      // Web Browser Notification if available
      if ("Notification" in window) {
        if (Notification.permission === "default") {
          await Notification.requestPermission().catch(() => {});
        }
        if (Notification.permission === "granted") {
          const published = new Date(active.published_at).getTime();
          const hoursAgo = Math.floor((now - published) / (60 * 60 * 1000));
          const timeAgo = hoursAgo > 0 ? `${hoursAgo}h ago` : `${Math.floor((now - published) / (60 * 1000))}m ago`;
          const link = `${__BASE_PATH__ === "/" ? "" : __BASE_PATH__}/announcements?highlight=${active.id}`;
          const options = {
            body: `Urgent announcement published ${timeAgo}: ${active.title}`,
            icon: "/favicon.png",
            requireInteraction: true,
            data: { link, source: "announcements", priority: "urgent" },
          };
          const registration = await navigator.serviceWorker?.ready.catch(() => null);
          if (registration?.showNotification) {
            await registration.showNotification(`Urgent: ${active.title}`, {
              ...options,
              actions: [
                { action: "accept", title: "Acknowledge" },
                { action: "close", title: "Dismiss" },
              ],
            }).catch(() => {});
          } else {
            const notification = new Notification(`Urgent: ${active.title}`, options);
            notification.onclick = () => {
              window.focus();
              window.location.href = link;
            };
          }
        }
      }
    };

    triggerAlert();
    if (intervalMs !== Infinity) {
      const timer = window.setInterval(triggerAlert, intervalMs);
      return () => window.clearInterval(timer);
    }
  }, [active, mustAcceptUrgentAnnouncements, intervalSec]);

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
      setAcceptError("Could not acknowledge yet. Please refresh.");
      console.error("urgent announcement accept failed:", error.message);
      return;
    }
    toast("Acknowledged", "Urgent announcement acknowledged.", "success");
    setAcceptedIds((prev) => new Set(prev).add(data?.announcement_id || announcementId));
  };

  if (!mustAcceptUrgentAnnouncements || !active) return null;

  // 1. Mandatory Modal Takeover Mode
  if (alertDeliveryType === "modal") {
    return (
      <div className="fixed inset-0 z-[85] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
        <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-rose-200 dark:border-rose-900/50 space-y-4 animate-in zoom-in-95 duration-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center text-2xl font-bold shrink-0 border border-rose-200 dark:border-rose-900/60 shadow-xs">
              <i className="ri-alarm-warning-fill" />
            </div>
            <div>
              <span className="px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 text-[10.5px] font-extrabold uppercase tracking-wide">
                Urgent Compliance Notice
              </span>
              <h3 className="text-base font-black text-gray-900 dark:text-slate-100 tracking-tight mt-0.5 line-clamp-2">
                {active.title}
              </h3>
            </div>
          </div>

          {active.content && (
            <div className="p-3.5 bg-gray-50 dark:bg-slate-800/80 rounded-2xl border border-gray-200/70 dark:border-slate-700/70 max-h-48 overflow-y-auto text-xs text-gray-700 dark:text-slate-300 leading-relaxed font-sans">
              {active.content.replace(/<[^>]*>?/gm, "")}
            </div>
          )}

          {acceptError && (
            <p className="text-xs text-rose-600 font-bold">{acceptError}</p>
          )}

          <div className="flex items-center gap-2.5 pt-2">
            <button
              type="button"
              onClick={accept}
              disabled={accepting}
              className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 active:scale-98 text-white text-xs font-black rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {accepting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Acknowledging...</span>
                </>
              ) : (
                <>
                  <i className="ri-check-double-line text-sm" />
                  <span>I Acknowledge &amp; Accept</span>
                </>
              )}
            </button>
            <Link
              to={`/announcements?highlight=${active.id}`}
              className="px-4 py-3 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-colors shrink-0"
            >
              Full Details
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 2. Corner Toast Mode
  if (alertDeliveryType === "compact_toast") {
    return (
      <div
        className="fixed right-3 sm:right-6 z-[70] max-w-sm w-full pointer-events-none transition-all duration-300 animate-in slide-in-from-right-5 duration-300"
        style={{ top: "calc(env(safe-area-inset-top, 0px) + 16px)" }}
      >
        <div className="pointer-events-auto bg-slate-900/95 dark:bg-slate-950/95 text-white p-4 rounded-2xl shadow-xl border border-rose-500/30 backdrop-blur-xl space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 text-[10.5px] font-bold tracking-wide uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping" />
              Urgent Notice
            </span>
            <Link
              to={`/announcements?highlight=${active.id}`}
              className="text-[11px] text-slate-300 hover:text-white underline font-medium"
            >
              View Details
            </Link>
          </div>

          <div>
            <h4 className="text-xs font-bold text-white tracking-tight leading-snug line-clamp-1">{active.title}</h4>
            {active.content && (
              <p className="text-[11px] text-slate-300/80 line-clamp-1 mt-0.5">
                {active.content.replace(/<[^>]*>?/gm, "")}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={accept}
            disabled={accepting}
            className="w-full py-2 bg-rose-600 hover:bg-rose-500 active:scale-98 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-xs disabled:opacity-50 flex items-center justify-center gap-1"
          >
            {accepting ? "Acknowledging..." : "Acknowledge Notice"}
          </button>
        </div>
      </div>
    );
  }

  // 3. Dynamic Island Banner Mode (Default)
  return (
    <div
      className="fixed inset-x-3 z-[70] flex justify-center pointer-events-none transition-all duration-300"
      style={{ top: "calc(env(safe-area-inset-top, 0px) + 12px)" }}
    >
      <div className="pointer-events-auto w-full max-w-xl bg-slate-900/95 dark:bg-slate-950/95 text-white rounded-2xl shadow-[0_16px_40px_rgba(0,0,0,0.35),0_0_0_1px_rgba(244,63,94,0.3)] backdrop-blur-xl p-3.5 sm:p-4 border border-rose-500/25 animate-in slide-in-from-top-4 duration-300">
        <div className="flex items-start sm:items-center gap-3">
          {/* Subtle Icon Badge */}
          <div className="w-9 h-9 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center shrink-0 text-rose-400">
            <i className="ri-alarm-warning-fill text-lg animate-pulse" />
          </div>

          {/* Content info */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 text-[10.5px] font-bold tracking-wide uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                Urgent Notice
              </span>
            </div>
            <h3 className="text-xs sm:text-sm font-bold text-white tracking-tight leading-snug line-clamp-1">
              {active.title}
            </h3>
            {active.content && (
              <p className="text-[11.5px] text-slate-300/80 line-clamp-1 mt-0.5">
                {active.content.replace(/<[^>]*>?/gm, "")}
              </p>
            )}
            {acceptError && (
              <p className="text-[10.5px] text-rose-300 font-semibold mt-1">{acceptError}</p>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5 shrink-0 self-center">
            <button
              type="button"
              onClick={accept}
              disabled={accepting}
              className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white text-xs font-bold transition-all cursor-pointer shadow-xs disabled:opacity-50 flex items-center gap-1"
            >
              {accepting ? (
                <>
                  <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>...</span>
                </>
              ) : (
                <>
                  <i className="ri-check-line text-sm" />
                  <span>Acknowledge</span>
                </>
              )}
            </button>
            <Link
              to={`/announcements?highlight=${active.id}`}
              className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-semibold transition-colors flex items-center gap-1"
            >
              <span>View</span>
              <i className="ri-arrow-right-s-line text-xs" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
