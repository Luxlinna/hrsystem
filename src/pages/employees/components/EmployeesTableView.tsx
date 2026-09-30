import { memo } from "react";
import type { Employee, AccountStatus, VisibleColumns, SortField, SortDirection, BiometricDeviceRef } from "../types";
import { EmployeesTableRow } from "./EmployeesTableRow";

interface EmployeesTableViewProps {
  employees: Employee[];
  accountStatus: Record<string, AccountStatus>;
  biometricDevices?: BiometricDeviceRef[];
  selectedIds: Set<string>;
  selectAll: boolean;
  visibleColumns: VisibleColumns;
  sortField: SortField;
  sortDirection: SortDirection;
  canManage: boolean;
  invitingId: string | null;
  deletingId: string | null;
  tableGridStyle?: React.CSSProperties;
  showSalary?: boolean;
  onSelectAll: () => void;
  onSelectOne: (id: string) => void;
  onSort: (field: SortField) => void;
  onInvite: (e: Employee) => void;
  onSetUpPhoneAccount?: (e: Employee) => void;
  onDelete: (e: Employee) => void;
}

export const EmployeesTableView = memo(function EmployeesTableView({
  employees,
  selectedIds,
  selectAll,
  canManage,
  showSalary = false,
  onSelectAll,
  onSelectOne,
  onSort,
  onInvite,
  onSetUpPhoneAccount,
  onDelete,
}: EmployeesTableViewProps) {
  return (
    <div className="w-full overflow-x-auto bg-white">
      <table className="w-full text-left text-xs border-collapse">
        {/* ERP Table Header matching Screenshot 2 */}
        <thead className="bg-white border-b border-slate-200/90 text-slate-700 font-semibold">
          <tr>
            <th className="py-2.5 px-3 w-10 text-center">
              <input
                type="checkbox"
                checked={selectAll}
                onChange={onSelectAll}
                className="w-3.5 h-3.5 rounded border-slate-300 text-[#3498db] focus:ring-[#3498db] cursor-pointer"
              />
            </th>
            <th className="py-2.5 px-2 w-12 text-center text-slate-500 font-medium">
              No.
            </th>
            <th
              onClick={() => onSort("first_name")}
              className="py-2.5 px-3 min-w-[160px] cursor-pointer hover:text-[#3498db] select-none"
            >
              <div className="flex items-center gap-1">
                <span>Employee</span>
                <i className="ri-arrow-up-down-line text-slate-400 text-xs" />
              </div>
            </th>
            <th
              onClick={() => onSort("role")}
              className="py-2.5 px-3 min-w-[140px] cursor-pointer hover:text-[#3498db] select-none"
            >
              <div className="flex items-center gap-1">
                <span>Position</span>
                <i className="ri-arrow-up-down-line text-slate-400 text-xs" />
              </div>
            </th>
            <th
              onClick={() => onSort("department")}
              className="py-2.5 px-3 min-w-[130px] cursor-pointer hover:text-[#3498db] select-none"
            >
              <div className="flex items-center gap-1">
                <span>Department</span>
                <i className="ri-arrow-up-down-line text-slate-400 text-xs" />
              </div>
            </th>
            <th
              onClick={() => onSort("join_date")}
              className="py-2.5 px-3 min-w-[110px] cursor-pointer hover:text-[#3498db] select-none"
            >
              <div className="flex items-center gap-1">
                <span>Joining Date</span>
                <i className="ri-arrow-up-down-line text-slate-400 text-xs" />
              </div>
            </th>
            <th className="py-2.5 px-3 min-w-[150px] select-none">
              <div className="flex items-center gap-1">
                <span>Contract</span>
                <i className="ri-arrow-up-down-line text-slate-400 text-xs" />
              </div>
            </th>
            <th className="py-2.5 px-3 min-w-[120px] select-none">
              <div className="flex items-center gap-1">
                <span>Rate</span>
                <i className="ri-arrow-up-down-line text-slate-400 text-xs" />
              </div>
            </th>
            <th
              onClick={() => onSort("status")}
              className="py-2.5 px-3 min-w-[100px] cursor-pointer hover:text-[#3498db] select-none"
            >
              <div className="flex items-center gap-1">
                <span>Status</span>
                <i className="ri-arrow-up-down-line text-slate-400 text-xs" />
              </div>
            </th>
            <th className="py-2.5 px-3 w-16 text-center select-none">
              <i className="ri-settings-4-line text-slate-400 text-sm" />
            </th>
          </tr>
        </thead>

        {/* Table Body */}
        <tbody className="divide-y divide-slate-100 bg-white">
          {employees.map((e, idx) => (
            <EmployeesTableRow
              key={e.id}
              employee={e}
              index={idx}
              isSelected={selectedIds.has(e.id)}
              canManage={canManage}
              showSalary={showSalary}
              onSelectOne={onSelectOne}
              onInvite={onInvite}
              onSetUpPhoneAccount={onSetUpPhoneAccount}
              onDelete={onDelete}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
});
