import { memo } from "react";
import type { Notification, NotificationGroup } from "../types";
import { NotificationCard } from "./NotificationCard";

interface NotificationsGroupListProps {
  groups: NotificationGroup[];
  isNavigable: (n: Notification) => boolean;
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
  onOpenNotification: (n: Notification) => void;
  onMarkRead: (id: string) => void;
  onDeleteNotification: (id: string) => void;
}

export const NotificationsGroupList = memo(function NotificationsGroupList({
  groups,
  isNavigable,
  selectedIds,
  onToggleSelect,
  onOpenNotification,
  onMarkRead,
  onDeleteNotification,
}: NotificationsGroupListProps) {
  if (groups.length === 0) return null;

  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <div
          key={group.label}
          className="bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden"
        >
          {/* Section Group Header */}
          <div className="bg-slate-50/80 px-3.5 py-2 border-b border-slate-100 flex items-center justify-between">
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
              {group.label}
            </p>
            <span className="text-[10px] font-semibold text-slate-400 bg-slate-200/60 px-1.5 py-0.2 rounded-full">
              {group.items.length}
            </span>
          </div>

          {/* List of Notification Rows */}
          <div className="divide-y divide-slate-100">
            {group.items.map((n) => (
              <NotificationCard
                key={n.id}
                notification={n}
                isNavigable={isNavigable(n)}
                isSelected={selectedIds ? selectedIds.has(n.id) : false}
                onToggleSelect={onToggleSelect}
                onOpenNotification={onOpenNotification}
                onMarkRead={onMarkRead}
                onDeleteNotification={onDeleteNotification}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
});
