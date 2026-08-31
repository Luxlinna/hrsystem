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
  const directReportsCount = node.children.length;
  const hasChildren = directReportsCount > 0;
  const isMatch = nodeMatchesFilters(node, searchTerm, deptFilter);
  const deptColor = DEPT_COLORS[node.department] || "bg-[#253C7D]";

  const isExecutive = /ceo|chairman|chairwoman|president|director|founder/i.test(node.role);
  const isManager = /manager|lead|head|supervisor/i.test(node.role);

  if ((searchTerm || deptFilter) && !subtreeMatchesFilters(node, searchTerm, deptFilter)) {
    return null;
  }

  return (
    <div className="flex flex-col items-center">
      {/* Connector line coming from above */}
      {node.depth > 0 && <div className="w-0.5 h-6 bg-gray-300 dark:bg-gray-700" />}

      {/* Node Card */}
      <div
        onClick={() => {
          onSelectEmployee(node);
        }}
        className={`group relative flex flex-col items-center p-4 rounded-2xl border transition-all duration-200 cursor-pointer min-w-[216px] max-w-[236px] shadow-xs hover:shadow-lg hover:-translate-y-0.5 ${
          isMatch && searchTerm
            ? "border-[#253C7D] bg-blue-50/80 ring-4 ring-[#253C7D]/15 scale-105"
            : isExecutive
            ? "border-[#253C7D]/40 bg-gradient-to-b from-blue-50/30 to-white hover:border-[#253C7D]"
            : isManager
            ? "border-amber-300/80 bg-gradient-to-b from-amber-50/20 to-white hover:border-amber-400"
            : "border-gray-200/90 bg-white hover:border-gray-300"
        }`}
      >
        {/* Top Department Accent Bar */}
        <div className={`absolute top-0 left-0 right-0 h-1.5 ${deptColor} rounded-t-2xl shadow-2xs`} />

        {/* Level Tag (Executive / Manager) */}
        {isExecutive ? (
          <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider bg-blue-100/90 text-[#253C7D] border border-blue-200/60 shadow-2xs">
            Executive
          </span>
        ) : isManager ? (
          <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-lg text-[9px] font-extrabold uppercase tracking-wider bg-amber-100/90 text-amber-800 border border-amber-200/60 shadow-2xs">
            Lead
          </span>
        ) : null}

        {/* Avatar & Info */}
        <Link
          to={`/employees/${node.id}`}
          className="flex flex-col items-center w-full mt-1.5"
          onClick={(e) => e.stopPropagation()}
        >
          {node.avatar_url ? (
            <img
              src={node.avatar_url}
              alt=""
              className="w-13 h-13 rounded-2xl object-cover border-2 border-white shadow-sm mb-2 group-hover:scale-105 transition-transform"
            />
          ) : (
            <div
              className={`w-13 h-13 rounded-2xl ${deptColor} flex items-center justify-center text-white font-black text-sm shadow-sm mb-2 group-hover:scale-105 transition-transform`}
            >
              {node.first_name?.[0]}
              {node.last_name?.[0]}
            </div>
          )}

          <p className="text-xs font-bold text-gray-900 text-center leading-tight hover:text-[#253C7D] transition-colors truncate w-full">
            {node.first_name} {node.last_name}
          </p>
        </Link>

        {/* Role */}
        <p className="text-[11px] text-gray-500 font-medium text-center mt-0.5 line-clamp-1">
          {node.role}
        </p>

        {/* Department Badge */}
        <div className="flex items-center gap-1.5 mt-2 flex-wrap justify-center">
          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full text-white ${deptColor} shadow-2xs`}>
            {node.department}
          </span>
        </div>

        {/* Branch / Status Row */}
        <div className="flex items-center justify-between w-full mt-2.5 pt-2 border-t border-gray-100 text-[10px] text-gray-400">
          <span className="truncate max-w-[110px] font-medium text-gray-500 flex items-center gap-1">
            <i className="ri-building-line text-xs text-gray-400" />
            {node.branches?.name || "Branch Staff"}
          </span>
          <div className="flex items-center gap-1">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                node.status === "active" ? "bg-emerald-500" : "bg-amber-500"
              }`}
            />
            <span className="capitalize font-semibold text-gray-600">{node.status}</span>
          </div>
        </div>

        {/* Expand / Collapse Subordinates Button */}
        {hasChildren && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggle(node.id);
            }}
            className={`absolute -bottom-3.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-extrabold border flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95 ${
              node.expanded
                ? "bg-white text-gray-700 border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                : "bg-[#253C7D] text-white border-[#253C7D] hover:bg-[#1E3066]"
            }`}
            title={node.expanded ? "Collapse team" : `Expand ${directReportsCount} direct reports`}
          >
            <i
              className={`ri-arrow-down-s-line text-xs transition-transform ${
                node.expanded ? "rotate-180" : ""
              }`}
            />
            <span>{node.expanded ? `${directReportsCount} reports` : `+${directReportsCount} reports`}</span>
          </button>
        )}
      </div>

      {/* Children Subtree with branch lines */}
      {node.expanded && hasChildren && (
        <div className="mt-7 flex flex-col items-center">
          {/* Vertical stem from parent */}
          <div className="w-0.5 h-5 bg-gray-300 dark:bg-gray-700" />

          {directReportsCount > 1 ? (
            <div className="relative flex gap-8 pt-0">
              {/* Horizontal Connecting Crossbar */}
              <div
                className="absolute top-0 left-4 right-4 h-0.5 bg-gray-300 dark:bg-gray-700"
                style={{
                  left: "calc(110px)",
                  right: "calc(110px)",
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
          ) : (
            <div className="pt-0">
              <OrgNode
                node={node.children[0]}
                onToggle={onToggle}
                searchTerm={searchTerm}
                deptFilter={deptFilter}
                onSelectEmployee={onSelectEmployee}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
});
