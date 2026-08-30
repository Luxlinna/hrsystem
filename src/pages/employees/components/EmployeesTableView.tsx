import { memo } from "react";
import type { Employee, AccountStatus, VisibleColumns, SortField, SortDirection } from "../types";
import { EmployeesTableRow } from "./EmployeesTableRow";

interface EmployeesTableViewProps {
  employees: Employee[];
  accountStatus: Record<string, AccountStatus>;
  selectedIds: Set<string>;
  selectAll: boolean;
  visibleColumns: VisibleColumns;
  sortField: SortField;
  sortDirection: SortDirection;
  canManage: boolean;
  invitingId: string | null;
  deletingId: string | null;
  tableGridStyle: React.CSSProperties;
  onSelectAll: () => void;
  onSelectOne: (id: string) => void;
  onSort: (field: SortField) => void;
  onInvite: (e: Employee) => void;
  onDelete: (e: Employee) => void;
}

export const EmployeesTableView = memo(function EmployeesTableView({
  employees,
  accountStatus,
  selectedIds,
  selectAll,
  visibleColumns,
  sortField,
  sortDirection,
  canManage,
  invitingId,
  deletingId,
  tableGridStyle,
  onSelectAll,
  onSelectOne,
  onSort,
  onInvite,
  onDelete,
}: EmployeesTableViewProps) {
  return (
    <>
      {/* Table Header */}
      <div
        className="hidden md:grid md:[grid-template-columns:var(--emp-cols)] gap-x-3 bg-gray-50/80 px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100"
        style={tableGridStyle}
      >
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={selectAll}
            onChange={onSelectAll}
            className="w-4 h-4 rounded border-gray-300 text-[#253C7D] focus:ring-[#253C7D] cursor-pointer"
          />
          <span>Employee</span>
        </div>
        {visibleColumns.role && (
          <button
            onClick={() => onSort("role")}
            className="flex items-center gap-2 hover:text-gray-700 cursor-pointer transition-colors"
          >
            Role
            {sortField === "role" && <i className={`ri-arrow-${sortDirection === "asc" ? "up" : "down"}-s-line`} />}
          </button>
        )}
        {visibleColumns.department && (
          <button
            onClick={() => onSort("department")}
            className="flex items-center gap-2 hover:text-gray-700 cursor-pointer transition-colors"
          >
            Department
            {sortField === "department" && (
              <i className={`ri-arrow-${sortDirection === "asc" ? "up" : "down"}-s-line`} />
            )}
          </button>
        )}
        {visibleColumns.branch && (
          <button
            onClick={() => onSort("branch")}
            className="flex items-center gap-2 hover:text-gray-700 cursor-pointer transition-colors"
          >
            Branch
            {sortField === "branch" && (
              <i className={`ri-arrow-${sortDirection === "asc" ? "up" : "down"}-s-line`} />
            )}
          </button>
        )}
        {visibleColumns.status && (
          <button
            onClick={() => onSort("status")}
            className="flex items-center gap-2 hover:text-gray-700 cursor-pointer transition-colors"
          >
            Status
            {sortField === "status" && (
              <i className={`ri-arrow-${sortDirection === "asc" ? "up" : "down"}-s-line`} />
            )}
          </button>
        )}
        {visibleColumns.account && <span>Account</span>}
        {visibleColumns.joinDate && (
          <button
            onClick={() => onSort("join_date")}
            className="flex items-center gap-2 hover:text-gray-700 cursor-pointer transition-colors"
          >
            Join Date
            {sortField === "join_date" && (
              <i className={`ri-arrow-${sortDirection === "asc" ? "up" : "down"}-s-line`} />
            )}
          </button>
        )}
        {visibleColumns.actions && canManage && <span className="text-right">Actions</span>}
      </div>

      {/* Table Rows */}
      {employees.map((e) => (
        <EmployeesTableRow
          key={e.id}
          employee={e}
          accountStatus={accountStatus[e.email]}
          isSelected={selectedIds.has(e.id)}
          visibleColumns={visibleColumns}
          canManage={canManage}
          invitingId={invitingId}
          deletingId={deletingId}
          tableGridStyle={tableGridStyle}
          onSelectOne={onSelectOne}
          onInvite={onInvite}
          onDelete={onDelete}
        />
      ))}
    </>
  );
});
