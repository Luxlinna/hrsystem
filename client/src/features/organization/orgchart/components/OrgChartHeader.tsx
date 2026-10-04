import { memo } from "react";
import type { OrgChartViewMode, Employee } from "../types";
import { OrgChartExportMenu } from "./OrgChartExportMenu";

interface OrgChartHeaderProps {
  employeeCount: number;
  deptCount: number;
  branchName?: string;
  viewMode: OrgChartViewMode;
  setViewMode: (mode: OrgChartViewMode) => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
  hasExpandableNodes?: boolean;
  employees?: Employee[];
}

export const OrgChartHeader = memo(function OrgChartHeader({
  employeeCount,
  deptCount,
  branchName,
  viewMode,
  setViewMode,
  onExpandAll,
  onCollapseAll,
  hasExpandableNodes = false,
  employees = [],
}: OrgChartHeaderProps) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 dark:text-slate-400 uppercase tracking-wider mb-1">
          <span>Organization & Structure</span>
          <i className="ri-arrow-right-s-line text-xs" />
          <span className="text-[#253C7D] dark:text-sky-400 font-bold">
            {branchName ? `Branch: ${branchName}` : "Company Hierarchy"}
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-slate-100 tracking-tight flex items-center gap-2.5">
          Organization Chart
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#253C7D]/10 dark:bg-blue-950/60 text-[#253C7D] dark:text-blue-300 border border-transparent dark:border-blue-800/60">
            {employeeCount} Members
          </span>
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 mt-1">
          Explore reporting chains, team leadership, and department hierarchies across your branch.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        {/* View Mode Switcher */}
        <div className="flex items-center bg-gray-100/80 dark:bg-slate-800/80 p-1 rounded-2xl border border-gray-200/60 dark:border-slate-700">
          <button
            onClick={() => setViewMode("tree")}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              viewMode === "tree"
                ? "bg-white dark:bg-slate-900 text-[#253C7D] dark:text-sky-300 shadow-xs"
                : "text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200"
            }`}
          >
            <i className="ri-node-tree text-sm" />
            <span>Tree Chart</span>
          </button>
          <button
            onClick={() => setViewMode("departments")}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              viewMode === "departments"
                ? "bg-white dark:bg-slate-900 text-[#253C7D] dark:text-sky-300 shadow-xs"
                : "text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200"
            }`}
          >
            <i className="ri-layout-grid-line text-sm" />
            <span>Departments</span>
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              viewMode === "list"
                ? "bg-white dark:bg-slate-900 text-[#253C7D] dark:text-sky-300 shadow-xs"
                : "text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200"
            }`}
          >
            <i className="ri-list-check text-sm" />
            <span>Directory List</span>
          </button>
        </div>

        {/* Export Menu */}
        <OrgChartExportMenu
          employees={employees}
          branchName={branchName}
        />

        {/* Tree Expand / Collapse Controls */}
        {viewMode === "tree" && (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onExpandAll}
              title="Expand all reporting branches"
              className="px-3.5 py-2 text-xs font-bold text-[#253C7D] dark:text-sky-300 bg-blue-50/70 dark:bg-blue-950/50 border border-[#253C7D]/20 dark:border-blue-800/60 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/40 active:scale-95 transition-all cursor-pointer shadow-2xs"
            >
              <i className="ri-fullscreen-line mr-1" /> Expand All
            </button>
            <button
              type="button"
              onClick={onCollapseAll}
              title="Collapse all reporting branches"
              className="px-3.5 py-2 text-xs font-bold text-gray-600 dark:text-slate-300 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700 active:scale-95 transition-all cursor-pointer shadow-2xs"
            >
              <i className="ri-fullscreen-exit-line mr-1" /> Collapse All
            </button>
          </div>
        )}
      </div>
    </div>
  );
});
