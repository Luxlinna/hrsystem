import { memo } from "react";
import type { Announcement, AnnouncementTabKey, ViewMode } from "../types";
import { CATEGORY_CONFIG } from "../constants";

interface FilterBarProps {
  announcements: Announcement[];
  mainTab: AnnouncementTabKey;
  setMainTab: (tab: AnnouncementTabKey) => void;
  urgentCount: number;
  pinnedCount: number;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filterCat: string;
  setFilterCat: (cat: string) => void;
  filterPriority: string;
  setFilterPriority: (priority: string) => void;
  filterAudience: string;
  setFilterAudience: (audience: string) => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  onFilterChange: () => void;
}

export const FilterBar = memo(function FilterBar({
  announcements,
  mainTab,
  setMainTab,
  urgentCount,
  pinnedCount,
  searchTerm,
  setSearchTerm,
  filterCat,
  setFilterCat,
  filterPriority,
  setFilterPriority,
  filterAudience,
  setFilterAudience,
  viewMode,
  setViewMode,
  onFilterChange,
}: FilterBarProps) {
  const tabs = [
    { id: "all" as const, label: "All Broadcasts", count: announcements.length, icon: "ri-layout-grid-line" },
    { id: "urgent" as const, label: "Urgent & High", count: urgentCount, icon: "ri-fire-line", isAlert: urgentCount > 0 },
    { id: "pinned" as const, label: "Pinned Notices", count: pinnedCount, icon: "ri-pushpin-line" },
    { id: "policies" as const, label: "Policies & Compliance", count: announcements.filter((a) => a.category === "policy" || a.category === "compliance").length, icon: "ri-file-shield-line" },
    { id: "management" as const, label: "Management Only", count: announcements.filter((a) => a.visible_to === "management").length, icon: "ri-lock-line" },
  ];

  return (
    <>
      {/* Main Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-gray-200/80 pb-3 mb-5 overflow-x-auto no-scrollbar">
        {tabs.map((tab) => {
          const isActive = mainTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => { setMainTab(tab.id); onFilterChange(); }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                isActive ? "bg-[#253C7D] text-white shadow-xs" : "bg-white text-gray-600 hover:text-gray-900 border border-gray-200/60 hover:bg-gray-50"
              }`}
            >
              <i className={tab.icon} />
              <span>{tab.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${isActive ? "bg-white/20 text-white" : tab.isAlert ? "bg-rose-100 text-rose-700 font-black" : "bg-gray-100 text-gray-600"}`}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Controls & Search Filter Bar */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-3.5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div className="relative flex-1">
          <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); onFilterChange(); }}
            placeholder="Search announcements by title, author, or keywords..."
            className="w-full pl-8 pr-7 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:bg-white focus:outline-none focus:border-[#253C7D] font-medium"
          />
          {searchTerm && (
            <button type="button" onClick={() => { setSearchTerm(""); onFilterChange(); }} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer">
              <i className="ri-close-circle-fill text-xs" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select value={filterCat} onChange={(e) => { setFilterCat(e.target.value); onFilterChange(); }} className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 focus:outline-none focus:border-[#253C7D] font-bold cursor-pointer">
            <option value="all">All Categories</option>
            {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => (
              <option key={key} value={key}>{cfg.label}</option>
            ))}
          </select>

          <select value={filterPriority} onChange={(e) => { setFilterPriority(e.target.value); onFilterChange(); }} className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 focus:outline-none focus:border-[#253C7D] font-medium cursor-pointer">
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent Only</option>
            <option value="high">High Priority</option>
            <option value="normal">Normal</option>
          </select>

          <select value={filterAudience} onChange={(e) => { setFilterAudience(e.target.value); onFilterChange(); }} className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 focus:outline-none focus:border-[#253C7D] font-medium cursor-pointer">
            <option value="all">All Audiences</option>
            <option value="hq">HQ Staff</option>
            <option value="management">Management</option>
          </select>

          <div className="flex items-center bg-gray-100 p-0.5 rounded-lg border border-gray-200/60">
            <button type="button" onClick={() => setViewMode("cards")} title="Cards Grid" className={`p-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${viewMode === "cards" ? "bg-white text-[#253C7D] shadow-xs" : "text-gray-500 hover:text-gray-800"}`}>
              <i className="ri-layout-grid-fill" />
            </button>
            <button type="button" onClick={() => setViewMode("table")} title="Table View" className={`p-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${viewMode === "table" ? "bg-white text-[#253C7D] shadow-xs" : "text-gray-500 hover:text-gray-800"}`}>
              <i className="ri-table-line" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
});
