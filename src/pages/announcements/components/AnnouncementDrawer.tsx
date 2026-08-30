import { memo } from "react";
import type { Announcement } from "../types";
import { CATEGORY_CONFIG, PRIORITY_CONFIG, AUDIENCE_CONFIG } from "../constants";
import { AnnouncementDrawerBody } from "./AnnouncementDrawerBody";

interface AnnouncementDrawerProps {
  selectedItem: Announcement | null;
  onClose: () => void;
  canManage: boolean;
  mustAcceptUrgentAnnouncements: boolean;
  acceptedUrgentIds: Set<string>;
  acceptingUrgent: boolean;
  acceptUrgentError: string;
  timeAgo: (dateStr: string) => string;
  onAcceptUrgent: (announcementId: string, title?: string) => void;
  onTogglePin: (a: Announcement, e?: React.MouseEvent) => void;
  onCopyLink: (a: Announcement, e?: React.MouseEvent) => void;
  onOpenEditModal: (a: Announcement, e?: React.MouseEvent) => void;
  onDeleteAnnouncement: (a: Announcement, e?: React.MouseEvent) => void;
}

export const AnnouncementDrawer = memo(function AnnouncementDrawer({
  selectedItem,
  onClose,
  canManage,
  mustAcceptUrgentAnnouncements,
  acceptedUrgentIds,
  acceptingUrgent,
  acceptUrgentError,
  timeAgo,
  onAcceptUrgent,
  onTogglePin,
  onCopyLink,
  onOpenEditModal,
  onDeleteAnnouncement,
}: AnnouncementDrawerProps) {
  if (!selectedItem) return null;

  const cat = CATEGORY_CONFIG[selectedItem.category] || CATEGORY_CONFIG.general;
  const pri = PRIORITY_CONFIG[selectedItem.priority] || PRIORITY_CONFIG.normal;
  const aud = AUDIENCE_CONFIG[selectedItem.visible_to] || AUDIENCE_CONFIG.all;
  const isUrgent = selectedItem.priority === "urgent";

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs transition-opacity" onClick={onClose} />
      <div className="relative w-full sm:w-[520px] bg-white h-full shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-200 overflow-hidden">
        {/* Drawer Top Bar */}
        <div>
          <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-gray-50/80 to-white flex items-center justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${cat.bg} ${cat.color} flex items-center gap-1`}>
                <i className={cat.icon} />
                {cat.label}
              </span>
              <span className={`text-[10px] px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${pri.badge}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${pri.dot}`} />
                {pri.label}
              </span>
              {selectedItem.pinned && (
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 flex items-center gap-1">
                  <i className="ri-pushpin-fill" /> Pinned
                </span>
              )}
            </div>

            <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500 cursor-pointer">
              <i className="ri-close-line text-lg" />
            </button>
          </div>

          {/* Quick Action Strip */}
          <div className="px-5 py-2.5 bg-slate-50 border-b border-gray-100 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={(e) => onCopyLink(selectedItem, e)}
                className="px-3 py-1.5 bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <i className="ri-share-forward-line text-[#253C7D]" />
                Copy Link
              </button>

              {canManage && (
                <button
                  type="button"
                  onClick={(e) => onTogglePin(selectedItem, e)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 border shadow-2xs cursor-pointer ${
                    selectedItem.pinned ? "bg-amber-50 text-amber-800 border-amber-200" : "bg-white hover:bg-gray-100 text-gray-700 border-gray-200"
                  }`}
                >
                  <i className="ri-pushpin-line text-amber-600" />
                  {selectedItem.pinned ? "Pinned to Top" : "Pin Announcement"}
                </button>
              )}
            </div>

            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md border ${aud.badge}`}>
              {aud.label}
            </span>
          </div>
        </div>

        {/* Drawer Body */}
        <AnnouncementDrawerBody
          selectedItem={selectedItem}
          mustAcceptUrgentAnnouncements={mustAcceptUrgentAnnouncements}
          isUrgent={isUrgent}
          acceptedUrgentIds={acceptedUrgentIds}
          acceptingUrgent={acceptingUrgent}
          acceptUrgentError={acceptUrgentError}
          timeAgo={timeAgo}
          onAcceptUrgent={onAcceptUrgent}
          audLabel={aud.label}
        />

        {/* Drawer Bottom Actions Footer */}
        <div className="p-4 border-t border-gray-100 bg-white space-y-2 shrink-0">
          {canManage ? (
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={(e) => onOpenEditModal(selectedItem, e)}
                className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold bg-[#253C7D] text-white hover:bg-[#1E3064] transition-colors cursor-pointer shadow-xs"
              >
                <i className="ri-edit-line text-sm" />
                Edit Broadcast
              </button>

              <button
                onClick={(e) => onDeleteAnnouncement(selectedItem, e)}
                className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-colors cursor-pointer"
              >
                <i className="ri-delete-bin-line text-sm" />
                Move to Bin
              </button>
            </div>
          ) : (
            <button
              onClick={onClose}
              className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              Close Reader
            </button>
          )}
        </div>
      </div>
    </div>
  );
});
