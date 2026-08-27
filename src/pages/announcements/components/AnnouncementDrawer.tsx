import { memo } from "react";
import type { Announcement } from "../types";
import { CATEGORY_CONFIG, PRIORITY_CONFIG, AUDIENCE_CONFIG } from "../constants";

interface AnnouncementDrawerProps {
  selectedItem: Announcement | null;
  onClose: () => void;
  canManage: boolean;
  mustAcceptUrgentAnnouncements: boolean;
  acceptedUrgentIds: Set<string>;
  acceptingUrgent: boolean;
  acceptUrgentError: string;
  timeAgo: (dateStr: string) => string;
  onAcceptUrgent: (announcementId: string) => void;
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
      <div
        className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />
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

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500 cursor-pointer"
            >
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
                    selectedItem.pinned
                      ? "bg-amber-50 text-amber-800 border-amber-200"
                      : "bg-white hover:bg-gray-100 text-gray-700 border-gray-200"
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

        {/* Scrollable Reader Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Title */}
          <h2 className="text-xl sm:text-2xl font-black text-gray-900 leading-tight">
            {selectedItem.title}
          </h2>

          {/* Author & Published Date Metadata Card */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-gray-200/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#253C7D] text-white flex items-center justify-center font-extrabold text-sm shadow-xs">
                {selectedItem.author_name ? selectedItem.author_name.charAt(0).toUpperCase() : "A"}
              </div>
              <div>
                <p className="text-xs font-extrabold text-gray-900">{selectedItem.author_name}</p>
                <p className="text-[11px] text-gray-400 font-medium">{selectedItem.author_role || "Corporate Operations"}</p>
              </div>
            </div>

            <div className="text-right">
              <p className="text-xs font-bold text-gray-700">{timeAgo(selectedItem.published_at)}</p>
              <p className="text-[10px] text-gray-400">
                {new Date(selectedItem.published_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>

          {/* Urgent Acknowledgment Banner (if required) */}
          {mustAcceptUrgentAnnouncements && isUrgent && (
            <div className="p-4 rounded-2xl border border-rose-200 bg-rose-50 space-y-3">
              {acceptedUrgentIds.has(selectedItem.id) ? (
                <div className="flex items-center gap-2 text-xs font-extrabold text-emerald-700 bg-emerald-50 p-3 rounded-xl border border-emerald-200">
                  <i className="ri-checkbox-circle-fill text-emerald-600 text-base" />
                  <span>You have acknowledged this urgent notice.</span>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-start gap-2 text-rose-800 text-xs font-bold">
                    <i className="ri-error-warning-fill text-rose-600 text-base shrink-0 mt-0.5" />
                    <div>
                      <p>Immediate Employee Acknowledgment Required</p>
                      <p className="text-[11px] font-normal text-rose-700 mt-0.5">
                        Please review and acknowledge receipt of this broadcast notice.
                      </p>
                    </div>
                  </div>
                  {acceptUrgentError && (
                    <p className="text-xs font-bold text-rose-600">{acceptUrgentError}</p>
                  )}
                  <button
                    type="button"
                    onClick={() => onAcceptUrgent(selectedItem.id)}
                    disabled={acceptingUrgent}
                    className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {acceptingUrgent ? "Recording..." : "Acknowledge Announcement"}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Announcement Content Box */}
          <div className="prose prose-sm text-gray-800 leading-relaxed whitespace-pre-line text-xs sm:text-[13px] bg-white p-4 rounded-2xl border border-gray-100 shadow-2xs">
            {selectedItem.content}
          </div>

          {/* Engagement Stats Bar */}
          <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-1.5 font-bold text-gray-700">
              <i className="ri-eye-line text-base text-[#253C7D]" />
              <span>{(selectedItem.view_count || 0).toLocaleString()} Staff Views</span>
            </div>

            <div className="flex items-center gap-1.5 text-[11px]">
              <i className="ri-global-line text-gray-400" />
              <span>Visibility: <strong>{aud.label}</strong></span>
            </div>
          </div>
        </div>

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
