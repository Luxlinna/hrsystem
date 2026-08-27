import { memo, useRef } from "react";
import { Link } from "react-router-dom";
import { useClickOutside } from "./useClickOutside";
import type { NotificationRow } from "./types";

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
  const containerRef = useRef<HTMLDivElement>(null);
  useClickOutside([containerRef], () => onOpenChange(false));

  return (
    <div className="relative" ref={containerRef}>
      <button
        id="topbar-notif-btn"
        onClick={() => onOpenChange(!open)}
        className="p-2 rounded-full hover:bg-black/5 transition-colors relative cursor-pointer text-gray-700"
        aria-label="Notifications"
        aria-expanded={open}
      >
        <i className="ri-notification-3-line text-lg" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <span className="text-[13px] font-semibold text-gray-900">Notifications</span>
            <Link
              to="/notifications"
              className="text-[11px] text-[#253C7D] font-medium hover:underline"
              onClick={() => onOpenChange(false)}
            >
              View All
            </Link>
          </div>

          {/* Notification list */}
          <div className="max-h-72 overflow-y-auto">
            {previewNotifs.length === 0 ? (
              <p className="px-4 py-6 text-center text-[12px] text-gray-400">You&apos;re all caught up</p>
            ) : (
              previewNotifs.map((n) => (
                <button
                  key={n.id}
                  onClick={() => onOpen(n)}
                  className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 cursor-pointer ${
                    !n.is_read ? "bg-[#253C7D]/5" : ""
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <span className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${TYPE_DOT[n.type] ?? "bg-gray-300"}`} />
                    <div className="min-w-0">
                      <p className="text-[12px] font-semibold text-gray-900">{n.title}</p>
                      <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                      <p className="text-[10px] text-gray-400 mt-1">
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
