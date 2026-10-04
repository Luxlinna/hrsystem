import { memo } from "react";
import type { TaskStats } from "../types";

interface ChecklistStatsRowProps {
  stats: TaskStats;
  filterStatus: string;
  filterPriority: string;
  onFilterStatus: (s: "all" | "completed" | "pending" | "overdue") => void;
  onFilterPriority: (p: string) => void;
}

export const ChecklistStatsRow = memo(function ChecklistStatsRow({
  stats,
  filterStatus,
  filterPriority,
  onFilterStatus,
  onFilterPriority,
}: ChecklistStatsRowProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mb-6">
      {/* Total Tasks */}
      <div
        onClick={() => {
          onFilterStatus("all");
          onFilterPriority("all");
        }}
        className={`bg-white border rounded-2xl p-4 transition-all cursor-pointer shadow-2xs hover:shadow-xs relative overflow-hidden group ${
          filterStatus === "all" && filterPriority === "all"
            ? "border-[#253C7D] ring-2 ring-[#253C7D]/10"
            : "border-gray-200/80"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-[#253C7D] uppercase tracking-wider">
            Total Checklist Items
          </span>
          <div className="w-7 h-7 rounded-lg bg-[#253C7D]/10 text-[#253C7D] flex items-center justify-center">
            <i className="ri-task-line text-sm" />
          </div>
        </div>
        <p className="text-2xl font-black text-gray-900 mt-2">{stats.total}</p>
        <p className="text-[11px] text-gray-400 mt-0.5">{stats.pct}% completed overall</p>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#253C7D]" />
      </div>

      {/* Completed Tasks */}
      <div
        onClick={() => onFilterStatus("completed")}
        className={`bg-white border rounded-2xl p-4 transition-all cursor-pointer shadow-2xs hover:shadow-xs relative overflow-hidden group ${
          filterStatus === "completed"
            ? "border-emerald-600 ring-2 ring-emerald-600/10"
            : "border-gray-200/80"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">
            Completed Tasks
          </span>
          <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <i className="ri-checkbox-circle-line text-sm" />
          </div>
        </div>
        <p className="text-2xl font-black text-emerald-700 mt-2">{stats.completed}</p>
        <p className="text-[11px] text-gray-400 mt-0.5">Verified & executed</p>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500" />
      </div>

      {/* Pending Tasks */}
      <div
        onClick={() => onFilterStatus("pending")}
        className={`bg-white border rounded-2xl p-4 transition-all cursor-pointer shadow-2xs hover:shadow-xs relative overflow-hidden group ${
          filterStatus === "pending"
            ? "border-amber-500 ring-2 ring-amber-500/10"
            : "border-gray-200/80"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">
            Pending Tasks
          </span>
          <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <i className="ri-time-line text-sm" />
          </div>
        </div>
        <p className="text-2xl font-black text-amber-700 mt-2">{stats.pending}</p>
        <p className="text-[11px] text-gray-400 mt-0.5">Awaiting action</p>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-500" />
      </div>

      {/* Overdue / High Priority */}
      <div
        onClick={() => {
          if (stats.overdue > 0) onFilterStatus("overdue");
          else onFilterPriority("high");
        }}
        className={`bg-white border rounded-2xl p-4 transition-all cursor-pointer shadow-2xs hover:shadow-xs relative overflow-hidden group ${
          filterStatus === "overdue" || filterPriority === "high"
            ? "border-rose-600 ring-2 ring-rose-600/10"
            : "border-gray-200/80"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider">
            {stats.overdue > 0 ? "Overdue Items" : "High Priority Pending"}
          </span>
          <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
            <i className="ri-alert-line text-sm" />
          </div>
        </div>
        <p className="text-2xl font-black text-rose-700 mt-2">
          {stats.overdue > 0 ? stats.overdue : stats.highPriority}
        </p>
        <p className="text-[11px] text-gray-400 mt-0.5">
          {stats.overdue > 0 ? "Past target completion date" : "Critical onboarding items"}
        </p>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-rose-500" />
      </div>
    </div>
  );
});
