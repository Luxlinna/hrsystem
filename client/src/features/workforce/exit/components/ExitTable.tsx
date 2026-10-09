import { memo, useState, useRef, useEffect } from "react";
import type { EmployeeExit } from "../types";
import { ExitTableRow } from "./ExitTableRow";

interface ExitTableProps {
  exits: EmployeeExit[];
  loading: boolean;
  showSalary?: boolean;
  canManage?: boolean;
  canCreateExit?: boolean;
  onEdit: (exit: EmployeeExit) => void;
  onDelete: (id: string) => void;
  onRecord: () => void;
  onView?: (exit: EmployeeExit) => void;
  onInterview?: (exit: EmployeeExit) => void;
}

export const ExitTable = memo(function ExitTable({
  exits,
  loading,
  showSalary = false,
  canManage = false,
  canCreateExit = false,
  onEdit,
  onDelete,
  onRecord,
  onView = () => {},
  onInterview,
}: ExitTableProps) {
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const actionRef = useRef<HTMLTableCellElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (actionRef.current && !actionRef.current.contains(e.target as Node)) {
        setOpenDropdownId(null);
      }
    };
    if (openDropdownId) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openDropdownId]);

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-2">
          <div className="w-6 h-6 border-2 border-[#253C7D] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-400">Loading exit records…</p>
        </div>
      </div>
    );
  }

  if (exits.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-16 text-center shadow-xs">
        <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-700 text-slate-400 flex items-center justify-center mx-auto mb-3">
          <i className="ri-logout-box-r-line text-2xl" />
        </div>
        <h3 className="text-sm font-semibold text-slate-800 dark:text-white">No Exit Records Found</h3>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-sm mx-auto">
          No employee departures match your current filters.
        </p>
        {(canManage || canCreateExit) && (
          <button
            onClick={onRecord}
            className="mt-4 px-4 py-2 bg-[#253C7D] hover:bg-[#1E3066] text-white text-xs font-semibold rounded-sm transition-colors cursor-pointer"
          >
            Create First Exit
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
      <table className="w-full text-left text-xs border-collapse">
        <thead className="bg-white dark:bg-slate-800/60 border-b border-slate-200/90 dark:border-slate-700/60 text-slate-700 dark:text-slate-200 font-semibold">
          <tr>
            <th className="py-2.5 px-2 w-12 text-center text-slate-500 dark:text-slate-400 font-medium">No.</th>
            <th className="py-2.5 px-3 min-w-[120px] select-none">Effective Date</th>
            <th className="py-2.5 px-3 min-w-[120px] select-none">Exit Type</th>
            <th className="py-2.5 px-3 min-w-[180px] select-none">Employee</th>
            <th className="py-2.5 px-3 min-w-[140px] select-none">Position</th>
            <th className="py-2.5 px-3 min-w-[120px] select-none">Division</th>
            <th className="py-2.5 px-3 min-w-[150px] select-none">Department</th>
            <th className="py-2.5 px-3 min-w-[150px] select-none">Contract Type</th>
            <th className="py-2.5 px-3 min-w-[120px] select-none">Rate</th>
            <th className="py-2.5 px-3 min-w-[160px] select-none">Reason</th>
            <th className="py-2.5 px-3 min-w-[80px] select-none">Pay Info</th>
            <th className="py-2.5 px-3 min-w-[90px] select-none">Status</th>
            <th className="py-2.5 px-3 text-center w-14">
              <i className="ri-settings-3-line text-slate-400 text-sm" />
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {exits.map((ex, index) => (
            <ExitTableRow
              key={ex.id}
              exitItem={ex}
              index={index}
              showSalary={showSalary}
              canManage={canManage}
              openDropdownId={openDropdownId}
              actionRef={actionRef}
              onToggleDropdown={(id) => setOpenDropdownId(openDropdownId === id ? null : id)}
              onView={onView}
              onEdit={onEdit}
              onDelete={onDelete}
              onInterview={onInterview}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
});

