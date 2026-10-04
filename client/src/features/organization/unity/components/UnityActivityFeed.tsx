import { memo } from "react";
import type { AppUsageLog } from "../types";
import { actionLabels } from "../constants";
import { timeAgo } from "../unityUtils";

interface UnityActivityFeedProps {
  usageLogs: AppUsageLog[];
}

export const UnityActivityFeed = memo(function UnityActivityFeed({
  usageLogs,
}: UnityActivityFeedProps) {
  return (
    <div className="max-w-2xl">
      <p className="text-[13px] font-semibold text-gray-900 mb-4">{usageLogs.length} total events recorded</p>
      <div className="space-y-1">
        {usageLogs.map((log) => {
          const emp = log.employees;
          const app = log.unity_apps;
          return (
            <div key={log.id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
              {emp?.avatar_url ? (
                <img src={emp.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0 mt-0.5" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 text-xs font-bold flex-shrink-0 mt-0.5">
                  {emp?.first_name?.[0]}{emp?.last_name?.[0]}
                </div>
              )}
              <div className="flex-1">
                <p className="text-[12px] text-gray-900">
                  <span className="font-semibold">{emp?.first_name} {emp?.last_name}</span>
                  {" "}{actionLabels[log.action] || log.action}{" "}
                  <span className="font-medium text-[#253C7D]">in {app?.name}</span>
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] text-gray-400">{timeAgo(log.logged_at)}</span>
                  {log.duration_minutes > 0 && <span className="text-[10px] text-gray-400">&middot; {log.duration_minutes}min</span>}
                </div>
              </div>
              {app && (
                <div className="w-6 h-6 rounded-md flex items-center justify-center text-white text-xs flex-shrink-0" style={{ backgroundColor: app.color }}>
                  <i className={`${app.icon} w-3 h-3 flex items-center justify-center`} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
});
