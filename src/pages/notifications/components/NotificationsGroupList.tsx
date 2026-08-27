import { memo } from "react";
import type { Notification, NotificationGroup } from "../types";
import { NotificationCard } from "./NotificationCard";

interface NotificationsGroupListProps {
  groups: NotificationGroup[];
  isNavigable: (n: Notification) => boolean;
  onOpenNotification: (n: Notification) => void;
  onMarkRead: (id: string) => void;
  onDeleteNotification: (id: string) => void;
}

export const NotificationsGroupList = memo(function NotificationsGroupList({
  groups,
  isNavigable,
  onOpenNotification,
  onMarkRead,
  onDeleteNotification,
}: NotificationsGroupListProps) {
  if (groups.length === 0) return null;

  return (
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
            {group.items.map((n) => (
              <NotificationCard
                key={n.id}
                notification={n}
                isNavigable={isNavigable(n)}
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
