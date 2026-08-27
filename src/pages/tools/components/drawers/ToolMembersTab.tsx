import { memo, useState, useMemo } from "react";
import type { ToolAssignment } from "../../types";
import { initials, formatDate } from "../../toolsUtils";

interface ToolMembersTabProps {
  toolId: number;
  toolName: string;
  assignments: ToolAssignment[];
  canManage: boolean;
  onRevokeAccess: (assignmentId: number, empName: string, toolName: string) => void;
}

export const ToolMembersTab = memo(function ToolMembersTab({
  toolId,
  toolName,
  assignments,
  canManage,
  onRevokeAccess,
}: ToolMembersTabProps) {
  const [search, setSearch] = useState("");

  const toolAssignments = useMemo(() => {
    return assignments
      .filter((a) => a.tool_id === toolId)
      .filter((a) => {
        if (!search.trim()) return true;
        const q = search.toLowerCase().trim();
        const name = `${a.employees?.first_name || ""} ${a.employees?.last_name || ""}`.toLowerCase();
        const dept = (a.employees?.department || "").toLowerCase();
        return name.includes(q) || dept.includes(q);
      });
  }, [assignments, toolId, search]);

  return (
    <div className="space-y-3">
      <div className="relative">
        <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter assigned members..."
          className="w-full pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#253C7D]"
        />
      </div>

      {toolAssignments.length === 0 ? (
        <div className="text-center py-8 text-gray-400 text-xs">
          No members assigned to this tool yet.
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {toolAssignments.map((a) => {
            const emp = a.employees;
            const empName = emp ? `${emp.first_name} ${emp.last_name}` : "Unknown";

            return (
              <div
                key={a.id}
                className="py-2.5 flex items-center justify-between gap-2 text-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {emp?.avatar_url ? (
                    <img
                      src={emp.avatar_url}
                      alt={empName}
                      className="w-7 h-7 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-[#253C7D] text-white text-[9px] font-bold flex items-center justify-center shrink-0">
                      {initials(emp?.first_name, emp?.last_name)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{empName}</p>
                    <p className="text-[10px] text-gray-400 truncate">
                      {emp?.department || "No Dept"} &middot; Granted {formatDate(a.assigned_at)}
                    </p>
                  </div>
                </div>

                {canManage && (
                  <button
                    onClick={() => onRevokeAccess(a.id, empName, toolName)}
                    className="px-2 py-1 text-[11px] font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer shrink-0"
                  >
                    Revoke
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
});
