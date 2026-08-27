import { memo, useMemo } from "react";
import type { AppUsageLog } from "../types";
import { actionLabels } from "../constants";
import { timeAgo, initials } from "../unityUtils";

interface AppActivityTabProps {
  appLogs: AppUsageLog[];
  totalMinutes: number;
}

export const AppActivityTab = memo(function AppActivityTab({
  appLogs,
  totalMinutes,
}: AppActivityTabProps) {
  const sortedLogs = useMemo(() => {
    return [...appLogs].sort(
      (a, b) => new Date(b.logged_at).getTime() - new Date(a.logged_at).getTime()
    );
  }, [appLogs]);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-[13px] font-semibold text-gray-900">
          {appLogs.length} Events &middot; {totalMinutes}min total
        </p>
      </div>

      <div className="space-y-2">
        {sortedLogs.map((log) => {
          const emp = log.employees;
          const empName = emp ? `${emp.first_name} ${emp.last_name}` : "User";

          return (
            <div
              key={log.id}
              className="flex items-start gap-3 py-3 border-b border-gray-50 last:border-0 hover:bg-slate-50/50 p-2 rounded-xl transition-colors"
            >
              {emp?.avatar_url ? (
                <img
                  src={emp.avatar_url}
                  alt={empName}
                  className="w-8 h-8 rounded-full object-cover shrink-0 mt-0.5 ring-1 ring-gray-100"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 text-xs font-bold shrink-0 mt-0.5">
                  {initials(emp?.first_name, emp?.last_name)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-[12px] text-gray-900 leading-snug">
                  <span className="font-semibold text-gray-900">{empName}</span>{" "}
                  <span className="text-gray-600">
                    {actionLabels[log.action] || log.action}
                  </span>
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] text-gray-400">{timeAgo(log.logged_at)}</span>
                  {log.duration_minutes > 0 && (
                    <span className="text-[10px] text-gray-400">
                      &middot; {log.duration_minutes}min
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {appLogs.length === 0 && (
          <div className="py-8 text-center">
            <i className="ri-bar-chart-line text-3xl text-gray-300 block mb-2" />
            <p className="text-[13px] text-gray-400">No activity recorded yet</p>
          </div>
        )}
      </div>
    </div>
  );
});
