import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "success" | "error";
  source: string;
  is_read: boolean;
  created_at: string;
}

const typeConfig: Record<string, { icon: string; bg: string; text: string; border: string }> = {
  success: {
    icon: "ri-checkbox-circle-line",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
  },
  warning: {
    icon: "ri-error-warning-line",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
  },
  error: {
    icon: "ri-close-circle-line",
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
  },
  info: {
    icon: "ri-information-line",
    bg: "bg-sky-50",
    text: "text-sky-700",
    border: "border-sky-200",
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
  tools: "Tools",
};

export default function Notifications() {
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [filter, setFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [realtimeEnabled, setRealtimeEnabled] = useState(true);

  useEffect(() => {
    loadNotifications();

    const channel = supabase
      .channel("notifications_changes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        (payload) => {
          const newNotif = payload.new as Notification;
          setNotifs((prev) => [newNotif, ...prev]);
          setUnreadCount((c) => c + 1);
          toast(newNotif.title, newNotif.message, newNotif.type);
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "notifications" },
        (payload) => {
          const updated = payload.new as Notification;
          setNotifs((prev) =>
            prev.map((n) => (n.id === updated.id ? updated : n))
          );
          setUnreadCount((c) => {
            const old = payload.old as Notification;
            if (!old.is_read && updated.is_read) return Math.max(0, c - 1);
            if (old.is_read && !updated.is_read) return c + 1;
            return c;
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "notifications" },
        (payload) => {
          const deleted = payload.old as Notification;
          setNotifs((prev) => prev.filter((n) => n.id !== deleted.id));
          if (!deleted.is_read) {
            setUnreadCount((c) => Math.max(0, c - 1));
          }
        }
      )
      .subscribe((status) => {
        setRealtimeEnabled(status === "SUBSCRIBED");
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadNotifications = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false });
    const list = (data || []) as Notification[];
    setNotifs(list);
    setUnreadCount(list.filter((n) => !n.is_read).length);
    setLoading(false);
  };

  const filtered = notifs.filter((n) => {
    const typeMatch =
      filter === "all" || (filter === "unread" ? !n.is_read : n.type === filter);
    const sourceMatch = !sourceFilter || n.source === sourceFilter;
    return typeMatch && sourceMatch;
  });

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
    setUnreadCount((c) => Math.max(0, c - 1));
  };

  const markAllRead = async () => {
    const unreadIds = notifs.filter((n) => !n.is_read).map((n) => n.id);
    if (unreadIds.length === 0) return;
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .in("id", unreadIds);
    if (error) {
      toast("Error", error.message, "error");
      return;
    }
    setNotifs((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
    toast("All read", "All notifications have been marked as read.", "success");
  };

  const deleteNotification = async (id: string) => {
    const { error } = await supabase.from("notifications").delete().eq("id", id);
    if (error) {
      toast("Error", error.message, "error");
      return;
    }
    setNotifs((prev) => prev.filter((n) => n.id !== id));
    const wasUnread = notifs.find((n) => n.id === id)?.is_read === false;
    if (wasUnread) setUnreadCount((c) => Math.max(0, c - 1));
  };

  const sources = Array.from(new Set(notifs.map((n) => n.source))).sort();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-10 h-10 border-2 border-[#0D7377] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-10 min-h-screen bg-white">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-bold text-[#1A1A1A]">
              Notifications
            </h1>
            {realtimeEnabled && (
              <span className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live
              </span>
            )}
          </div>
          <p className="text-[13px] text-gray-500 mt-1">
            {unreadCount > 0
              ? `${unreadCount} unread`
              : "No unread"}{" "}
            of {notifs.length} total notifications
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={markAllRead}
            disabled={unreadCount === 0}
            className="px-4 py-2 text-[12px] font-semibold text-[#0D7377] border border-[#0D7377]/20 rounded-lg hover:bg-[#0D7377]/5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
          >
            Mark All Read
          </button>
          <button
            onClick={loadNotifications}
            className="p-2 text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <i className="ri-refresh-line w-5 h-5 flex items-center justify-center" />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex gap-2 flex-wrap">
          {[
            { key: "all", label: "All" },
            {
              key: "unread",
              label: `Unread ${unreadCount > 0 ? `(${unreadCount})` : ""}`,
            },
            { key: "info", label: "Info" },
            { key: "success", label: "Success" },
            { key: "warning", label: "Warnings" },
            { key: "error", label: "Errors" },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 rounded-full text-[11px] font-medium transition-colors whitespace-nowrap ${
                filter === f.key
                  ? "bg-[#0D7377] text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <select
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
          className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-[12px] text-gray-700 focus:outline-none focus:border-[#0D7377]"
        >
          <option value="">All Sources</option>
          {sources.map((s) => (
            <option key={s} value={s}>
              {sourceLabels[s] || s}
            </option>
          ))}
        </select>
      </div>

      {/* Notifications List */}
      <div className="space-y-2">
        {filtered.map((n) => {
          const cfg = typeConfig[n.type] || typeConfig.info;
          return (
            <div
              key={n.id}
              onClick={() => {
                if (!n.is_read) markRead(n.id);
              }}
              className={`flex items-start gap-4 p-4 rounded-xl border transition-all cursor-pointer ${
                !n.is_read
                  ? "bg-[#0D7377]/[0.03] border-[#0D7377]/10"
                  : "bg-white border-gray-100 hover:bg-gray-50/50"
              }`}
            >
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
                    className={`text-[14px] font-semibold ${
                      !n.is_read ? "text-gray-900" : "text-gray-600"
                    }`}
                  >
                    {n.title}
                  </p>
                  {!n.is_read && (
                    <span className="w-2 h-2 rounded-full bg-[#0D7377]" />
                  )}
                  <span
                    className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${cfg.border} ${cfg.text} ${cfg.bg}`}
                  >
                    {sourceLabels[n.source] || n.source}
                  </span>
                </div>
                <p className="text-[13px] text-gray-500 mt-0.5">{n.message}</p>
                <p className="text-[11px] text-gray-400 mt-1.5">
                  {new Date(n.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {!n.is_read && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      markRead(n.id);
                    }}
                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-[#0D7377] transition-colors"
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
                  className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                  title="Delete"
                >
                  <i className="ri-delete-bin-line text-sm w-4 h-4 flex items-center justify-center" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="text-center py-16">
          <i className="ri-notification-off-line text-4xl text-gray-300 mb-3 block" />
          <p className="text-[14px] text-gray-500">
            {filter === "unread"
              ? "No unread notifications"
              : "No notifications found"}
          </p>
        </div>
      )}
    </div>
  );
}