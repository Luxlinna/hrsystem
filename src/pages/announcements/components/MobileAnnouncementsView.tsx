import { memo, useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import type { Announcement } from "../types";

interface MobileAnnouncementsViewProps {
  announcements: Announcement[];
  canManage: boolean;
  timeAgo: (dateStr: string) => string;
  onOpen: (a: Announcement) => void;
  onOpenCreateModal: () => void;
  onOpenEditModal: (a: Announcement) => void;
  onTogglePin: (a: Announcement, e?: React.MouseEvent) => void;
  onCopyLink: (a: Announcement, e?: React.MouseEvent) => void;
  onDelete: (a: Announcement, e?: React.MouseEvent) => void;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>?/gm, "").trim();
}

// Map announcement category/priority to human-crafted circular icon styles matching mockup
function getCategoryIconStyle(category: string, priority: string, title: string) {
  const combined = `${category} ${priority} ${title}`.toLowerCase();

  if (priority === "urgent" || combined.includes("urgent") || combined.includes("critical") || combined.includes("alert")) {
    return {
      icon: "ri-megaphone-line",
      color: "text-orange-500",
      bg: "bg-orange-50",
    };
  }

  if (combined.includes("update") || combined.includes("release") || combined.includes("system") || category === "system") {
    return {
      icon: "ri-restart-line",
      color: "text-emerald-500",
      bg: "bg-emerald-50",
    };
  }

  if (category === "policy" || category === "policies" || combined.includes("policy") || combined.includes("rule")) {
    return {
      icon: "ri-shield-check-line",
      color: "text-[#253C7D]",
      bg: "bg-blue-50",
    };
  }

  if (category === "event" || category === "celebration" || combined.includes("event") || combined.includes("holiday")) {
    return {
      icon: "ri-calendar-event-line",
      color: "text-purple-600",
      bg: "bg-purple-50",
    };
  }

  return {
    icon: "ri-megaphone-line",
    color: "text-orange-500",
    bg: "bg-orange-50",
  };
}

export const MobileAnnouncementsView = memo(function MobileAnnouncementsView({
  announcements,
  canManage,
  timeAgo,
  onOpen,
  onOpenCreateModal,
  onOpenEditModal,
  onTogglePin,
  onCopyLink,
  onDelete,
}: MobileAnnouncementsViewProps) {
  const navigate = useNavigate();
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close popup menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenuId(null);
      }
    }
    if (activeMenuId) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [activeMenuId]);

  return (
    <div className="min-h-screen bg-white text-slate-800 pb-24 font-sans selection:bg-blue-100">
      {/* ── Top Bar matching Mockup ── */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-100 px-4 py-3.5 flex items-center justify-between">
        {/* Back Button */}
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-full flex items-center justify-center text-slate-700 hover:bg-slate-100 active:scale-95 transition-all cursor-pointer -ml-1"
          aria-label="Go back"
        >
          <i className="ri-arrow-left-line text-xl" />
        </button>

        {/* Center Title */}
        <h1 className="text-sm font-bold tracking-widest text-slate-900 uppercase">
          ANNOUNCEMENTS
        </h1>

        {/* Right Action: Create or Placeholder */}
        <div className="flex items-center gap-1">
          {canManage ? (
            <button
              type="button"
              onClick={onOpenCreateModal}
              className="w-8 h-8 rounded-full bg-[#253C7D] text-white flex items-center justify-center hover:bg-[#1C2E60] active:scale-95 transition-all shadow-xs cursor-pointer"
              title="Post Announcement"
            >
              <i className="ri-add-line text-lg" />
            </button>
          ) : (
            <div className="w-8" />
          )}
        </div>
      </header>

      {/* ── Announcements Feed ── */}
      <div className="px-4 py-3 divide-y divide-slate-100">
        {announcements.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center justify-center">
            <div className="w-14 h-14 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 text-2xl mb-3">
              <i className="ri-megaphone-line" />
            </div>
            <p className="text-sm font-semibold text-slate-700">No announcements yet</p>
            <p className="text-xs text-slate-400 mt-1">Check back later for company updates</p>
            {canManage && (
              <button
                type="button"
                onClick={onOpenCreateModal}
                className="mt-4 px-4 py-2 bg-[#253C7D] text-white text-xs font-bold rounded-xl shadow-xs hover:bg-[#1E3064] transition-all cursor-pointer"
              >
                + Post Announcement
              </button>
            )}
          </div>
        ) : (
          announcements.map((a) => {
            const rawContent = stripHtml(a.content || "");
            const style = getCategoryIconStyle(a.category, a.priority, a.title);
            const isMenuOpen = activeMenuId === a.id;

            return (
              <div
                key={a.id}
                className={`py-4 flex items-start gap-3.5 relative transition-colors ${
                  a.pinned ? "bg-amber-50/20 -mx-4 px-4 rounded-xl" : ""
                }`}
              >
                {/* Left Category Icon */}
                <div
                  className={`w-10 h-10 rounded-full ${style.bg} ${style.color} flex items-center justify-center text-lg shrink-0 mt-0.5`}
                >
                  <i className={style.icon} />
                </div>

                {/* Middle Content */}
                <div
                  className="flex-1 min-w-0 cursor-pointer"
                  onClick={() => onOpen(a)}
                >
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {a.pinned && (
                      <i className="ri-pushpin-fill text-amber-500 text-xs shrink-0" title="Pinned" />
                    )}
                    <h2 className="text-[14px] font-bold text-slate-900 leading-tight">
                      {a.title}
                    </h2>
                  </div>

                  <p className="text-[12.5px] text-slate-500 leading-relaxed mt-1 line-clamp-2">
                    {rawContent}
                  </p>

                  <p className="text-[11px] text-slate-400 mt-1.5 font-medium">
                    {timeAgo(a.published_at || a.created_at)}
                  </p>
                </div>

                {/* Right 3-Dots Action Button & Floating Menu */}
                <div className="relative shrink-0 pt-0.5">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveMenuId(isMenuOpen ? null : a.id);
                    }}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                    aria-label="More options"
                  >
                    <i className="ri-more-2-fill text-lg" />
                  </button>

                  {/* Floating Action Menu matching Mockup */}
                  {isMenuOpen && (
                    <div
                      ref={menuRef}
                      className="absolute right-0 top-8 z-40 w-38 bg-white rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.12)] border border-slate-100 py-1 text-left animate-in fade-in zoom-in-95 duration-100"
                    >
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpen(a);
                          setActiveMenuId(null);
                        }}
                        className="w-full px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer transition-colors"
                      >
                        <i className="ri-eye-line text-slate-400" />
                        <span>View Details</span>
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onCopyLink(a);
                          setActiveMenuId(null);
                        }}
                        className="w-full px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer transition-colors"
                      >
                        <i className="ri-share-forward-line text-slate-400" />
                        <span>Copy Link</span>
                      </button>

                      {canManage && (
                        <>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onTogglePin(a);
                              setActiveMenuId(null);
                            }}
                            className="w-full px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer transition-colors border-t border-slate-50"
                          >
                            <i className="ri-pushpin-line text-slate-400" />
                            <span>{a.pinned ? "Unpin" : "Pin to top"}</span>
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenEditModal(a);
                              setActiveMenuId(null);
                            }}
                            className="w-full px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer transition-colors"
                          >
                            <i className="ri-edit-line text-slate-400" />
                            <span>Edit</span>
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDelete(a);
                              setActiveMenuId(null);
                            }}
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
          })
        )}
      </div>
    </div>
  );
});
