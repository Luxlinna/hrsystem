import { memo } from "react";

interface TasksStatsCardsProps {
  stats: {
    total: number;
    completed: number;
    inProgress: number;
    blocked: number;
    overdue: number;
    outside: number;
  };
}

export const TasksStatsCards = memo(function TasksStatsCards({
  stats,
}: TasksStatsCardsProps) {
  const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
      {/* Total Tasks */}
      <div className="bg-white rounded-2xl border border-gray-200/90 p-4 shadow-2xs relative overflow-hidden group hover:border-[#253C7D] transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">Total Tasks</span>
          <div className="w-7 h-7 rounded-xl bg-[#253C7D]/10 text-[#253C7D] flex items-center justify-center text-sm">
            <i className="ri-checkbox-line" />
          </div>
        </div>
        <p className="text-2xl font-black text-gray-900 mt-2 leading-none">{stats.total}</p>
        <p className="text-[11px] text-gray-400 font-medium mt-1">Across all departments</p>
      </div>

      {/* In Progress */}
      <div className="bg-white rounded-2xl border border-gray-200/90 p-4 shadow-2xs relative overflow-hidden group hover:border-sky-500 transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-extrabold text-sky-600 uppercase tracking-wider">In Progress</span>
          <div className="w-7 h-7 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center text-sm">
            <i className="ri-progress-4-line" />
          </div>
        </div>
        <p className="text-2xl font-black text-gray-900 mt-2 leading-none">{stats.inProgress}</p>
        <p className="text-[11px] text-gray-400 font-medium mt-1">Active execution</p>
      </div>

      {/* Blocked */}
      <div className="bg-white rounded-2xl border border-gray-200/90 p-4 shadow-2xs relative overflow-hidden group hover:border-amber-500 transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-extrabold text-amber-600 uppercase tracking-wider">Blocked</span>
          <div className="w-7 h-7 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-sm">
            <i className="ri-error-warning-line" />
          </div>
        </div>
        <p className="text-2xl font-black text-gray-900 mt-2 leading-none">{stats.blocked}</p>
        <p className="text-[11px] text-gray-400 font-medium mt-1">Awaiting resolution</p>
      </div>

      {/* Overdue */}
      <div className="bg-white rounded-2xl border border-gray-200/90 p-4 shadow-2xs relative overflow-hidden group hover:border-rose-500 transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-extrabold text-rose-600 uppercase tracking-wider">Overdue</span>
          <div className="w-7 h-7 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center text-sm">
            <i className="ri-alarm-warning-line" />
          </div>
        </div>
        <p className="text-2xl font-black text-gray-900 mt-2 leading-none">{stats.overdue}</p>
        <p className="text-[11px] text-gray-400 font-medium mt-1">Requires attention</p>
      </div>

      {/* Completed */}
      <div className="bg-white rounded-2xl border border-gray-200/90 p-4 shadow-2xs relative overflow-hidden group hover:border-emerald-500 transition-colors col-span-2 sm:col-span-1">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-extrabold text-emerald-600 uppercase tracking-wider">Completed</span>
          <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-sm">
            <i className="ri-checkbox-circle-line" />
          </div>
        </div>
        <p className="text-2xl font-black text-gray-900 mt-2 leading-none">{stats.completed}</p>
        <p className="text-[11px] text-emerald-600 font-bold mt-1">{completionRate}% overall completion</p>
      </div>
    </div>
  );
});
