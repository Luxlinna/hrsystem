import { memo } from "react";

interface OrgChartHeaderProps {
  employeeCount: number;
  deptCount: number;
  viewMode: "tree" | "list";
  setViewMode: (mode: "tree" | "list") => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
}

export const OrgChartHeader = memo(function OrgChartHeader({
  employeeCount,
  deptCount,
  viewMode,
  setViewMode,
  onExpandAll,
  onCollapseAll,
}: OrgChartHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-[#1A1A1A]">Organization Chart</h1>
        <p className="text-[13px] text-gray-500 mt-1">
          {employeeCount} employees &middot; {deptCount} departments
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
          <button
            onClick={() => setViewMode("tree")}
            className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-colors whitespace-nowrap cursor-pointer ${
              viewMode === "tree" ? "bg-white text-[#253C7D] shadow-2xs" : "text-gray-500 hover:text-gray-900"
            }`}
          >
            <i className="ri-node-tree mr-1" />
            Tree
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-colors whitespace-nowrap cursor-pointer ${
              viewMode === "list" ? "bg-white text-[#253C7D] shadow-2xs" : "text-gray-500 hover:text-gray-900"
            }`}
          >
            <i className="ri-list-check mr-1" />
            List
          </button>
        </div>

        {viewMode === "tree" && (
          <>
            <button
              onClick={onExpandAll}
              className="px-3 py-2 text-[12px] font-semibold text-[#253C7D] border border-[#253C7D]/20 rounded-lg hover:bg-[#253C7D]/5 transition-colors whitespace-nowrap cursor-pointer"
            >
              Expand All
            </button>
            <button
              onClick={onCollapseAll}
              className="px-3 py-2 text-[12px] font-semibold text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap cursor-pointer"
            >
              Collapse
            </button>
          </>
        )}
      </div>
    </div>
  );
});
