import { memo } from "react";
import { Link } from "react-router-dom";
import type { AnnouncementItem } from "../types";

interface AnnouncementsSectionProps {
  announcements: AnnouncementItem[];
  canAnnouncements: boolean;
}

export const AnnouncementsSection = memo(function AnnouncementsSection({
  announcements,
  canAnnouncements,
}: AnnouncementsSectionProps) {
  if (!canAnnouncements) return null;

  const catColors: Record<string, string> = {
    event: "text-violet-600 bg-violet-50",
    policy: "text-amber-600 bg-amber-50",
    news: "text-emerald-600 bg-emerald-50",
    benefits: "text-sky-600 bg-sky-50",
    compliance: "text-rose-600 bg-rose-50",
    hr: "text-[#253C7D] bg-[#253C7D]/10",
    general: "text-gray-600 bg-gray-100",
  };

  const catIcons: Record<string, string> = {
    event: "ri-calendar-event-line",
    policy: "ri-file-text-line",
    news: "ri-newspaper-line",
    benefits: "ri-heart-pulse-line",
    compliance: "ri-shield-check-line",
    hr: "ri-user-settings-line",
    general: "ri-information-line",
  };

  return (
    <div className="bg-white border border-gray-200/80 rounded-2xl shadow-2xs p-5 sm:p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold text-gray-900">Latest Announcements</h2>
        <Link to="/announcements" className="text-[11px] text-[#253C7D] font-bold hover:underline">
          View All
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {announcements.slice(0, 4).map((a) => {
          const colClass = catColors[a.category] || catColors.general;
          const iconClass = catIcons[a.category] || catIcons.general;
          const daysAgo = Math.floor((Date.now() - new Date(a.published_at).getTime()) / 86400000);

          return (
            <Link
              to="/announcements"
              key={a.id}
              className="flex gap-3 p-3.5 border border-gray-100 rounded-xl hover:border-[#253C7D]/20 hover:bg-gray-50/50 transition-all"
            >
              <div className={`w-9 h-9 shrink-0 flex items-center justify-center rounded-lg ${colClass}`}>
                <i className={`${iconClass} text-sm`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[13px] font-semibold text-gray-900 leading-tight line-clamp-1">
                    {a.title}
                  </p>
                  {a.pinned && <i className="ri-pushpin-line text-[#253C7D] text-xs shrink-0 mt-0.5" />}
                </div>
                <p className="text-[12px] text-gray-500 mt-1 line-clamp-2 leading-relaxed">{a.content}</p>
                <p className="text-[11px] text-gray-400 mt-2">
                  {daysAgo === 0 ? "Today" : `${daysAgo}d ago`} &middot; {a.author_name || "Admin"}
                </p>
              </div>
            </Link>
          );
        })}

        {announcements.length === 0 && (
          <div className="col-span-2 text-center py-8 border border-dashed border-gray-200 rounded-xl">
            <p className="text-[13px] text-gray-400">No announcements yet</p>
          </div>
        )}
      </div>
    </div>
  );
});
