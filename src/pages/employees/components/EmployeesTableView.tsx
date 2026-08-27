import { memo } from "react";
import { Link } from "react-router-dom";
import type { Employee, AccountStatus, VisibleColumns, SortField, SortDirection } from "../types";
import { getStatusMeta } from "../constants";

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
      {employees.map((e) => {
        const acc = accountStatus[e.email];
        const isInvited = acc?.invited;
        const hasAccount = acc?.hasAccount;
        const isSelected = selectedIds.has(e.id);
        return (
          <Link
            key={e.id}
            to={`/employees/${e.id}`}
            className={`grid grid-cols-1 md:[grid-template-columns:var(--emp-cols)] gap-x-3 px-6 py-4 border-b border-gray-50 items-center hover:bg-[#253C7D]/5 transition-colors cursor-pointer ${
              isSelected ? "bg-[#253C7D]/5 ring-1 ring-inset ring-[#253C7D]/40" : ""
            }`}
            style={tableGridStyle}
          >
            <div className="flex items-center gap-4 min-w-0">
              <label
                className="shrink-0 p-2 -m-2 flex items-center cursor-pointer"
                onClick={(ev) => ev.stopPropagation()}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => onSelectOne(e.id)}
                  className="w-4 h-4 rounded border-gray-300 text-[#253C7D] focus:ring-[#253C7D] cursor-pointer"
                />
              </label>
              <div className="w-10 h-10 shrink-0 rounded-xl bg-gradient-to-tr from-[#253C7D] to-[#3B5998] flex items-center justify-center text-white text-sm font-bold shadow-md overflow-hidden">
                {e.avatar_url ? (
                  <img src={e.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span>
                    {e.first_name?.[0]}
                    {e.last_name?.[0]}
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {e.first_name} {e.last_name}
                </p>
                <p className="text-xs text-gray-500 truncate">{e.email}</p>
              </div>
            </div>
            {visibleColumns.role && (
              <span className="text-sm text-gray-700 mt-2 md:mt-0 truncate">{e.role || "-"}</span>
            )}
            {visibleColumns.department && (
              <span className="text-sm text-gray-600 mt-1 md:mt-0 truncate">{e.department || "-"}</span>
            )}
            {visibleColumns.branch && (
              <span className="text-sm text-gray-600 mt-1 md:mt-0 truncate">
                {e.branches?.name || "Headquarters"}
              </span>
            )}
            {visibleColumns.status && (
              <span className="mt-1 md:mt-0">
                <span
                  className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full ${
                    getStatusMeta(e.status).bg
                  } ${getStatusMeta(e.status).text}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${getStatusMeta(e.status).dot}`} />
                  {getStatusMeta(e.status).label}
                </span>
              </span>
            )}
            {visibleColumns.account && (
              <span className="mt-1 md:mt-0">
                {hasAccount ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-700">
                    <i className="ri-checkbox-circle-line" />
                    Active
                  </span>
                ) : isInvited ? (
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-[#253C7D]/10 text-[#1E3066]">
                    <i className="ri-mail-send-line" />
                    Invited
                  </span>
                ) : canManage ? (
                  <button
                    onClick={(ev) => {
                      ev.preventDefault();
                      onInvite(e);
                    }}
                    disabled={invitingId === e.id}
                    className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-gray-100 text-gray-600 hover:bg-[#253C7D]/10 hover:text-[#1E3066] transition-colors cursor-pointer disabled:opacity-60"
                  >
                    <i className="ri-mail-line" />
                    {invitingId === e.id ? "Sending..." : "Invite"}
                  </button>
                ) : (
                  <span className="text-xs text-gray-400">No account</span>
                )}
              </span>
            )}
            {visibleColumns.joinDate && (
              <span className="text-sm text-gray-500 mt-1 md:mt-0">{e.join_date || "N/A"}</span>
            )}
            {visibleColumns.actions && canManage && (
              <span className="mt-2 md:mt-0 text-left md:text-right">
                <button
                  type="button"
                  onClick={(ev) => {
                    ev.preventDefault();
                    onDelete(e);
                  }}
                  disabled={deletingId === e.id}
                  aria-label={`Delete ${e.first_name} ${e.last_name}`}
                  className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 disabled:opacity-60 transition-colors cursor-pointer"
                >
                  <i className="ri-delete-bin-line" />
                  {deletingId === e.id ? "Removing..." : "Delete"}
                </button>
              </span>
            )}
          </Link>
        );
      })}
    </>
  );
});
