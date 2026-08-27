import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import { usePermissions } from "@/hooks/usePermissions";
import { getNotificationTarget, canSeeNotification } from "@/lib/notificationRoutes";
import { useAuth } from "@/context/AuthContext";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "success" | "error";
  source: string;
  entity_id: string | null;
  recipient_user_id: string | null;
  is_read: boolean;
  created_at: string;
}

const typeConfig: Record<string, { icon: string; bg: string; text: string; border: string; accent: string }> = {
  success: {
    icon: "ri-checkbox-circle-line",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    accent: "bg-emerald-500",
  },
  warning: {
    icon: "ri-error-warning-line",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    accent: "bg-amber-500",
  },
  error: {
    icon: "ri-close-circle-line",
    bg: "bg-rose-50",
    text: "text-rose-700",
    border: "border-rose-200",
    accent: "bg-rose-500",
  },
  info: {
    icon: "ri-information-line",
    bg: "bg-[#253C7D]/10",
    text: "text-[#253C7D]",
    border: "border-[#253C7D]/20",
    accent: "bg-[#253C7D]",
  },
};

const sourceLabels: Record<string, string> = {
  hire: "Recruitment",
  leave: "Leave",
  payroll: "Payroll",
  branches: "Branches",
  system: "System",
  employees: "Employees",
  onboarding: "Onboarding",
  offboard: "Offboarding",
  finance: "Finance",
  it_management: "IT",
  benefits: "Benefits",
  training: "Training",
  tools: "Tools",
  announcements: "Announcements",
  meeting_rooms: "Meeting Rooms",
  password_reset: "Password Reset",
  tasks: "Tasks",
};

function isToday(date: Date, ref: Date): boolean {
  return (
    date.getFullYear() === ref.getFullYear() &&
    date.getMonth() === ref.getMonth() &&
    date.getDate() === ref.getDate()
  );
}

