import { memo } from "react";
import type { Notification } from "../types";
import { TYPE_CONFIG, SOURCE_LABELS, getCanonicalEventBadge } from "../constants";
import { relativeTime, stripEmojis } from "../notificationUtils";

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
  const canonicalBadge = getCanonicalEventBadge(notification.title, notification.message);
  const cleanTitle = stripEmojis(notification.title);
  const cleanMessage = stripEmojis(notification.message);

  return (
    <div
      onClick={() => onOpenNotification(notification)}
      className={`group flex items-start gap-2.5 sm:gap-3 p-3 sm:p-3.5 transition-colors relative ${
        isNavigable ? "cursor-pointer" : "cursor-default"
      } ${
        isSelected
          ? "bg-blue-50/60"
          : !notification.is_read
          ? "bg-blue-50/15 hover:bg-blue-50/30"
          : "bg-white hover:bg-slate-50/70"
      }`}
    >
      {/* Checkbox & Unread Dot */}
      <div className="flex items-center gap-2 shrink-0 pt-0.5" onClick={(e) => e.stopPropagation()}>
        {onToggleSelect && (
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggleSelect(notification.id)}
            className="w-3.5 h-3.5 rounded text-[#253C7D] border-slate-300 focus:ring-[#253C7D] cursor-pointer"
          />
        )}
        <div className="w-1.5 h-1.5 flex items-center justify-center">
          {!notification.is_read && (
            <span className="w-1.5 h-1.5 rounded-full bg-[#253C7D]" title="Unread" />
          )}
        </div>
      </div>

      {/* Category Icon */}
      <div className={`w-7 h-7 rounded-lg ${cfg.bg} flex items-center justify-center shrink-0 mt-0.5`}>
        <i className={`${cfg.icon} ${cfg.text} text-xs`} />
      </div>

      {/* Notification Text Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <p
            className={`text-xs ${
              !notification.is_read ? "font-semibold text-slate-900" : "font-medium text-slate-700"
            }`}
          >
            {cleanTitle}
          </p>
          {canonicalBadge && (
            <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded border flex items-center gap-1 ${canonicalBadge.color}`}>
              <i className={`${canonicalBadge.icon} text-[10px]`} />
              <span>{canonicalBadge.label}</span>
            </span>
          )}
          <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200/60">
            {SOURCE_LABELS[notification.source] || notification.source}
          </span>
        </div>

        <p className={`text-xs mt-1 leading-relaxed ${!notification.is_read ? "text-slate-600" : "text-slate-400"}`}>
          {cleanMessage}
        </p>

        <p className="text-[10px] text-slate-400 mt-1 font-medium">
          {relativeTime(notification.created_at)}
        </p>
      </div>

      {/* Row Inline Actions */}
      <div className="flex items-center gap-1 shrink-0 pt-0.5" onClick={(e) => e.stopPropagation()}>
        {!notification.is_read && (
          <button
            onClick={() => onMarkRead(notification.id)}
            className="p-1 rounded text-slate-400 hover:text-[#253C7D] hover:bg-slate-100 transition-colors cursor-pointer"
            title="Mark as read"
          >
            <i className="ri-mail-open-line text-xs" />
          </button>
        )}
        <button
          onClick={() => onDeleteNotification(notification.id)}
          className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
          title="Delete"
        >
          <i className="ri-delete-bin-line text-xs" />
        </button>
        {isNavigable && (
          <i className="ri-arrow-right-s-line text-slate-300 group-hover:text-slate-500 text-sm transition-colors" />
        )}
      </div>
    </div>
  );
});
