import { memo } from "react";
import type { ToolsTab } from "../types";

interface ToolsHeaderProps {
  tab: ToolsTab;
  setTab: (t: ToolsTab) => void;
  activeTools: number;
  totalAssignments: number;
  totalUsages: number;
  avgUsagePerTool: number;
}

export const ToolsHeader = memo(function ToolsHeader({
  tab,
  setTab,
  activeTools,
  totalAssignments,
  totalUsages,
  avgUsagePerTool,
}: ToolsHeaderProps) {
  return (
    <div className="mb-6 space-y-5">
      {/* Title & Subtitle */}
      <div>
        <h1
          className="text-2xl font-bold text-gray-900"
        >
          Tools &amp; Workspace Integrations
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Provision, audit, and manage role-based permissions for internal workforce tools
        </p>
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-2xs">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Active Tools
          </p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{activeTools}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-2xs">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Active Assignments
          </p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{totalAssignments}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-2xs">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Total Invocations
          </p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{totalUsages}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-2xs">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Avg Usage / Tool
          </p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{avgUsagePerTool}</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1 border-b border-gray-200">
        {[
          { id: "tools" as const, label: "Tools Catalog", icon: "ri-apps-2-line" },
          { id: "access" as const, label: "Access Permissions Matrix", icon: "ri-shield-user-line" },
          { id: "activity" as const, label: "Live Activity Audit", icon: "ri-history-line" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
              tab === t.id
                ? "border-[#253C7D] text-[#253C7D]"
                : "border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300"
            }`}
          >
            <i className={t.icon} />
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
});
