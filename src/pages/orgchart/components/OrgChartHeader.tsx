import { memo } from "react";
import type { OrgChartViewMode } from "../types";

interface OrgChartHeaderProps {
  employeeCount: number;
  deptCount: number;
  branchName?: string;
  viewMode: OrgChartViewMode;
  setViewMode: (mode: OrgChartViewMode) => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
}

export const OrgChartHeader = memo(function OrgChartHeader({
  employeeCount,
  deptCount,
  branchName,
  viewMode,
  setViewMode,
  onExpandAll,
  onCollapseAll,
}: OrgChartHeaderProps) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
          <span>Organization & Structure</span>
          <i className="ri-arrow-right-s-line text-xs" />
          <span className="text-[#253C7D] font-bold">
            {branchName ? `Branch: ${branchName}` : "Company Hierarchy"}
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2.5">
          Organization Chart
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#253C7D]/10 text-[#253C7D]">
            {employeeCount} Members
          </span>
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">
          Explore reporting chains, team leadership, and department hierarchies across your branch.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        {/* View Mode Switcher */}
        <div className="flex items-center bg-gray-100/80 p-1 rounded-2xl border border-gray-200/60">
          <button
            onClick={() => setViewMode("tree")}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              viewMode === "tree"
                ? "bg-white text-[#253C7D] shadow-xs"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <i className="ri-node-tree text-sm" />
            <span>Tree Chart</span>
          </button>
          <button
            onClick={() => setViewMode("departments")}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              viewMode === "departments"
                ? "bg-white text-[#253C7D] shadow-xs"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <i className="ri-layout-grid-line text-sm" />
            <span>Departments</span>
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              viewMode === "list"
                ? "bg-white text-[#253C7D] shadow-xs"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <i className="ri-list-check text-sm" />
            <span>Directory List</span>
          </button>
        </div>

        {/* Tree Expand / Collapse Controls */}
        {viewMode === "tree" && (
          <div className="flex items-center gap-1.5">
            <button
              onClick={onExpandAll}
              className="px-3.5 py-2 text-xs font-bold text-[#253C7D] bg-blue-50/70 border border-[#253C7D]/20 rounded-xl hover:bg-blue-100 transition-all cursor-pointer"
            >
              <i className="ri-fullscreen-line mr-1" /> Expand All
            </button>
            <button
              onClick={onCollapseAll}
              className="px-3.5 py-2 text-xs font-bold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all cursor-pointer"
            >
              <i className="ri-fullscreen-exit-line mr-1" /> Collapse All
            </button>
          </div>
        )}
      </div>
    </div>
  );
});
