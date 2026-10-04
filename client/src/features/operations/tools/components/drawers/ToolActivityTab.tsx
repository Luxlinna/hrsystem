import { memo, useMemo } from "react";
import type { ToolUsage } from "../../types";
import { ACTION_LABELS } from "../../constants";
import { formatDateTime, initials } from "../../toolsUtils";

interface ToolActivityTabProps {
  toolId: number;
  usages: ToolUsage[];
}

export const ToolActivityTab = memo(function ToolActivityTab({
  toolId,
  usages,
}: ToolActivityTabProps) {
  const toolUsages = useMemo(() => {
    return usages.filter((u) => u.tool_id === toolId);
  }, [usages, toolId]);

  if (toolUsages.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400 text-xs">
        No usage records logged for this tool yet.
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-100">
      {toolUsages.map((u) => {
        const act = ACTION_LABELS[u.action] || {
          label: u.action,
          icon: "ri-flashlight-line",
          color: "text-slate-600 bg-slate-100",
        };
        const empName = u.employees
          ? `${u.employees.first_name} ${u.employees.last_name}`
          : "User";

        return (
          <div key={u.id} className="py-2.5 flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 min-w-0">
              {u.employees?.avatar_url ? (
                <img
                  src={u.employees.avatar_url}
                  alt={empName}
                  className="w-6 h-6 rounded-full object-cover shrink-0"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-[#253C7D] text-white text-[8px] font-bold flex items-center justify-center shrink-0">
                  {initials(u.employees?.first_name, u.employees?.last_name)}
                </div>
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-gray-800 truncate">{empName}</span>
                  <span
                    className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold ${act.color}`}
                  >
                    {act.label}
                  </span>
                </div>
                <p className="text-[10px] text-gray-400">{formatDateTime(u.created_at)}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
});
