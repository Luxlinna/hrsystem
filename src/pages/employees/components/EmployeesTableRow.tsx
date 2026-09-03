import { memo } from "react";
import { Link } from "react-router-dom";
import type { Employee, AccountStatus, VisibleColumns } from "../types";
import { getStatusMeta } from "../constants";

interface EmployeesTableRowProps {
  employee: Employee;
  accountStatus?: AccountStatus;
  isSelected: boolean;
  visibleColumns: VisibleColumns;
  canManage: boolean;
  invitingId: string | null;
  deletingId: string | null;
  tableGridStyle: React.CSSProperties;
  onSelectOne: (id: string) => void;
  onInvite: (e: Employee) => void;
  onDelete: (e: Employee) => void;
}

export const EmployeesTableRow = memo(function EmployeesTableRow({
  employee: e,
  accountStatus: acc,
  isSelected,
  visibleColumns,
  canManage,
  invitingId,
  deletingId,
  tableGridStyle,
  onSelectOne,
  onInvite,
  onDelete,
}: EmployeesTableRowProps) {
  const isInvited = acc?.invited;
  const hasAccount = acc?.hasAccount;

  return (
    <Link
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
          <p className="text-sm font-bold text-gray-900 truncate">
            {e.first_name} {e.last_name}
          </p>
          <p className="text-xs text-gray-500 truncate">{e.email}</p>
        </div>
      </div>

      {visibleColumns.role && <div className="text-sm text-gray-600 truncate">{e.role || "—"}</div>}
      {visibleColumns.department && <div className="text-sm text-gray-600 truncate">{e.department || "—"}</div>}
      {visibleColumns.branch && (
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-800 truncate leading-tight">
            {e.branches?.name || e.branch_id || "—"}
          </p>
          <div className="mt-0.5">
            {e.work_locations?.name ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-700 bg-amber-50 border border-amber-200/70 px-1.5 py-0.5 rounded">
                <i className="ri-map-pin-2-fill text-[9px] text-amber-500" />
                {e.work_locations.name}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-blue-700 bg-blue-50 border border-blue-200/70 px-1.5 py-0.5 rounded">
                <i className="ri-building-2-line text-[9px] text-blue-500" />
                Main Office
              </span>
            )}
          </div>
        </div>
      )}
      {visibleColumns.status && (
        <div>
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
              getStatusMeta(e.status).bg
            } ${getStatusMeta(e.status).text}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${getStatusMeta(e.status).dot}`} />
            {getStatusMeta(e.status).label}
          </span>
        </div>
      )}
      {visibleColumns.account && (
        <div>
          {hasAccount ? (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
              <i className="ri-checkbox-circle-fill text-emerald-500" /> Active
            </span>
          ) : isInvited ? (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">
              <i className="ri-time-line text-amber-500" /> Invited
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-400 bg-gray-50 px-2 py-0.5 rounded-md">
              <i className="ri-close-circle-line text-gray-400" /> No Account
            </span>
          )}
        </div>
      )}
      {visibleColumns.joinDate && (
        <div className="text-sm text-gray-600">
          {e.join_date ? new Date(e.join_date).toLocaleDateString() : "—"}
        </div>
      )}
      {visibleColumns.actions && canManage && (
        <div className="flex items-center justify-end gap-2" onClick={(ev) => ev.stopPropagation()}>
          {!hasAccount && (
            <button
              type="button"
              onClick={(ev) => {
                ev.preventDefault();
                ev.stopPropagation();
                onInvite(e);
              }}
              disabled={invitingId === e.email}
              className="p-2 text-gray-400 hover:text-[#253C7D] hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              title={isInvited ? "Resend Invite" : "Send Account Invite"}
            >
              <i className={`ri-${invitingId === e.email ? "loader-4-line animate-spin" : isInvited ? "mail-send-line" : "user-add-line"} text-lg`} />
            </button>
          )}
          <button
            type="button"
            onClick={(ev) => {
              ev.preventDefault();
              ev.stopPropagation();
              onDelete(e);
            }}
            disabled={deletingId === e.id}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
            title="Delete Employee"
          >
            <i className={`ri-${deletingId === e.id ? "loader-4-line animate-spin" : "delete-bin-line"} text-lg`} />
          </button>
        </div>
      )}
    </Link>
  );
});
