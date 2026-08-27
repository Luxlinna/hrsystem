import { memo } from "react";

interface AnnouncementHeaderProps {
  publishedCount: number;
  canManage: boolean;
  onExportCSV: () => void;
  onOpenCreateModal: () => void;
}

export const AnnouncementHeader = memo(function AnnouncementHeader({
  publishedCount,
  canManage,
  onExportCSV,
  onOpenCreateModal,
}: AnnouncementHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
          <span>Corporate Communications</span>
          <i className="ri-arrow-right-s-line text-xs" />
          <span className="text-[#253C7D] font-bold">Broadcast Center</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2.5">
          Company Announcements
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#253C7D]/10 text-[#253C7D]">
            {publishedCount} Published
          </span>
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">
          Official company broadcasts, executive updates, operational policies, and corporate events.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2.5 flex-wrap">
        <button
          onClick={onExportCSV}
          className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-white border border-gray-200/80 hover:bg-gray-50 text-gray-700 text-xs font-bold rounded-xl shadow-2xs transition-all cursor-pointer"
        >
          <i className="ri-file-excel-2-line text-emerald-600 text-sm" />
          Export Feed
        </button>

        {canManage && (
          <button
            onClick={onOpenCreateModal}
            className="inline-flex items-center gap-2 bg-[#253C7D] hover:bg-[#1E3064] text-white px-4 py-2.5 rounded-xl text-xs sm:text-[13px] font-bold transition-all shadow-sm hover:shadow-md cursor-pointer active:scale-98"
          >
            <i className="ri-megaphone-line text-base font-bold" />
            Post Announcement
          </button>
        )}
      </div>
    </div>
  );
});
