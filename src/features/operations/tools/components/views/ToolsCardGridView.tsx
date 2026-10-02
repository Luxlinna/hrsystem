import { memo } from "react";
import type { Tool, ToolAssignment, ToolUsage } from "../../types";
import { ToolCard } from "./ToolCard";

interface ToolsCardGridViewProps {
  tools: Tool[];
  assignments: ToolAssignment[];
  usages: ToolUsage[];
  canManage: boolean;
  onSelect: (t: Tool) => void;
  onOpenAssign: (t: Tool) => void;
  onToggleStatus: (t: Tool) => void;
}

export const ToolsCardGridView = memo(function ToolsCardGridView({
  tools,
  assignments,
  usages,
  canManage,
  onSelect,
  onOpenAssign,
  onToggleStatus,
}: ToolsCardGridViewProps) {
  if (tools.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-2xs">
        <i className="ri-tools-line text-4xl text-gray-300 mb-2" />
        <p className="text-sm font-semibold text-gray-700">No tools match your filter</p>
        <p className="text-xs text-gray-400 mt-1">Try selecting a different category or clearing your search.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {tools.map((tool) => (
        <ToolCard
          key={tool.id}
          tool={tool}
          assignments={assignments}
          usages={usages}
          canManage={canManage}
          onSelect={onSelect}
          onOpenAssign={onOpenAssign}
          onToggleStatus={onToggleStatus}
        />
      ))}
    </div>
  );
});
