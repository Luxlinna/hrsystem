import React, { useState, useRef, useEffect } from "react";
import type { EmployeeMovement } from "../types";
import { MovementsTableRow } from "./MovementsTableRow";

interface MovementsTableViewProps {
  movements: EmployeeMovement[];
  selectedIds?: Set<string>;
  selectAll?: boolean;
  showSalary?: boolean;
  onSelectAll?: () => void;
  onSelectOne?: (id: string) => void;
  onSelectMovement: (movement: EmployeeMovement) => void;
  onEditMovement?: (movement: EmployeeMovement) => void;
  onDeleteMovement?: (movement: EmployeeMovement) => void;
}

export const MovementsTableView: React.FC<MovementsTableViewProps> = ({
  movements,
  selectedIds = new Set(),
  selectAll = false,
  showSalary = false,
  onSelectAll,
  onSelectOne,
  onSelectMovement,
  onEditMovement,
  onDeleteMovement,
}) => {
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

  if (movements.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-none p-16 text-center shadow-xs">
        <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-slate-700 text-slate-400 flex items-center justify-center mx-auto mb-3">
          <i className="ri-route-line text-2xl" />
        </div>
        <h3 className="text-sm font-semibold text-slate-800 dark:text-white">No Change Status Records Found</h3>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-sm mx-auto">
          No employee career changes match your current filters.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
      <table className="w-full text-left text-xs border-collapse">
        <thead className="bg-white dark:bg-slate-800/60 border-b border-slate-200/90 dark:border-slate-700/60 text-slate-700 dark:text-slate-200 font-semibold">
          <tr>
            <th className="py-2.5 px-3 w-10 text-center">
              <input
                type="checkbox"
                checked={selectAll}
                onChange={onSelectAll}
                className="w-3.5 h-3.5 rounded border-slate-300 dark:border-slate-600 text-[#253C7D] focus:ring-[#253C7D] cursor-pointer"
              />
            </th>
            <th className="py-2.5 px-2 w-12 text-center text-slate-500 dark:text-slate-400 font-medium">No.</th>
            <th className="py-2.5 px-3 min-w-[130px] select-none">Effective Date</th>
            <th className="py-2.5 px-3 min-w-[140px] select-none">Status Type</th>
            <th className="py-2.5 px-3 min-w-[180px] select-none">Employee</th>
            <th className="py-2.5 px-3 min-w-[140px] select-none">Position</th>
            <th className="py-2.5 px-3 min-w-[130px] select-none">Division</th>
            <th className="py-2.5 px-3 min-w-[150px] select-none">Department</th>
            <th className="py-2.5 px-3 min-w-[120px] select-none">Joining Date</th>
            <th className="py-2.5 px-3 min-w-[150px] select-none">Contract</th>
            <th className="py-2.5 px-3 min-w-[120px] select-none">Rate</th>
            <th className="py-2.5 px-3 min-w-[100px] select-none">Status</th>
            <th className="py-2.5 px-3 text-center w-14">
              <i className="ri-settings-3-line text-slate-400 text-sm" />
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {movements.map((m, index) => (
            <MovementsTableRow
              key={m.id}
              movement={m}
              index={index}
              isSelected={selectedIds.has(m.id)}
              showSalary={showSalary}
              openDropdownId={openDropdownId}
              actionRef={actionRef}
              onSelectOne={onSelectOne}
              onToggleDropdown={(id) => setOpenDropdownId(openDropdownId === id ? null : id)}
              onSelectMovement={onSelectMovement}
              onEditMovement={onEditMovement}
              onDeleteMovement={onDeleteMovement}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};
