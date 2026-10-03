import { memo } from "react";
import type { AnnouncementTabKey } from "../types";

interface MetricCardsProps {
  activeCount: number;
  urgentCount: number;
  pinnedCount: number;
  totalViews: number;
  mainTab: AnnouncementTabKey;
  onSelectTab: (tab: AnnouncementTabKey) => void;
}

export const MetricCards = memo(function MetricCards({
  activeCount,
  urgentCount,
  pinnedCount,
  totalViews,
  mainTab,
  onSelectTab,
}: MetricCardsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6">
      {/* Active Broadcasts */}
      <div
        onClick={() => onSelectTab("all")}
        className={`bg-white border rounded-2xl p-4 transition-all cursor-pointer shadow-2xs hover:shadow-xs relative overflow-hidden group ${
          mainTab === "all" ? "border-[#253C7D] ring-2 ring-[#253C7D]/10" : "border-gray-200/80"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-[#253C7D] uppercase tracking-wider">Active Broadcasts</span>
          <div className="w-7 h-7 rounded-lg bg-[#253C7D]/10 text-[#253C7D] flex items-center justify-center">
            <i className="ri-megaphone-line text-sm" />
          </div>
        </div>
        <p className="text-2xl font-black text-[#253C7D] mt-2">{activeCount}</p>
        <p className="text-[11px] text-gray-400 mt-0.5">Company-wide releases</p>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#253C7D]" />
      </div>

      {/* Urgent & High Priority */}
      <div
        onClick={() => onSelectTab("urgent")}
        className={`bg-white border rounded-2xl p-4 transition-all cursor-pointer shadow-2xs hover:shadow-xs relative overflow-hidden group ${
          mainTab === "urgent" ? "border-rose-500 ring-2 ring-rose-500/10" : "border-gray-200/80"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider">Urgent & Critical</span>
          <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
            <i className="ri-alarm-warning-line text-sm" />
          </div>
        </div>
        <p className="text-2xl font-black text-rose-700 mt-2">{urgentCount}</p>
        <p className="text-[11px] text-gray-400 mt-0.5">Requires immediate attention</p>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-rose-500" />
      </div>

      {/* Pinned Announcements */}
      <div
        onClick={() => onSelectTab("pinned")}
        className={`bg-white border rounded-2xl p-4 transition-all cursor-pointer shadow-2xs hover:shadow-xs relative overflow-hidden group ${
          mainTab === "pinned" ? "border-amber-500 ring-2 ring-amber-500/10" : "border-gray-200/80"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">Pinned Notices</span>
          <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <i className="ri-pushpin-line text-sm" />
          </div>
        </div>
        <p className="text-2xl font-black text-amber-700 mt-2">{pinnedCount}</p>
        <p className="text-[11px] text-gray-400 mt-0.5">Featured on top</p>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-500" />
      </div>

      {/* Total Reach & Engagement */}
      <div className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-2xs relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Employee Reach</span>
          <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <i className="ri-eye-line text-sm" />
          </div>
        </div>
        <p className="text-2xl font-black text-emerald-700 mt-2">{totalViews.toLocaleString()}</p>
        <p className="text-[11px] text-gray-400 mt-0.5">Cumulative staff views</p>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500" />
      </div>
    </div>
  );
});
