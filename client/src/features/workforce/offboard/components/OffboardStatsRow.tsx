import { memo } from "react";

interface OffboardStatsRowProps {
  totalActiveCount: number;
  inClearanceCount: number;
  totalCompletedCount: number;
  pendingTasksCount: number;
  overdueTasksCount: number;
  tab: "active" | "completed" | "tasks" | "analytics";
  filterStatus: string;
  onSelectTab: (t: "active" | "completed" | "tasks" | "analytics") => void;
  onFilterStatus: (s: string) => void;
}

export const OffboardStatsRow = memo(function OffboardStatsRow({
  totalActiveCount,
  inClearanceCount,
  totalCompletedCount,
  pendingTasksCount,
  overdueTasksCount,
  tab,
  filterStatus,
  onSelectTab,
  onFilterStatus,
}: OffboardStatsRowProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mb-6">
      {/* Active Offboardings */}
      <div
        onClick={() => {
          onSelectTab("active");
          onFilterStatus("all");
        }}
        className={`bg-white border rounded-2xl p-4 transition-all cursor-pointer shadow-2xs hover:shadow-xs relative overflow-hidden group ${
          tab === "active" && filterStatus === "all"
            ? "border-amber-500 ring-2 ring-amber-500/10"
            : "border-gray-200/80"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">
            Active Departures
          </span>
          <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <i className="ri-user-shared-line text-sm" />
          </div>
        </div>
        <p className="text-2xl font-black text-amber-700 mt-2">{totalActiveCount}</p>
        <p className="text-[11px] text-gray-400 mt-0.5">{inClearanceCount} in final clearance</p>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-500" />
      </div>

      {/* Clearance In Progress */}
      <div
        onClick={() => {
          onSelectTab("active");
          onFilterStatus("clearance");
        }}
        className={`bg-white border rounded-2xl p-4 transition-all cursor-pointer shadow-2xs hover:shadow-xs relative overflow-hidden group ${
          tab === "active" && filterStatus === "clearance"
            ? "border-purple-600 ring-2 ring-purple-600/10"
            : "border-gray-200/80"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-purple-600 uppercase tracking-wider">
            Clearance Phase
          </span>
          <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
            <i className="ri-shield-check-line text-sm" />
          </div>
        </div>
        <p className="text-2xl font-black text-purple-700 mt-2">{inClearanceCount}</p>
        <p className="text-[11px] text-gray-400 mt-0.5">Asset return & sign-offs</p>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-purple-500" />
      </div>

      {/* Completed Departures */}
      <div
        onClick={() => {
          onSelectTab("completed");
          onFilterStatus("all");
        }}
        className={`bg-white border rounded-2xl p-4 transition-all cursor-pointer shadow-2xs hover:shadow-xs relative overflow-hidden group ${
          tab === "completed"
            ? "border-emerald-600 ring-2 ring-emerald-600/10"
            : "border-gray-200/80"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">
            Completed Exits
          </span>
          <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <i className="ri-checkbox-circle-line text-sm" />
          </div>
        </div>
        <p className="text-2xl font-black text-emerald-700 mt-2">{totalCompletedCount}</p>
        <p className="text-[11px] text-gray-400 mt-0.5">Departures finalized</p>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500" />
      </div>

      {/* Pending & Overdue Tasks */}
      <div
        onClick={() => onSelectTab("tasks")}
        className={`bg-white border rounded-2xl p-4 transition-all cursor-pointer shadow-2xs hover:shadow-xs relative overflow-hidden group ${
          tab === "tasks" ? "border-rose-500 ring-2 ring-rose-500/10" : "border-gray-200/80"
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider">
            Pending Tasks
          </span>
          <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
            <i className="ri-task-line text-sm" />
          </div>
        </div>
        <p className="text-2xl font-black text-rose-700 mt-2">{pendingTasksCount}</p>
        <p className="text-[11px] text-gray-400 mt-0.5">
          {overdueTasksCount > 0 ? (
            <span className="text-rose-600 font-bold">{overdueTasksCount} overdue tasks</span>
          ) : (
            "All tasks on track"
          )}
        </p>
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-rose-500" />
      </div>
    </div>
  );
});
