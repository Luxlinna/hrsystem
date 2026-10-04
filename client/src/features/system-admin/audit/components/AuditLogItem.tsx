import { memo } from "react";
import type { AuditLog } from "../types";
import { MODULE_COLORS, ACTION_COLORS, formatTime, formatAuditTimestamp } from "../constants";

interface AuditLogItemProps {
  log: AuditLog;
  isExpanded: boolean;
  onToggleExpand: (id: string) => void;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
  onDelete?: (log: AuditLog) => void;
}

export const AuditLogItem = memo(function AuditLogItem({
  log,
  isExpanded,
  onToggleExpand,
  isSelected = false,
  onToggleSelect,
  onDelete,
}: AuditLogItemProps) {
  const isCrossBu = Boolean(log.metadata?.is_cross_bu);
  const primaryBu = (log.metadata?.business_unit as string) || log.branches?.name;
  const targetBu = log.metadata?.target_business_unit as string;
  const hasDiff = log.metadata?.old_value != null && log.metadata?.new_value != null;

  return (
    <div
      className={`group px-5 py-4 transition-colors border-b border-gray-50 last:border-b-0 ${
        isSelected ? "bg-blue-50/40" : "hover:bg-gray-50/50"
      }`}
    >
      <div className="flex items-start gap-3.5">
        {/* Selection Checkbox */}
        {onToggleSelect && (
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggleSelect(log.id)}
            className="w-4 h-4 mt-1 rounded border-gray-300 text-[#253C7D] focus:ring-[#253C7D]/30 cursor-pointer shrink-0"
            title="Select log for deletion"
          />
        )}

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Badges & Tags */}
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
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
              {log.action.replace(/_/g, " ")}
            </span>
            <span className="text-xs text-gray-300">·</span>
            <span className="text-xs text-gray-500">{log.entity_type.replace(/_/g, " ")}</span>

            {/* Across-Site BU Tag */}
            {isCrossBu ? (
              <span className="text-[10px] font-bold bg-amber-50 text-amber-900 px-2 py-0.5 rounded-full flex items-center gap-1 border border-amber-200">
                <i className="ri-flashlight-fill text-amber-500 text-[11px]" />
                Across-Site BU: {primaryBu || "Corporate"} ➔ {targetBu || "BU"}
              </span>
            ) : primaryBu ? (
              <span className="text-[10px] font-semibold bg-blue-50 text-[#253C7D] px-2 py-0.5 rounded-full flex items-center gap-1 border border-blue-100/80">
                <i className="ri-building-line text-[10px]" />
                {primaryBu}
              </span>
            ) : null}
          </div>

          {/* Exact User Format: 02 Sep 2026, 14:32 — Reasey changed salary... */}
          <div className="text-sm leading-relaxed text-gray-900">
            <span className="font-semibold text-[#253C7D] whitespace-nowrap">
              {formatAuditTimestamp(log.created_at)}
            </span>
            <span className="text-gray-400 font-bold mx-1.5">—</span>
            <span className="text-gray-800 font-normal">{log.description}</span>
          </div>

          {/* Diff & Reason Chip */}
          {(hasDiff || log.metadata?.reason) && (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {hasDiff && (
                <span className="inline-flex items-center gap-1.5 text-xs bg-emerald-50 text-emerald-900 border border-emerald-200 px-2 py-0.5 rounded font-medium">
                  <i className="ri-exchange-dollar-line text-emerald-600 text-sm" />
                  <span className="line-through text-gray-500">${String(log.metadata.old_value).replace(/^\$/, "")}</span>
                  <i className="ri-arrow-right-line text-emerald-500 text-[10px]" />
                  <span className="font-bold text-emerald-950">${String(log.metadata.new_value).replace(/^\$/, "")}</span>
                </span>
              )}
              {log.metadata?.reason && (
                <span className="text-xs text-amber-900 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded font-medium flex items-center gap-1">
                  <i className="ri-information-line text-amber-600" />
                  Reason: {String(log.metadata.reason)}
                </span>
              )}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-400">
            <span className="text-gray-600 font-medium flex items-center gap-1">
              <i className="ri-user-3-line text-xs text-gray-400" />
              {log.actor_name} &bull; {log.actor_role}
            </span>
            <span>·</span>
            <span>{formatTime(log.created_at)}</span>
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

        {/* Single Item Delete Button */}
        {onDelete && (
          <div className="shrink-0 flex items-center pt-1">
            <button
              type="button"
              onClick={() => onDelete(log)}
              className="opacity-50 group-hover:opacity-100 hover:bg-red-50 text-gray-400 hover:text-red-600 px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer border border-transparent hover:border-red-200"
              title="Delete this audit record"
            >
              <i className="ri-delete-bin-line text-xs" />
              <span className="hidden sm:inline">Delete</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
});
