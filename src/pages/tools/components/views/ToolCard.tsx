import { memo } from "react";
import { Link } from "react-router-dom";
import type { Tool, ToolAssignment, ToolUsage } from "../../types";
import { TOOL_ROUTES, CATEGORY_STYLES } from "../../constants";

interface ToolCardProps {
  tool: Tool;
  assignments: ToolAssignment[];
  usages: ToolUsage[];
  canManage: boolean;
  onSelect: (t: Tool) => void;
  onOpenAssign: (t: Tool) => void;
  onToggleStatus: (t: Tool) => void;
}

export const ToolCard = memo(function ToolCard({
  tool,
  assignments,
  usages,
  canManage,
  onSelect,
  onOpenAssign,
  onToggleStatus,
}: ToolCardProps) {
  const catStyle =
    CATEGORY_STYLES[tool.category] || CATEGORY_STYLES.Productivity;
  const assignedCount = assignments.filter((a) => a.tool_id === tool.id).length;
  const usageCount = usages.filter((u) => u.tool_id === tool.id).length;
  const route = TOOL_ROUTES[tool.name] || "/";

  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-2xs hover:shadow-md hover:border-gray-200 transition-all flex flex-col justify-between group">
      <div>
        {/* Top: Icon, Category & Status */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#253C7D]/10 text-[#253C7D] flex items-center justify-center text-xl shrink-0 group-hover:scale-105 transition-transform">
              <i className={tool.icon || "ri-tools-line"} />
            </div>
            <div>
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold ${catStyle.bg} ${catStyle.color} border ${catStyle.border}`}
              >
                <i className={catStyle.icon} />
                {catStyle.label}
              </span>
            </div>
          </div>

          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
              tool.status === "active"
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                : "bg-gray-100 text-gray-600 border border-gray-200/60"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                tool.status === "active" ? "bg-emerald-500" : "bg-gray-400"
              }`}
            />
            {tool.status}
          </span>
        </div>

        {/* Title & Description */}
        <h3 className="text-sm font-bold text-gray-900 leading-snug group-hover:text-[#253C7D] transition-colors">
          {tool.name}
        </h3>
        <p className="text-xs text-gray-500 line-clamp-2 mt-1 leading-relaxed">
          {tool.description}
        </p>
      </div>

      {/* Metrics & Actions */}
      <div className="pt-4 mt-4 border-t border-gray-50 space-y-3">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <button
            onClick={() => onSelect(tool)}
            className="hover:text-[#253C7D] font-medium flex items-center gap-1 cursor-pointer transition-colors"
          >
            <i className="ri-team-line" />
            <span>{assignedCount} staff</span>
          </button>
          <span className="text-[11px] text-gray-400">{usageCount} events</span>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to={route}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-[#253C7D] text-white rounded-xl text-xs font-semibold hover:bg-[#1F336A] transition-colors shadow-2xs"
          >
            <span>Launch Tool</span>
            <i className="ri-arrow-right-line text-xs" />
          </Link>

          {canManage && (
            <button
              onClick={() => onOpenAssign(tool)}
              title="Grant access to staff"
              className="p-2 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 cursor-pointer transition-colors"
            >
              <i className="ri-user-add-line" />
            </button>
          )}

          <button
            onClick={() => onSelect(tool)}
            title="Inspect permissions & history"
            className="p-2 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 cursor-pointer transition-colors"
          >
            <i className="ri-information-line" />
          </button>
        </div>
      </div>
    </div>
  );
});
