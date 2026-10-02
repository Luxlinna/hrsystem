import { memo, useState } from "react";
import { Link } from "react-router-dom";
import type { Tool, ToolAssignment, ToolUsage } from "../../types";
import { TOOL_ROUTES, CATEGORY_STYLES } from "../../constants";
import { ToolMembersTab } from "./ToolMembersTab";
import { ToolActivityTab } from "./ToolActivityTab";

interface ToolDetailDrawerProps {
  tool: Tool | null;
  assignments: ToolAssignment[];
  usages: ToolUsage[];
  canManage: boolean;
  onClose: () => void;
  onOpenAssign: (t: Tool) => void;
  onToggleStatus: (t: Tool) => void;
  onRevokeAccess: (assignmentId: number, empName: string, toolName: string) => void;
}

export const ToolDetailDrawer = memo(function ToolDetailDrawer({
  tool,
  assignments,
  usages,
  canManage,
  onClose,
  onOpenAssign,
  onToggleStatus,
  onRevokeAccess,
}: ToolDetailDrawerProps) {
  const [drawerTab, setDrawerTab] = useState<"members" | "activity">("members");

  if (!tool) return null;

  const catStyle = CATEGORY_STYLES[tool.category] || CATEGORY_STYLES.Productivity;
  const route = TOOL_ROUTES[tool.name] || "/";
  const assignedCount = assignments.filter((a) => a.tool_id === tool.id).length;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-slate-950/40 backdrop-blur-xs animate-in fade-in duration-100"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-gray-100 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#253C7D]/10 text-[#253C7D] flex items-center justify-center text-xl shrink-0">
              <i className={tool.icon || "ri-tools-line"} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-gray-900 leading-tight">{tool.name}</h2>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                    tool.status === "active"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                      : "bg-gray-100 text-gray-600 border border-gray-200/60"
                  }`}
                >
                  {tool.status}
                </span>
              </div>
              <span
                className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold mt-1 ${catStyle.bg} ${catStyle.color}`}
              >
                <i className={catStyle.icon} />
                {catStyle.label}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 cursor-pointer"
          >
            <i className="ri-close-line text-lg" />
          </button>
        </div>

        {/* Description & Action Bar */}
        <div className="p-5 border-b border-gray-100 bg-gray-50/50 space-y-3">
          <p className="text-xs text-gray-600 leading-relaxed">{tool.description}</p>
          <div className="flex items-center gap-2">
            <Link
              to={route}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-[#253C7D] text-white rounded-xl text-xs font-semibold hover:bg-[#1F336A] transition-colors"
            >
              <span>Launch Tool</span>
              <i className="ri-arrow-right-line text-xs" />
            </Link>
            {canManage && (
              <>
                <button
                  onClick={() => onOpenAssign(tool)}
                  className="px-3 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl text-xs font-semibold hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  + Grant Access
                </button>
                <button
                  onClick={() => onToggleStatus(tool)}
                  className="px-3 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl text-xs font-semibold hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  {tool.status === "active" ? "Deactivate" : "Activate"}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center border-b border-gray-100 px-5">
          <button
            onClick={() => setDrawerTab("members")}
            className={`py-3 px-3 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
              drawerTab === "members"
                ? "border-[#253C7D] text-[#253C7D]"
                : "border-transparent text-gray-400 hover:text-gray-700"
            }`}
          >
            Assigned Staff ({assignedCount})
          </button>
          <button
            onClick={() => setDrawerTab("activity")}
            className={`py-3 px-3 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
              drawerTab === "activity"
                ? "border-[#253C7D] text-[#253C7D]"
                : "border-transparent text-gray-400 hover:text-gray-700"
            }`}
          >
            Usage History
          </button>
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto p-5">
          {drawerTab === "members" ? (
            <ToolMembersTab
              toolId={tool.id}
              toolName={tool.name}
              assignments={assignments}
              canManage={canManage}
              onRevokeAccess={onRevokeAccess}
            />
          ) : (
            <ToolActivityTab toolId={tool.id} usages={usages} />
          )}
        </div>
      </div>
    </div>
  );
});
