import { memo, useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import type { Notification } from "../types";
import { relativeTime, stripEmojis } from "../notificationUtils";

interface MobileNotificationsViewProps {
  notifications: Notification[];
  unreadCount: number;
  onRefresh: () => void;
  onMarkAllRead: () => void;
  onMarkRead: (id: string) => void;
  onDeleteNotification: (id: string) => void;
  onOpenNotification: (n: Notification) => void;
}

// Map notification category to human icon & vibrant badge style matching mockup
function getCategoryIconConfig(title: string, message: string, source: string, type: string) {
  const combined = `${title} ${message} ${source}`.toLowerCase();

  if (combined.includes("update") || combined.includes("version") || combined.includes("release") || source === "system") {
    return {
      icon: "ri-restart-line",
      color: "text-emerald-500",
      bg: "bg-emerald-50",
      border: "border-emerald-200",
    };
  }

  if (combined.includes("offer") || combined.includes("announcement") || combined.includes("upgrade") || source === "announcements" || source === "broadcast") {
    return {
      icon: "ri-megaphone-line",
      color: "text-orange-500",
      bg: "bg-orange-50",
      border: "border-orange-200",
    };
  }

  if (combined.includes("leave") || source === "leave" || combined.includes("holiday") || combined.includes("vacation")) {
    return {
      icon: "ri-calendar-event-line",
      color: "text-[#253C7D]",
      bg: "bg-blue-50",
      border: "border-blue-200",
    };
  }

  if (combined.includes("task") || combined.includes("report") || combined.includes("assignment") || source === "tasks") {
    return {
      icon: "ri-task-line",
      color: "text-indigo-600",
      bg: "bg-indigo-50",
      border: "border-indigo-200",
    };
  }

  if (type === "warning" || combined.includes("warning") || combined.includes("urgent")) {
    return {
      icon: "ri-error-warning-line",
      color: "text-amber-600",
      bg: "bg-amber-50",
      border: "border-amber-200",
    };
  }

  if (type === "error") {
    return {
      icon: "ri-close-circle-line",
      color: "text-rose-600",
      bg: "bg-rose-50",
      border: "border-rose-200",
    };
  }

  return {
    icon: "ri-notification-3-line",
    color: "text-[#253C7D]",
    bg: "bg-[#EEF3FA]",
    border: "border-blue-100",
  };
}

export const MobileNotificationsView = memo(function MobileNotificationsView({
  notifications,
  unreadCount,
  onRefresh,
  onMarkAllRead,
  onMarkRead,
  onDeleteNotification,
  onOpenNotification,
}: MobileNotificationsViewProps) {
  const navigate = useNavigate();
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close popup menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenuId(null);
      }
    }
    if (activeMenuId) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [activeMenuId]);

  return (
    <div className="min-h-screen bg-white text-slate-800 pb-24 font-sans selection:bg-blue-100">
      {/* ── Top Bar matching Mockup ── */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-100 px-4 py-3.5 flex items-center justify-between">
        {/* Back Button */}
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-full flex items-center justify-center text-slate-700 hover:bg-slate-100 active:scale-95 transition-all cursor-pointer -ml-1"
          aria-label="Go back"
        >
          <i className="ri-arrow-left-line text-xl" />
        </button>

        {/* Center Title */}
        <h1 className="text-sm font-bold tracking-widest text-slate-900 uppercase">
          NOTIFICATIONS
        </h1>

        {/* Right Action (Mark All Read or Refresh) */}
        <div className="flex items-center gap-1">
          {unreadCount > 0 ? (
            <button
              type="button"
              onClick={onMarkAllRead}
              className="text-xs font-semibold text-[#253C7D] hover:underline px-2 py-1 cursor-pointer"
              title="Mark all as read"
            >
              Read All
            </button>
          ) : (
            <button
              type="button"
              onClick={onRefresh}
              className="w-9 h-9 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Refresh"
            >
              <i className="ri-refresh-line text-lg" />
            </button>
          )}
        </div>
      </header>

      {/* ── Notifications List ── */}
      <div className="px-4 py-3 divide-y divide-slate-100">
        {notifications.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center justify-center">
            <div className="w-14 h-14 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 text-2xl mb-3">
              <i className="ri-notification-off-line" />
            </div>
            <p className="text-sm font-semibold text-slate-700">No notifications</p>
            <p className="text-xs text-slate-400 mt-1">You're all caught up!</p>
          </div>
        ) : (
          notifications.map((n) => {
            const cleanTitle = stripEmojis(n.title);
            const cleanMessage = stripEmojis(n.message);
            const style = getCategoryIconConfig(n.title, n.message, n.source, n.type);
            const isMenuOpen = activeMenuId === n.id;

            return (
              <div
                key={n.id}
                className={`py-4 flex items-start gap-3.5 relative transition-colors ${
                  !n.is_read ? "bg-blue-50/20 -mx-4 px-4 rounded-xl" : ""
                }`}
              >
                {/* Left Category Icon */}
                <div
                  className={`w-10 h-10 rounded-full ${style.bg} ${style.color} flex items-center justify-center text-lg shrink-0 mt-0.5`}
                >
                  <i className={style.icon} />
                </div>

                {/* Middle Text Info */}
                <div
                  className="flex-1 min-w-0 cursor-pointer"
                  onClick={() => onOpenNotification(n)}
                >
                  <div className="flex items-center gap-2">
                    <h2 className={`text-[14px] leading-tight ${!n.is_read ? "font-bold text-slate-900" : "font-semibold text-slate-800"}`}>
                      {cleanTitle}
                    </h2>
                    {!n.is_read && (
                      <span className="w-2 h-2 rounded-full bg-[#253C7D] shrink-0" />
                    )}
                  </div>

                  <p className="text-[12.5px] text-slate-500 leading-relaxed mt-1">
                    {cleanMessage}
                  </p>

                  <p className="text-[11px] text-slate-400 mt-1.5 font-medium">
                    {relativeTime(n.created_at)}
                  </p>
                </div>

                {/* Right 3-Dots Action Button & Floating Menu */}
                <div className="relative shrink-0 pt-0.5">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveMenuId(isMenuOpen ? null : n.id);
                    }}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                    aria-label="More options"
                  >
                    <i className="ri-more-2-fill text-lg" />
                  </button>

                  {/* Floating Action Menu matching Mockup */}
                  {isMenuOpen && (
                    <div
                      ref={menuRef}
                      className="absolute right-0 top-8 z-40 w-36 bg-white rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.12)] border border-slate-100 py-1 text-left animate-in fade-in zoom-in-95 duration-100"
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onMarkRead(n.id);
                          setActiveMenuId(null);
                        }}
                        className="w-full px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer transition-colors"
                      >
                        <i className="ri-check-line text-slate-400" />
                        <span>{n.is_read ? "Mark unread" : "Mark as read"}</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteNotification(n.id);
                          setActiveMenuId(null);
                        }}
                        className="w-full px-3.5 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer transition-colors border-t border-slate-50"
                      >
                        <i className="ri-delete-bin-line text-rose-400" />
                        <span>Delete</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
});
