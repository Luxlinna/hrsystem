import React from "react";

interface LeaveStatsCardsProps {
  remainingDays: number;
  totalRequests: number;
  totalApproved: number;
  totalPending: number;
  onNewRequest: () => void;
}

export const LeaveStatsCards: React.FC<LeaveStatsCardsProps> = ({
  remainingDays,
  totalRequests,
  totalApproved,
  totalPending,
  onNewRequest,
}) => {
  const cards = [
    { label: "Leave Balance", value: `${remainingDays}d`, sub: "Available days", icon: "ri-calendar-check-line" },
    { label: "Total Requests", value: totalRequests, sub: "Submitted", icon: "ri-file-list-3-line" },
    { label: "Approved", value: `${totalApproved}d`, sub: "Approved time off", icon: "ri-checkbox-circle-line" },
    { label: "Pending Review", value: totalPending, sub: "Under review", icon: "ri-time-line", isWarning: totalPending > 0 },
  ];

  return (
    <div className="space-y-3">
      {/* Action Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight">Leave Balance & Overview</h2>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">Track entitlements and personal time-off requests</p>
        </div>
        <button
          type="button"
          onClick={onNewRequest}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#253C7D] dark:bg-blue-600 hover:bg-[#1E3064] dark:hover:bg-blue-500 text-white rounded-lg sm:rounded-xl text-xs font-semibold transition-all shadow-2xs cursor-pointer active:scale-98 shrink-0"
        >
          <i className="ri-add-line text-xs" />
          <span>New Request</span>
        </button>
      </div>

      {/* Compact Metric Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        {cards.map((s) => (
          <div
            key={s.label}
            className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-lg sm:rounded-xl p-2.5 sm:p-3 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between"
          >
            <div className="flex items-center justify-between gap-1.5">
              <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">
                {s.label}
              </span>
              <i className={`${s.icon} text-xs ${s.isWarning ? "text-amber-500 dark:text-amber-400" : "text-slate-400 dark:text-slate-500"} shrink-0`} />
            </div>
            <div className="mt-1.5">
              <p className={`text-lg sm:text-xl font-bold tracking-tight leading-tight ${s.isWarning ? "text-amber-700 dark:text-amber-400" : "text-slate-900 dark:text-slate-100"}`}>
                {s.value}
              </p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 font-medium truncate">
                {s.sub}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
