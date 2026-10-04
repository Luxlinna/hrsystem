import { memo, useState, useMemo } from "react";
import type { Tool, ToolUsage } from "../../types";
import { ACTION_LABELS } from "../../constants";
import { initials, formatDateTime } from "../../toolsUtils";

interface ToolsActivityAuditViewProps {
  usages: ToolUsage[];
  tools: Tool[];
}

export const ToolsActivityAuditView = memo(function ToolsActivityAuditView({
  usages,
  tools,
}: ToolsActivityAuditViewProps) {
  const [toolFilter, setToolFilter] = useState<number | "All">("All");

  const toolMap = useMemo(() => {
    const map = new Map<number, Tool>();
    tools.forEach((t) => map.set(t.id, t));
    return map;
  }, [tools]);

  const filteredUsages = useMemo(() => {
    if (toolFilter === "All") return usages;
    return usages.filter((u) => u.tool_id === toolFilter);
  }, [usages, toolFilter]);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-2xs space-y-4">
      {/* Header & Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
        <div>
          <h3 className="text-sm font-bold text-gray-900">Live Invocations &amp; Audit Log</h3>
          <p className="text-xs text-gray-500">Real-time audit log of tool execution across the organization</p>
        </div>

        <select
          value={toolFilter}
          onChange={(e) =>
            setToolFilter(e.target.value === "All" ? "All" : Number(e.target.value))
          }
          className="px-3 py-1.5 bg-gray-50/80 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:outline-none cursor-pointer"
        >
          <option value="All">All Tools</option>
          {tools.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>

      {/* Usage List */}
      {filteredUsages.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <i className="ri-history-line text-3xl mb-2" />
          <p className="text-xs font-medium">No activity recorded for this selection.</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-50">
          {filteredUsages.map((usage) => {
            const tool = toolMap.get(usage.tool_id);
            const act = ACTION_LABELS[usage.action] || {
              label: usage.action,
              icon: "ri-flashlight-line",
              color: "text-slate-600 bg-slate-100",
            };
            const empName = usage.employees
              ? `${usage.employees.first_name} ${usage.employees.last_name}`
              : "System Agent";

            return (
              <div
                key={usage.id}
                className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50/60 p-2 rounded-xl transition-colors"
              >
                <div className="flex items-center gap-3">
                  {usage.employees?.avatar_url ? (
                    <img
                      src={usage.employees.avatar_url}
                      alt={empName}
                      className="w-8 h-8 rounded-full object-cover ring-1 ring-gray-100"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-[#253C7D] text-white text-[10px] font-bold flex items-center justify-center">
                      {initials(usage.employees?.first_name, usage.employees?.last_name)}
                    </div>
                  )}

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-gray-900 text-xs">{empName}</span>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold ${act.color}`}
                      >
                        <i className={act.icon} />
                        {act.label}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      Tool: <span className="font-semibold text-gray-700">{tool?.name || `#${usage.tool_id}`}</span>
                    </p>
                  </div>
                </div>

                <div className="text-right text-[11px] text-gray-400 shrink-0">
                  {formatDateTime(usage.created_at)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
});
