import { memo } from "react";
import type { AuditLog } from "../types";
import { MODULE_COLORS, ACTION_ICONS, ACTION_COLORS, formatTime } from "../constants";

interface AuditLogItemProps {
  log: AuditLog;
  isExpanded: boolean;
  onToggleExpand: (id: string) => void;
}

export const AuditLogItem = memo(function AuditLogItem({
  log,
  isExpanded,
  onToggleExpand,
}: AuditLogItemProps) {
  return (
    <div className="px-5 py-4 hover:bg-gray-50/50 transition-colors">
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div
          className={`w-8 h-8 flex items-center justify-center rounded-full shrink-0 bg-gray-100 ${
            ACTION_COLORS[log.action] || "text-gray-500"
          }`}
        >
          <i className={`${ACTION_ICONS[log.action] || "ri-record-circle-line"} text-sm`} />
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span
              className={`text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                MODULE_COLORS[log.module] || "bg-gray-100 text-gray-600"
              }`}
            >
              {log.module}
            </span>
            <span
              className={`text-xs font-medium capitalize ${
                ACTION_COLORS[log.action] || "text-gray-500"
              }`}
            >
              {log.action}
            </span>
            <span className="text-xs text-gray-400">·</span>
            <span className="text-xs text-gray-500">{log.entity_type.replace(/_/g, " ")}</span>
            {log.branches?.name && (
              <span className="text-[10px] font-semibold bg-blue-50 text-[#253C7D] px-2 py-0.5 rounded flex items-center gap-1 border border-blue-100/80">
                <i className="ri-building-line text-[10px]" />
                {log.branches.name}
              </span>
            )}
          </div>

          <p className="text-sm text-gray-800 leading-snug">{log.description}</p>

          <div className="flex flex-wrap items-center gap-3 mt-1.5">
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <i className="ri-user-line text-xs" />
              {log.actor_name} &mdash; {log.actor_role}
            </span>
            <span className="text-xs text-gray-400">{formatTime(log.created_at)}</span>
            <span className="text-xs text-gray-300">·</span>
            <span className="text-xs text-gray-400">
              {new Date(log.created_at).toLocaleString("en-US", {
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            </span>
          </div>

          {/* Metadata */}
          {log.metadata && Object.keys(log.metadata).length > 0 && (
            <div className="mt-2">
              <button
                onClick={() => onToggleExpand(log.id)}
                className="text-xs text-[#253C7D] hover:underline cursor-pointer flex items-center gap-1"
              >
                <i className={`${isExpanded ? "ri-arrow-up-s-line" : "ri-arrow-down-s-line"}`} />
                {isExpanded ? "Hide" : "Show"} details
              </button>
              {isExpanded && (
                <div className="mt-2 p-3 bg-gray-50 rounded-lg flex flex-wrap gap-3">
                  {Object.entries(log.metadata).map(([k, v]) => (
                    <div key={k} className="text-xs">
                      <span className="text-gray-400">{k.replace(/_/g, " ")}: </span>
                      <span className="text-gray-700 font-medium">{String(v)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
