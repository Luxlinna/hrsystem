import { memo, useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import type { Announcement } from "../types";
import { MobileAnnouncementItem } from "./MobileAnnouncementItem";

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

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setActiveMenuId(null);
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

  const handleToggleMenu = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveMenuId((prev) => (prev === id ? null : id));
  }, []);

  return (
    <div className="min-h-screen bg-white text-slate-800 pb-24 font-sans selection:bg-blue-100">
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-100 px-4 py-3.5 flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-full flex items-center justify-center text-slate-700 hover:bg-slate-100 active:scale-95 transition-all cursor-pointer -ml-1"
          aria-label="Go back"
        >
          <i className="ri-arrow-left-line text-xl" />
        </button>

        <h1 className="text-sm font-bold tracking-widest text-slate-900 uppercase">ANNOUNCEMENTS</h1>

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

      <div ref={menuRef} className="px-4 py-3 divide-y divide-slate-100">
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
          announcements.map((a) => (
            <MobileAnnouncementItem
              key={a.id}
              announcement={a}
              canManage={canManage}
              isMenuOpen={activeMenuId === a.id}
              timeAgo={timeAgo}
              onOpen={onOpen}
              onToggleMenu={handleToggleMenu}
              onOpenEditModal={onOpenEditModal}
              onTogglePin={onTogglePin}
              onCopyLink={onCopyLink}
              onDelete={onDelete}
            />
          ))
        )}
      </div>
    </div>
  );
});
