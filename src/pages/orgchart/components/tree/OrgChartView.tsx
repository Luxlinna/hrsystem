import { memo } from "react";
import type { TreeNode, Employee } from "../../types";
import { OrgNode } from "./OrgNode";

interface OrgChartViewProps {
  tree: TreeNode[];
  searchTerm: string;
  deptFilter: string;
  onToggleNode: (id: string) => void;
  onSelectEmployee: (emp: Employee) => void;
}

export const OrgChartView = memo(function OrgChartView({
  tree,
  searchTerm,
  deptFilter,
  onToggleNode,
  onSelectEmployee,
}: OrgChartViewProps) {
  if (tree.length === 0) {
    return (
      <div className="text-center py-16">
        <i className="ri-team-line text-4xl text-gray-300 mb-3 block" />
        <p className="text-[14px] text-gray-400">
          No employees found. Add employees to build the org chart.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto pb-8">
      <div className="min-w-max mx-auto flex justify-center">
        <div className="flex gap-10">
          {tree.map((node) => (
            <OrgNode
              key={node.id}
              node={node}
              onToggle={onToggleNode}
              searchTerm={searchTerm}
              deptFilter={deptFilter}
              onSelectEmployee={onSelectEmployee}
            />
          ))}
        </div>
      </div>
    </div>
  );
});
