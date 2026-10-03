import { memo, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useClickOutside } from "./useClickOutside";
import type { NotificationRow } from "./types";
import { stripEmojis } from "@/features/system-admin/notifications/notificationUtils";

interface NotificationDropdownProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  previewNotifs: NotificationRow[];
  unreadCount: number;
  onOpen: (n: NotificationRow) => void;
}

const TYPE_DOT: Record<NotificationRow["type"], string> = {
  info:    "bg-sky-400",
  success: "bg-emerald-400",
  warning: "bg-amber-400",
  error:   "bg-red-400",
};

/**
 * Notification bell + dropdown panel.
 *
 * React.memo'd — only re-renders when previewNotifs, unreadCount, or open changes.
 */
const NotificationDropdown = memo(function NotificationDropdown({
  open,
  onOpenChange,
  previewNotifs,
  unreadCount,
  onOpen,
}: NotificationDropdownProps) {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  useClickOutside([containerRef], () => onOpenChange(false));

  const handleButtonClick = () => {
    // On mobile screens (< 768px), navigate directly to the full notification screen
    if (window.innerWidth < 768) {
      navigate("/notifications");
      onOpenChange(false);
    } else {
      onOpenChange(!open);
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        id="topbar-notif-btn"
        onClick={handleButtonClick}
        className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors relative cursor-pointer text-gray-700 dark:text-slate-200"
        aria-label="Notifications"
        aria-expanded={open}
      >
        <i className="ri-notification-3-line text-lg" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center ring-2 ring-white dark:ring-slate-900 shadow-2xs">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-800 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-100">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-[13px] font-bold text-gray-900 dark:text-white">Notifications</span>
            <Link
              to="/notifications"
              className="text-[11px] text-[#253C7D] dark:text-sky-400 font-semibold hover:underline"
              onClick={() => onOpenChange(false)}
            >
              View All
            </Link>
          </div>

          {/* Notification list */}
          <div className="max-h-72 overflow-y-auto divide-y divide-gray-50 dark:divide-slate-800/60">
            {previewNotifs.length === 0 ? (
              <p className="px-4 py-6 text-center text-[12px] text-gray-400 dark:text-slate-500">You&apos;re all caught up</p>
            ) : (
              previewNotifs.map((n) => (
                <button
                  key={n.id}
                  onClick={() => onOpen(n)}
                  className={`w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-800/80 transition-colors cursor-pointer ${
                    !n.is_read ? "bg-[#253C7D]/5 dark:bg-sky-950/30" : ""
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${TYPE_DOT[n.type] ?? "bg-gray-300 dark:bg-slate-600"}`} />
                    <div className="min-w-0 flex-1">
                      <p className={`text-[12px] ${!n.is_read ? "font-bold text-gray-900 dark:text-white" : "font-medium text-gray-700 dark:text-slate-200"}`}>
                        {stripEmojis(n.title)}
                      </p>
                      <p className="text-[11px] text-gray-500 dark:text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
                        {stripEmojis(n.message)}
                      </p>
                      <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-1 font-medium">
                        {new Date(n.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
});

export default NotificationDropdown;
