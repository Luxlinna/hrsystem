import { memo } from "react";
import type { Announcement } from "../types";

interface AnnouncementDrawerBodyProps {
  selectedItem: Announcement;
  mustAcceptUrgentAnnouncements: boolean;
  isUrgent: boolean;
  acceptedUrgentIds: Set<string>;
  acceptingUrgent: boolean;
  acceptUrgentError: string;
  timeAgo: (dateStr: string) => string;
  onAcceptUrgent: (announcementId: string, title?: string) => void;
  audLabel: string;
}

export const AnnouncementDrawerBody = memo(function AnnouncementDrawerBody({
  selectedItem,
  mustAcceptUrgentAnnouncements,
  isUrgent,
  acceptedUrgentIds,
  acceptingUrgent,
  acceptUrgentError,
  timeAgo,
  onAcceptUrgent,
  audLabel,
}: AnnouncementDrawerBodyProps) {
  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-5">
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
            {new Date(selectedItem.published_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
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
                  <p className="text-[11px] font-normal text-rose-700 mt-0.5">Please review and acknowledge receipt of this broadcast notice.</p>
                </div>
              </div>
              {acceptUrgentError && <p className="text-xs font-bold text-rose-600">{acceptUrgentError}</p>}
              <button
                type="button"
                onClick={() => onAcceptUrgent(selectedItem.id, selectedItem.title)}
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
          <span>Visibility: <strong>{audLabel}</strong></span>
        </div>
      </div>
    </div>
  );
});
