import { memo } from "react";
import type { Announcement } from "../types";

interface MobileAnnouncementItemProps {
  announcement: Announcement;
  canManage: boolean;
  isMenuOpen: boolean;
  timeAgo: (dateStr: string) => string;
  onOpen: (a: Announcement) => void;
  onToggleMenu: (id: string, e: React.MouseEvent) => void;
  onOpenEditModal: (a: Announcement) => void;
  onTogglePin: (a: Announcement, e?: React.MouseEvent) => void;
  onCopyLink: (a: Announcement, e?: React.MouseEvent) => void;
  onDelete: (a: Announcement, e?: React.MouseEvent) => void;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>?/gm, "").trim();
}

function getCategoryIconStyle(category: string, priority: string, title: string) {
  const c = `${category} ${priority} ${title}`.toLowerCase();
  if (priority === "urgent" || c.includes("urgent") || c.includes("alert")) {
    return { icon: "ri-megaphone-line", color: "text-orange-500", bg: "bg-orange-50" };
  }
  if (c.includes("update") || c.includes("release") || category === "system") {
    return { icon: "ri-restart-line", color: "text-emerald-500", bg: "bg-emerald-50" };
  }
  if (category === "policy" || c.includes("policy")) {
    return { icon: "ri-shield-check-line", color: "text-[#253C7D]", bg: "bg-blue-50" };
  }
  if (category === "event" || c.includes("event") || c.includes("holiday")) {
    return { icon: "ri-calendar-event-line", color: "text-purple-600", bg: "bg-purple-50" };
  }
  return { icon: "ri-megaphone-line", color: "text-orange-500", bg: "bg-orange-50" };
}

export const MobileAnnouncementItem = memo(function MobileAnnouncementItem({
  announcement: a,
  canManage,
  isMenuOpen,
  timeAgo,
  onOpen,
  onToggleMenu,
  onOpenEditModal,
  onTogglePin,
  onCopyLink,
  onDelete,
}: MobileAnnouncementItemProps) {
  const style = getCategoryIconStyle(a.category, a.priority, a.title);

  return (
    <div
      className={`py-4 flex items-start gap-3.5 relative transition-colors ${
        a.pinned ? "bg-amber-50/20 -mx-4 px-4 rounded-xl" : ""
      }`}
    >
      <div className={`w-10 h-10 rounded-full ${style.bg} ${style.color} flex items-center justify-center text-lg shrink-0 mt-0.5`}>
        <i className={style.icon} />
      </div>

      <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onOpen(a)}>
        <div className="flex items-center gap-1.5 flex-wrap">
          {a.pinned && <i className="ri-pushpin-fill text-amber-500 text-xs shrink-0" title="Pinned" />}
          <h2 className="text-[14px] font-bold text-slate-900 leading-tight">{a.title}</h2>
        </div>
        <p className="text-[12.5px] text-slate-500 leading-relaxed mt-1 line-clamp-2">{stripHtml(a.content || "")}</p>
        <p className="text-[11px] text-slate-400 mt-1.5 font-medium">{timeAgo(a.published_at || a.created_at)}</p>
      </div>

      <div className="relative shrink-0 pt-0.5">
        <button
          type="button"
          onClick={(e) => onToggleMenu(a.id, e)}
          className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          aria-label="More options"
        >
          <i className="ri-more-2-fill text-lg" />
        </button>

        {isMenuOpen && (
          <div className="absolute right-0 top-8 z-40 w-38 bg-white rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.12)] border border-slate-100 py-1 text-left animate-in fade-in zoom-in-95 duration-100">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onOpen(a); }}
              className="w-full px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer transition-colors"
            >
              <i className="ri-eye-line text-slate-400" />
              <span>View Details</span>
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onCopyLink(a); }}
              className="w-full px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer transition-colors"
            >
              <i className="ri-share-forward-line text-slate-400" />
              <span>Copy Link</span>
            </button>
            {canManage && (
              <>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onTogglePin(a, e); }}
                  className="w-full px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer transition-colors border-t border-slate-50"
                >
                  <i className="ri-pushpin-line text-slate-400" />
                  <span>{a.pinned ? "Unpin" : "Pin to top"}</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onOpenEditModal(a); }}
                  className="w-full px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <i className="ri-edit-line text-slate-400" />
                  <span>Edit</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onDelete(a, e); }}
                  className="w-full px-3.5 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer transition-colors border-t border-slate-50"
                >
                  <i className="ri-delete-bin-line text-rose-400" />
                  <span>Delete</span>
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
});
