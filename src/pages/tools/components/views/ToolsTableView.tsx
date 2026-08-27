import { memo } from "react";
import { Link } from "react-router-dom";
import type { Tool, ToolAssignment, ToolUsage } from "../../types";
import { TOOL_ROUTES, CATEGORY_STYLES } from "../../constants";

interface ToolsTableViewProps {
  tools: Tool[];
  assignments: ToolAssignment[];
  usages: ToolUsage[];
  canManage: boolean;
  onSelect: (t: Tool) => void;
  onOpenAssign: (t: Tool) => void;
  onToggleStatus: (t: Tool) => void;
}

export const ToolsTableView = memo(function ToolsTableView({
  tools,
  assignments,
  usages,
  canManage,
  onSelect,
  onOpenAssign,
  onToggleStatus,
}: ToolsTableViewProps) {
  if (tools.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-2xs">
        <i className="ri-tools-line text-4xl text-gray-300 mb-2" />
        <p className="text-sm font-semibold text-gray-700">No tools match your filter</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-2xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-gray-50/80 border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider text-[10px]">
              <th className="px-4 py-3">Tool</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Assigned Staff</th>
              <th className="px-4 py-3">Usage Events</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {tools.map((tool) => {
              const catStyle = CATEGORY_STYLES[tool.category] || CATEGORY_STYLES.Productivity;
              const assignedCount = assignments.filter((a) => a.tool_id === tool.id).length;
              const usageCount = usages.filter((u) => u.tool_id === tool.id).length;
              const route = TOOL_ROUTES[tool.name] || "/";

              return (
                <tr key={tool.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-[#253C7D]/10 text-[#253C7D] flex items-center justify-center text-base shrink-0">
                        <i className={tool.icon || "ri-tools-line"} />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{tool.name}</p>
                        <p className="text-[11px] text-gray-400 truncate max-w-xs">{tool.description}</p>
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-3 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold ${catStyle.bg} ${catStyle.color} border ${catStyle.border}`}
                    >
                      <i className={catStyle.icon} />
                      {catStyle.label}
                    </span>
                  </td>

                  <td className="px-4 py-3 whitespace-nowrap">
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
                  </td>

                  <td className="px-4 py-3 whitespace-nowrap">
                    <button
                      onClick={() => onSelect(tool)}
                      className="font-medium text-gray-700 hover:text-[#253C7D] cursor-pointer"
                    >
                      {assignedCount} members
                    </button>
                  </td>

                  <td className="px-4 py-3 whitespace-nowrap text-gray-500">
                    {usageCount} invocations
                  </td>

                  <td className="px-4 py-3 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Link
                        to={route}
                        className="px-2.5 py-1 bg-[#253C7D] text-white rounded-lg font-semibold hover:bg-[#1F336A] transition-colors"
                      >
                        Launch
                      </Link>
                      {canManage && (
                        <button
                          onClick={() => onOpenAssign(tool)}
                          title="Grant access"
                          className="p-1 text-gray-400 hover:text-[#253C7D] hover:bg-gray-100 rounded-lg cursor-pointer"
                        >
                          <i className="ri-user-add-line text-sm" />
                        </button>
                      )}
                      <button
                        onClick={() => onSelect(tool)}
                        title="Details"
                        className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg cursor-pointer"
                      >
                        <i className="ri-information-line text-sm" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
});