function relativeTime(iso: string): string {
  const then = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - then.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24 && isToday(then, now)) return `${diffHr}h ago`;
  return then.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function Notifications() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { can, loading: permLoading } = usePermissions();
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [filter, setFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("");
  const [search, setSearch] = useState("");
  const [todayOnly, setTodayOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [realtimeEnabled, setRealtimeEnabled] = useState(true);

  // A broadcast notification (recipient_user_id null) about a module this
  // role can't open is just noise — filter it out the same way clicking it
  // already silently no-ops in openNotification. Personal notifications
  // (addressed to this user specifically) always show regardless of module
  // access.
  const visibleNotifs = useMemo(
    () =>
      notifs.filter(
        (n) => n.recipient_user_id === user?.id || canSeeNotification(n.source, can)
      ),
    [notifs, can, user?.id]
  );

  const unreadCount = useMemo(
    () => visibleNotifs.filter((n) => !n.is_read).length,
    [visibleNotifs]
  );

  useEffect(() => {
    if (!user?.id) return;
    loadNotifications();

    const channel = supabase
      .channel("notifications_changes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        (payload) => {
          const newNotif = payload.new as Notification;
          if (newNotif.recipient_user_id && newNotif.recipient_user_id !== user.id) return;
          setNotifs((prev) => [newNotif, ...prev]);
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "notifications" },
        (payload) => {
          const updated = payload.new as Notification;
          if (updated.recipient_user_id && updated.recipient_user_id !== user.id) return;
          setNotifs((prev) =>
            prev.map((n) => (n.id === updated.id ? updated : n))
          );
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "notifications" },
        (payload) => {
          const deleted = payload.old as Notification;
          if (deleted.recipient_user_id && deleted.recipient_user_id !== user.id) return;
          setNotifs((prev) => prev.filter((n) => n.id !== deleted.id));
        }
      )
      .subscribe((status) => {
        setRealtimeEnabled(status === "SUBSCRIBED");
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const loadNotifications = async () => {
    if (!user?.id) return;
    setLoading(true);
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .or(`recipient_user_id.is.null,recipient_user_id.eq.${user.id}`)
      .order("created_at", { ascending: false });
    setNotifs((data || []) as Notification[]);
    setLoading(false);
  };

  const todayCount = useMemo(() => {
    const now = new Date();
    return visibleNotifs.filter((n) => isToday(new Date(n.created_at), now)).length;
  }, [visibleNotifs]);

  const urgentCount = useMemo(
    () => visibleNotifs.filter((n) => n.type === "warning" || n.type === "error").length,
    [visibleNotifs]
  );

  const filtered = useMemo(() => {
    const now = new Date();
    const q = search.trim().toLowerCase();
    return visibleNotifs.filter((n) => {
      const typeMatch =
        filter === "all"
          ? true
          : filter === "unread"
          ? !n.is_read
          : filter === "urgent"
          ? n.type === "warning" || n.type === "error"
          : n.type === filter;
      const sourceMatch = !sourceFilter || n.source === sourceFilter;
      const dateMatch = !todayOnly || isToday(new Date(n.created_at), now);
      const searchMatch =
        !q || n.title.toLowerCase().includes(q) || n.message.toLowerCase().includes(q);
      return typeMatch && sourceMatch && dateMatch && searchMatch;
    });
  }, [visibleNotifs, filter, sourceFilter, todayOnly, search]);

  const groups = useMemo(() => {
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const today: Notification[] = [];
    const yday: Notification[] = [];
    const earlier: Notification[] = [];
    filtered.forEach((n) => {
      const d = new Date(n.created_at);
      if (isToday(d, now)) today.push(n);
      else if (isToday(d, yesterday)) yday.push(n);
      else earlier.push(n);
    });
    return [
      { label: "Today", items: today },
      { label: "Yesterday", items: yday },
      { label: "Earlier", items: earlier },
    ].filter((g) => g.items.length > 0);
  }, [filtered]);

  const resetFilters = () => {
    setFilter("all");
    setSourceFilter("");
    setSearch("");
    setTodayOnly(false);
  };

  const markRead = async (id: string) => {
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id);
    if (error) {
      toast("Error", error.message, "error");
      return;
    }
    setNotifs((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
  };

  const markAllRead = async () => {
    // Scope to what's actually visible to this role — is_read is a single
    // shared column on a broadcast row, not per-recipient, so marking a
    // notification read here also marks it read for every other role that
    // can see it. Never touch rows this role can't even see.
    const unreadIds = visibleNotifs.filter((n) => !n.is_read).map((n) => n.id);
    if (unreadIds.length === 0) return;
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .in("id", unreadIds);
    if (error) {
      toast("Error", error.message, "error");
      return;
    }
    const idSet = new Set(unreadIds);
    setNotifs((prev) => prev.map((n) => (idSet.has(n.id) ? { ...n, is_read: true } : n)));
    toast("All read", "All notifications have been marked as read.", "success");
  };

  const deleteNotification = async (id: string) => {
    const { error } = await supabase.from("notifications").delete().eq("id", id);
    if (error) {
      toast("Error", error.message, "error");
      return;
    }
    setNotifs((prev) => prev.filter((n) => n.id !== id));
  };

  const openNotification = (n: Notification) => {
    if (!n.is_read) markRead(n.id);
    const target = getNotificationTarget(n.source, n.entity_id);
    if (target && can(target.module)) navigate(target.path);
  };

  const isNavigable = (n: Notification) => {
    const target = getNotificationTarget(n.source, n.entity_id);
    return !!target && can(target.module);
  };

  const sources = Array.from(new Set(visibleNotifs.map((n) => n.source))).sort();
  const filtersActive = filter !== "all" || !!sourceFilter || !!search || todayOnly;

  if (loading || permLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8F9FB]">
        <div className="w-9 h-9 border-3 border-[#253C7D] border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-semibold text-gray-500">Loading notifications...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FB] p-5 sm:p-7 lg:p-8 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
            <span>Workspace</span>
            <i className="ri-arrow-right-s-line text-xs" />
            <span className="text-[#253C7D] font-bold">Notifications</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2.5">
            Notifications
            {realtimeEnabled && (
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live
              </span>
            )}
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Stay on top of activity across recruitment, leave, payroll, and every module you have access to.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Link
            to="/settings"
            title="Notification preferences"
            className="p-2.5 bg-white border border-gray-200/80 hover:bg-gray-50 text-gray-500 rounded-xl shadow-2xs transition-all cursor-pointer"
          >
            <i className="ri-settings-4-line text-sm w-4 h-4 flex items-center justify-center" />
          </Link>
          <button
            onClick={loadNotifications}
            title="Refresh"
            className="p-2.5 bg-white border border-gray-200/80 hover:bg-gray-50 text-gray-500 rounded-xl shadow-2xs transition-all cursor-pointer"
          >
            <i className="ri-refresh-line text-sm w-4 h-4 flex items-center justify-center" />
          </button>
          <button
            onClick={markAllRead}
            disabled={unreadCount === 0}
            className="inline-flex items-center gap-2 bg-[#253C7D] hover:bg-[#1E3064] text-white px-4 py-2.5 rounded-xl text-xs sm:text-[13px] font-bold transition-all shadow-sm hover:shadow-md cursor-pointer active:scale-98 disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none whitespace-nowrap"
          >
            <i className="ri-mail-open-line text-base" />
            Mark All Read
          </button>
        </div>
      </div>

      {/* KPI Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mb-6">
        <div
          onClick={resetFilters}
          className={`bg-white border rounded-2xl p-4 transition-all cursor-pointer shadow-2xs hover:shadow-xs relative overflow-hidden ${
            !filtersActive ? "border-[#253C7D] ring-2 ring-[#253C7D]/10" : "border-gray-200/80"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#253C7D] uppercase tracking-wider">Total</span>
            <div className="w-6 h-6 rounded-lg bg-[#253C7D]/10 text-[#253C7D] flex items-center justify-center">
              <i className="ri-notification-3-line text-xs" />
            </div>
          </div>
          <p className="text-2xl font-black text-gray-900 mt-2">{visibleNotifs.length}</p>
          <p className="text-[10px] text-gray-400 mt-0.5">All notifications</p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#253C7D]" />
        </div>

        <div
          onClick={() => setFilter(filter === "unread" ? "all" : "unread")}
          className={`bg-white border rounded-2xl p-4 transition-all cursor-pointer shadow-2xs hover:shadow-xs relative overflow-hidden ${
            filter === "unread" ? "border-amber-500 ring-2 ring-amber-500/10" : "border-gray-200/80"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Unread</span>
            <div className="w-6 h-6 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <i className="ri-mail-unread-line text-xs" />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-700 mt-2">{unreadCount}</p>
          <p className="text-[10px] text-gray-400 mt-0.5">Needs your review</p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-500" />
        </div>

        <div
          onClick={() => setTodayOnly((v) => !v)}
          className={`bg-white border rounded-2xl p-4 transition-all cursor-pointer shadow-2xs hover:shadow-xs relative overflow-hidden ${
            todayOnly ? "border-slate-500 ring-2 ring-slate-500/10" : "border-gray-200/80"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Today</span>
            <div className="w-6 h-6 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
              <i className="ri-calendar-2-line text-xs" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-700 mt-2">{todayCount}</p>
          <p className="text-[10px] text-gray-400 mt-0.5">Received today</p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-500" />
        </div>

        <div
          onClick={() => setFilter(filter === "urgent" ? "all" : "urgent")}
          className={`bg-white border rounded-2xl p-4 transition-all cursor-pointer shadow-2xs hover:shadow-xs relative overflow-hidden ${
            filter === "urgent" ? "border-rose-500 ring-2 ring-rose-500/10" : "border-gray-200/80"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider">Needs Review</span>
            <div className="w-6 h-6 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <i className="ri-alert-line text-xs" />
            </div>
          </div>
          <p className="text-2xl font-black text-rose-700 mt-2">{urgentCount}</p>
          <p className="text-[10px] text-gray-400 mt-0.5">Warnings & errors</p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-rose-500" />
        </div>
      </div>

      {/* Filters & Controls Bar */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-3.5 shadow-2xs flex flex-col xl:flex-row xl:items-center justify-between gap-3.5 mb-6">
        <div className="relative w-full sm:w-72">
          <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search notifications..."
            className="w-full pl-8 pr-7 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:bg-white focus:outline-none focus:border-[#253C7D] font-medium"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <i className="ri-close-circle-fill text-xs" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex gap-1.5 flex-wrap">
            {[
              { key: "all", label: "All" },
              { key: "unread", label: "Unread" },
              { key: "info", label: "Info" },
              { key: "success", label: "Success" },
              { key: "warning", label: "Warnings" },
              { key: "error", label: "Errors" },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors whitespace-nowrap cursor-pointer ${
                  filter === f.key
                    ? "bg-[#253C7D] text-white"
                    : "bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 focus:outline-none focus:border-[#253C7D] cursor-pointer font-bold"
          >
            <option value="">All Sources</option>
            {sources.map((s) => (
              <option key={s} value={s}>
                {sourceLabels[s] || s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Notifications List */}
      {groups.length > 0 && (
        <div className="space-y-6">
          {groups.map((group) => (
            <div key={group.label}>
              <div className="flex items-center gap-2 mb-2.5 px-1">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  {group.label}
                </p>
                <span className="text-[10px] font-semibold text-gray-300">{group.items.length}</span>
              </div>
              <div className="space-y-2">
                {group.items.map((n) => {
                  const cfg = typeConfig[n.type] || typeConfig.info;
                  const navigable = isNavigable(n);
                  return (
                    <div
                      key={n.id}
                      onClick={() => openNotification(n)}
                      className={`group flex items-start gap-4 p-4 rounded-2xl border shadow-2xs transition-all relative overflow-hidden ${
                        navigable ? "cursor-pointer" : "cursor-default"
                      } ${
                        !n.is_read
                          ? "bg-white border-gray-200/80 hover:shadow-xs"
                          : "bg-white/60 border-gray-100 hover:bg-white hover:shadow-xs"
                      }`}
                    >
                      {!n.is_read && (
                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${cfg.accent}`} />
                      )}

                      <div
                        className={`w-10 h-10 rounded-full ${cfg.bg} flex items-center justify-center shrink-0`}
                      >
                        <i
                          className={`${cfg.icon} ${cfg.text} text-lg w-5 h-5 flex items-center justify-center`}
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p
                            className={`text-[13.5px] ${
                              !n.is_read ? "font-bold text-gray-900" : "font-semibold text-gray-500"
                            }`}
                          >
                            {n.title}
                          </p>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                            {sourceLabels[n.source] || n.source}
                          </span>
                        </div>
                        <p className={`text-[13px] mt-0.5 ${!n.is_read ? "text-gray-600" : "text-gray-400"}`}>
                          {n.message}
                        </p>
                        <p className="text-[11px] text-gray-400 mt-1.5 font-medium">
                          {relativeTime(n.created_at)}
                        </p>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {!n.is_read && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              markRead(n.id);
                            }}
                            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-[#253C7D] transition-colors cursor-pointer"
                            title="Mark as read"
                          >
                            <i className="ri-mail-open-line text-sm w-4 h-4 flex items-center justify-center" />
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(n.id);
                          }}
                          className="p-1.5 rounded-lg hover:bg-rose-50 text-gray-400 hover:text-rose-500 transition-colors cursor-pointer"
                          title="Delete"
                        >
                          <i className="ri-delete-bin-line text-sm w-4 h-4 flex items-center justify-center" />
                        </button>
                        {navigable && (
                          <i className="ri-arrow-right-s-line text-gray-300 group-hover:text-gray-400 text-base w-4 h-4 flex items-center justify-center transition-colors" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {groups.length === 0 && (
        <div className="text-center py-20 bg-white border border-gray-200/80 rounded-2xl shadow-2xs">
          <div className="w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-3">
            <i className="ri-notification-off-line text-2xl text-gray-300" />
          </div>
          <p className="text-sm font-bold text-gray-700">
            {filtersActive ? "No notifications match your filters" : "You're all caught up"}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {filtersActive
              ? "Try adjusting or clearing your filters."
              : "New activity across the workspace will show up here."}
          </p>
          {filtersActive && (
            <button
              onClick={resetFilters}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-600 text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              <i className="ri-filter-off-line text-sm" />
              Clear filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}
