import { memo } from "react";
import type { Notification } from "../types";
import { TYPE_CONFIG, SOURCE_LABELS } from "../constants";
import { relativeTime } from "../notificationUtils";

interface NotificationCardProps {
  notification: Notification;
  isNavigable: boolean;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
  onOpenNotification: (n: Notification) => void;
  onMarkRead: (id: string) => void;
  onDeleteNotification: (id: string) => void;
}

export const NotificationCard = memo(function NotificationCard({
  notification,
  isNavigable,
  isSelected = false,
  onToggleSelect,
  onOpenNotification,
  onMarkRead,
  onDeleteNotification,
}: NotificationCardProps) {
  const cfg = TYPE_CONFIG[notification.type] || TYPE_CONFIG.info;

  return (
    <div
      onClick={() => onOpenNotification(notification)}
      className={`group flex items-start gap-3.5 p-4 rounded-2xl border shadow-2xs transition-all relative overflow-hidden ${
        isNavigable ? "cursor-pointer" : "cursor-default"
      } ${
        isSelected
          ? "bg-blue-50/40 border-[#253C7D]/30 ring-1 ring-[#253C7D]/20 shadow-xs"
          : !notification.is_read
          ? "bg-white border-gray-200/80 hover:shadow-xs"
          : "bg-white/60 border-gray-100 hover:bg-white hover:shadow-xs"
      }`}
    >
      {/* Selection Checkbox */}
      {onToggleSelect && (
        <div
          className="shrink-0 pt-2.5 -ml-0.5"
          onClick={(e) => e.stopPropagation()}
        >
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggleSelect(notification.id)}
            className="w-4 h-4 rounded text-[#253C7D] border-gray-300 focus:ring-[#253C7D] cursor-pointer"
          />
        </div>
      )}

      {/* Unread Left Border Accent */}
      {!notification.is_read && (
        <div className={`absolute left-0 top-0 bottom-0 w-1 ${cfg.accent}`} />
      )}

      {/* Category Icon */}
      <div className={`w-10 h-10 rounded-full ${cfg.bg} flex items-center justify-center shrink-0`}>
        <i className={`${cfg.icon} ${cfg.text} text-lg w-5 h-5 flex items-center justify-center`} />
      </div>

      {/* Message Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p
            className={`text-[13.5px] ${
              !notification.is_read ? "font-bold text-gray-900" : "font-semibold text-gray-500"
            }`}
          >
            {notification.title}
          </p>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
            {SOURCE_LABELS[notification.source] || notification.source}
          </span>
        </div>
        <p className={`text-[13px] mt-0.5 ${!notification.is_read ? "text-gray-600" : "text-gray-400"}`}>
          {notification.message}
        </p>
        <p className="text-[11px] text-gray-400 mt-1.5 font-medium">
          {relativeTime(notification.created_at)}
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-1 shrink-0">
        {!notification.is_read && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMarkRead(notification.id);
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
            onDeleteNotification(notification.id);
          }}
          className="p-1.5 rounded-lg hover:bg-rose-50 text-gray-400 hover:text-rose-500 transition-colors cursor-pointer"
          title="Delete"
        >
          <i className="ri-delete-bin-line text-sm w-4 h-4 flex items-center justify-center" />
        </button>
        {isNavigable && (
          <i className="ri-arrow-right-s-line text-gray-300 group-hover:text-gray-400 text-base w-4 h-4 flex items-center justify-center transition-colors" />
        )}
      </div>
    </div>
  );
});
