import React from "react";

interface CalendarStatsCardsProps {
  filterType: "all" | "due" | "expired" | "completed";
  setFilterType: React.Dispatch<React.SetStateAction<"all" | "due" | "expired" | "completed">>;
  scheduledCount: number;
  expiredCount: number;
  dueSoonCount: number;
  upcomingCompletions: number;
}

export function CalendarStatsCards({
  filterType,
  setFilterType,
  scheduledCount,
  expiredCount,
  dueSoonCount,
  upcomingCompletions,
}: CalendarStatsCardsProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <div
        onClick={() => setFilterType("all")}
        className={`p-4 rounded-2xl border transition-all cursor-pointer ${
          filterType === "all"
            ? "bg-blue-50 border-blue-300 ring-2 ring-blue-500/20 shadow-xs"
            : "bg-white border-gray-100 hover:border-gray-200 shadow-2xs"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            Total In View
          </span>
          <span className="w-2 h-2 rounded-full bg-[#253C7D]" />
        </div>
        <p className="text-2xl font-extrabold text-[#253C7D] mt-1">{scheduledCount}</p>
        <p className="text-[11px] text-gray-400 mt-0.5">Trainings & milestones</p>
      </div>

      <div
        onClick={() => setFilterType((prev) => (prev === "expired" ? "all" : "expired"))}
        className={`p-4 rounded-2xl border transition-all cursor-pointer ${
          filterType === "expired"
            ? "bg-rose-50 border-rose-300 ring-2 ring-rose-500/20 shadow-xs"
            : "bg-white border-gray-100 hover:border-gray-200 shadow-2xs"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            Expired / Overdue
          </span>
          <span className="w-2 h-2 rounded-full bg-rose-500" />
        </div>
        <p className="text-2xl font-extrabold text-rose-600 mt-1">{expiredCount}</p>
        <p className="text-[11px] text-gray-400 mt-0.5">Trainings past deadline</p>
      </div>

      <div
        onClick={() => setFilterType((prev) => (prev === "due" ? "all" : "due"))}
        className={`p-4 rounded-2xl border transition-all cursor-pointer ${
          filterType === "due"
            ? "bg-amber-50 border-amber-300 ring-2 ring-amber-500/20 shadow-xs"
            : "bg-white border-gray-100 hover:border-gray-200 shadow-2xs"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            Due Within 7 Days
          </span>
          <span className="w-2 h-2 rounded-full bg-amber-500" />
        </div>
        <p className="text-2xl font-extrabold text-amber-600 mt-1">{dueSoonCount}</p>
        <p className="text-[11px] text-gray-400 mt-0.5">Approaching completion date</p>
      </div>

      <div
        onClick={() => setFilterType((prev) => (prev === "completed" ? "all" : "completed"))}
        className={`p-4 rounded-2xl border transition-all cursor-pointer ${
          filterType === "completed"
            ? "bg-emerald-50 border-emerald-300 ring-2 ring-emerald-500/20 shadow-xs"
            : "bg-white border-gray-100 hover:border-gray-200 shadow-2xs"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
            Completed / Certified
          </span>
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
        </div>
        <p className="text-2xl font-extrabold text-emerald-600 mt-1">{upcomingCompletions}</p>
        <p className="text-[11px] text-gray-400 mt-0.5">Mastery achievements</p>
      </div>
    </div>
  );
}
