import { memo } from "react";
import { Link } from "react-router-dom";
import type { TreeNode, Employee } from "../../types";
import { DEPT_COLORS } from "../../constants";
import { nodeMatchesFilters, subtreeMatchesFilters } from "../../orgChartUtils";

interface OrgNodeProps {
  node: TreeNode;
  onToggle: (id: string) => void;
  searchTerm: string;
  deptFilter: string;
  onSelectEmployee: (emp: Employee) => void;
}

export const OrgNode = memo(function OrgNode({
  node,
  onToggle,
  searchTerm,
  deptFilter,
  onSelectEmployee,
}: OrgNodeProps) {
  const hasChildren = node.children.length > 0;
  const isMatch = nodeMatchesFilters(node, searchTerm, deptFilter);
  const deptColor = DEPT_COLORS[node.department] || "bg-gray-500";

  if ((searchTerm || deptFilter) && !subtreeMatchesFilters(node, searchTerm, deptFilter)) {
    return null;
  }

  return (
    <div className="flex flex-col items-center">
      {node.depth > 0 && <div className="w-px h-6 bg-gray-200" />}

      {/* Node Card */}
      <div
        className={`relative flex flex-col items-center p-4 rounded-xl border-2 transition-all cursor-pointer min-w-[180px] max-w-[220px] ${
          isMatch && searchTerm
            ? "border-[#253C7D] bg-[#253C7D]/5 scale-105"
            : "border-gray-200 bg-white hover:border-gray-300"
        }`}
        onClick={() => {
          onSelectEmployee(node);
          if (hasChildren) onToggle(node.id);
        }}
      >
        <div className={`absolute top-0 left-0 right-0 h-1 ${deptColor} rounded-t-xl`} />

        <Link
          to={`/employees/${node.id}`}
          className="flex flex-col items-center w-full"
          onClick={(e) => e.stopPropagation()}
        >
          {node.avatar_url ? (
            <img
              src={node.avatar_url}
              alt=""
              className="w-12 h-12 rounded-full object-cover border-2 border-white mt-1 mb-2"
            />
          ) : (
            <div className={`w-12 h-12 rounded-full ${deptColor} flex items-center justify-center text-white font-bold text-sm mt-1 mb-2`}>
              {node.first_name?.[0]}
              {node.last_name?.[0]}
            </div>
          )}
          <p className="text-[13px] font-bold text-gray-900 text-center leading-tight hover:text-[#253C7D] transition-colors">
            {node.first_name} {node.last_name}
          </p>
        </Link>

        <p className="text-[11px] text-gray-500 text-center mt-0.5">{node.role}</p>

        <span className={`mt-2 text-[10px] font-semibold px-2 py-0.5 rounded-full text-white ${deptColor}`}>
          {node.department}
        </span>

        {node.branches?.name && (
          <p className="text-[10px] text-gray-400 mt-1">{node.branches.name}</p>
        )}

        <div className="flex items-center gap-1 mt-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${node.status === "active" ? "bg-green-500" : "bg-amber-500"}`} />
          <span className="text-[10px] text-gray-400 capitalize">{node.status}</span>
        </div>

        {/* Expand / Collapse Chevron */}
        {hasChildren && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggle(node.id);
            }}
            className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <i
              className={`ri-arrow-down-s-line text-gray-500 text-sm transition-transform ${
                node.expanded ? "rotate-180" : ""
              }`}
            />
          </button>
        )}
      </div>

      {/* Children Subtree */}
      {node.expanded && hasChildren && (
        <div className="mt-6">
          <div className="w-px h-4 bg-gray-200 mx-auto" />
          {node.children.length > 1 && (
            <div className="relative flex gap-6">
              <div
                className="absolute top-0 left-1/2 h-px bg-gray-200"
                style={{
                  width: `${(node.children.length - 1) * 224}px`,
                  transform: "translateX(-50%)",
                }}
              />
              {node.children.map((child) => (
                <OrgNode
                  key={child.id}
                  node={child}
                  onToggle={onToggle}
                  searchTerm={searchTerm}
                  deptFilter={deptFilter}
                  onSelectEmployee={onSelectEmployee}
                />
              ))}
            </div>
          )}
          {node.children.length === 1 && (
            <OrgNode
              node={node.children[0]}
              onToggle={onToggle}
              searchTerm={searchTerm}
              deptFilter={deptFilter}
              onSelectEmployee={onSelectEmployee}
            />
          )}
        </div>
      )}
    </div>
  );
});
