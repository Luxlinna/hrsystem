import { memo } from "react";
import type { Announcement } from "../types";
import { CATEGORY_CONFIG, PRIORITY_CONFIG } from "../constants";

interface AnnouncementCardProps {
  announcement: Announcement;
  isSelected: boolean;
  canManage: boolean;
  isUrgentUnaccepted: boolean;
  timeAgo: (dateStr: string) => string;
  onOpen: (a: Announcement) => void;
  onTogglePin: (a: Announcement, e?: React.MouseEvent) => void;
  onCopyLink: (a: Announcement, e?: React.MouseEvent) => void;
}

export const AnnouncementCard = memo(function AnnouncementCard({
  announcement: a,
  isSelected,
  canManage,
  isUrgentUnaccepted,
  timeAgo,
  onOpen,
  onTogglePin,
  onCopyLink,
}: AnnouncementCardProps) {
  const cat = CATEGORY_CONFIG[a.category] || CATEGORY_CONFIG.general;
  const pri = PRIORITY_CONFIG[a.priority] || PRIORITY_CONFIG.normal;

  return (
    <div
      onClick={() => onOpen(a)}
      className={`bg-white rounded-3xl border p-5 shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group relative overflow-hidden ${
        a.priority === "urgent"
          ? "border-rose-200/90 hover:border-rose-300"
          : "border-gray-200/80 hover:border-gray-300"
      } ${isSelected ? "border-[#253C7D] ring-2 ring-[#253C7D]/10" : ""}`}
    >
      {/* Urgent alert left highlight stripe */}
      {a.priority === "urgent" && <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-rose-500" />}

      <div>
        {/* Top Bar: Icon + Category & Priority Badges + Quick Pin */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold border shrink-0 ${cat.bg} ${cat.color}`}>
              <i className={cat.icon} />
            </div>
            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${cat.bg} ${cat.color}`}>
              {cat.label}
            </span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full border flex items-center gap-1 ${pri.badge}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${pri.dot}`} />
              {pri.label}
            </span>
          </div>

          <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
            {canManage && (
              <button
                type="button"
                onClick={(e) => onTogglePin(a, e)}
                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                  a.pinned
                    ? "bg-amber-100 text-amber-700 font-bold"
                    : "text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                }`}
                title={a.pinned ? "Unpin from top" : "Pin to top"}
              >
                <i className="ri-pushpin-line text-xs" />
              </button>
            )}

            <button
              type="button"
              onClick={(e) => onCopyLink(a, e)}
              className="w-7 h-7 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 flex items-center justify-center transition-colors"
              title="Copy direct link"
            >
              <i className="ri-share-forward-line text-xs" />
            </button>
          </div>
        </div>

        {/* Title & Preview Content */}
        <h3 className="font-extrabold text-gray-900 group-hover:text-[#253C7D] transition-colors text-sm sm:text-[15px] leading-snug line-clamp-2 mb-2">
          {a.pinned && <i className="ri-pushpin-fill text-amber-500 text-xs mr-1.5 inline-block" />}
          {a.title}
        </h3>

        <p className="text-xs text-gray-500 leading-relaxed line-clamp-3 mb-3">
          {a.content}
        </p>

        {/* Urgent Attention Badge */}
        {isUrgentUnaccepted && (
          <div className="mb-3 p-2 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 text-[11px] font-bold">
            <i className="ri-error-warning-line text-xs shrink-0" />
            <span className="truncate">Requires your acknowledgment</span>
          </div>
        )}
      </div>

      {/* Footer Info: Author Avatar, Views, Audience, Time */}
      <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded-full bg-[#253C7D]/10 text-[#253C7D] flex items-center justify-center text-[10px] font-extrabold shrink-0">
            {a.author_name ? a.author_name.charAt(0).toUpperCase() : "HR"}
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-gray-700 truncate">{a.author_name}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 text-[11px] text-gray-400 font-medium">
          <span className="flex items-center gap-0.5">
            <i className="ri-eye-line text-xs" />
            {a.view_count || 0}
          </span>
          <span>·</span>
          <span>{timeAgo(a.published_at)}</span>
        </div>
      </div>
    </div>
  );
});
