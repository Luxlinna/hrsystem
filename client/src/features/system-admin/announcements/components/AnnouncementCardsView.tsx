import { memo } from "react";
import type { Announcement } from "../types";
import { AnnouncementCard } from "./AnnouncementCard";

interface AnnouncementCardsViewProps {
  announcements: Announcement[];
  selectedId: string | null;
  canManage: boolean;
  mustAcceptUrgentAnnouncements: boolean;
  acceptedUrgentIds: Set<string>;
  timeAgo: (dateStr: string) => string;
  onOpen: (a: Announcement) => void;
  onTogglePin: (a: Announcement, e?: React.MouseEvent) => void;
  onCopyLink: (a: Announcement, e?: React.MouseEvent) => void;
}

export const AnnouncementCardsView = memo(function AnnouncementCardsView({
  announcements,
  selectedId,
  canManage,
  mustAcceptUrgentAnnouncements,
  acceptedUrgentIds,
  timeAgo,
  onOpen,
  onTogglePin,
  onCopyLink,
}: AnnouncementCardsViewProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {announcements.map((a) => {
        const isSelected = selectedId === a.id;
        const isUrgentUnaccepted =
          mustAcceptUrgentAnnouncements && a.priority === "urgent" && !acceptedUrgentIds.has(a.id);

        return (
          <AnnouncementCard
            key={a.id}
            announcement={a}
            isSelected={isSelected}
            canManage={canManage}
            isUrgentUnaccepted={isUrgentUnaccepted}
            timeAgo={timeAgo}
            onOpen={onOpen}
            onTogglePin={onTogglePin}
            onCopyLink={onCopyLink}
          />
        );
      })}
    </div>
  );
});
