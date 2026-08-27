import { memo } from "react";
import type { HireTab } from "../types";

interface HireStatsRowProps {
  activeJobsCount: number;
  candidatesCount: number;
  interviewsCount: number;
  hiredCount: number;
  onSelectTab: (tab: HireTab) => void;
}

export const HireStatsRow = memo(function HireStatsRow({
  activeJobsCount,
  candidatesCount,
  interviewsCount,
  hiredCount,
  onSelectTab,
}: HireStatsRowProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6">
      {/* Active Jobs */}
      <div
        onClick={() => onSelectTab("jobs")}
        className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-2xs hover:shadow-xs transition-all cursor-pointer relative overflow-hidden group"
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-[#253C7D] uppercase tracking-wider">Active Vacancies</span>
          <div className="w-7 h-7 rounded-lg bg-[#253C7D]/10 text-[#253C7D] flex items-center justify-center">
            <i className="ri-briefcase-line text-sm" />
          </div>
        </div>
        <p className="text-2xl font-black text-[#253C7D] mt-2">{activeJobsCount}</p>
        <p className="text-[11px] text-gray-400 mt-0.5">Open for applicants</p>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#253C7D]" />
      </div>

      {/* Candidates in Pipeline */}
      <div
        onClick={() => onSelectTab("candidates")}
        className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-2xs hover:shadow-xs transition-all cursor-pointer relative overflow-hidden group"
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-sky-600 uppercase tracking-wider">Total Candidates</span>
          <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
            <i className="ri-user-search-line text-sm" />
          </div>
        </div>
        <p className="text-2xl font-black text-sky-700 mt-2">{candidatesCount}</p>
        <p className="text-[11px] text-gray-400 mt-0.5">In recruitment pipeline</p>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-sky-500" />
      </div>

      {/* Scheduled Interviews */}
      <div
        onClick={() => onSelectTab("interviews")}
        className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-2xs hover:shadow-xs transition-all cursor-pointer relative overflow-hidden group"
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">Interviews</span>
          <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <i className="ri-calendar-todo-line text-sm" />
          </div>
        </div>
        <p className="text-2xl font-black text-indigo-700 mt-2">{interviewsCount}</p>
        <p className="text-[11px] text-gray-400 mt-0.5">Sessions logged</p>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-500" />
      </div>

      {/* Hired Candidates */}
      <div
        onClick={() => onSelectTab("pipeline")}
        className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-2xs hover:shadow-xs transition-all cursor-pointer relative overflow-hidden group"
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Hired</span>
          <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <i className="ri-checkbox-circle-line text-sm" />
          </div>
        </div>
        <p className="text-2xl font-black text-emerald-700 mt-2">{hiredCount}</p>
        <p className="text-[11px] text-gray-400 mt-0.5">Successfully placed</p>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500" />
      </div>
    </div>
  );
});
