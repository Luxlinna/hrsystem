import { memo } from "react";
import { Link } from "react-router-dom";
import type { Employee, AccountStatus, VisibleColumns } from "../types";
import { getStatusMeta } from "../constants";

interface EmployeesGridViewProps {
  employees: Employee[];
  accountStatus: Record<string, AccountStatus>;
  selectedIds: Set<string>;
  visibleColumns: VisibleColumns;
  canManage: boolean;
  deletingId: string | null;
  onSelectOne: (id: string) => void;
  onDelete: (e: Employee) => void;
}

export const EmployeesGridView = memo(function EmployeesGridView({
  employees,
  accountStatus,
  selectedIds,
  visibleColumns,
  canManage,
  deletingId,
  onSelectOne,
  onDelete,
}: EmployeesGridViewProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
      {employees.map((e) => {
        const acc = accountStatus[e.email];
        const isInvited = acc?.invited;
        const hasAccount = acc?.hasAccount;
        const isSelected = selectedIds.has(e.id);
        return (
          <Link
            key={e.id}
            to={`/employees/${e.id}`}
            className={`bg-white rounded-xl border border-gray-200/80 p-5 hover:shadow-xs hover:border-[#253C7D]/30 transition-all cursor-pointer ${
              isSelected ? "ring-2 ring-[#253C7D]" : ""
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <label
                  className="p-2 -m-2 flex items-center cursor-pointer"
                  onClick={(ev) => ev.stopPropagation()}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onSelectOne(e.id)}
                    className="w-4 h-4 rounded border-gray-300 text-[#253C7D] focus:ring-[#253C7D] cursor-pointer"
                  />
                </label>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#253C7D] to-[#3B5998] flex items-center justify-center text-white text-lg font-bold shadow-md overflow-hidden">
                  {e.avatar_url ? (
                    <img src={e.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span>
                      {e.first_name?.[0]}
                      {e.last_name?.[0]}
                    </span>
                  )}
                </div>
              </div>
              {visibleColumns.status && (
                <span
                  className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${
                    getStatusMeta(e.status).bg
                  } ${getStatusMeta(e.status).text}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${getStatusMeta(e.status).dot}`} />
                  {getStatusMeta(e.status).label}
                </span>
              )}
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">
              {e.first_name} {e.last_name}
            </h3>
            <p className="text-sm text-gray-500 mb-3">{e.email}</p>
            <div className="space-y-2">
              {visibleColumns.role && e.role && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <i className="ri-briefcase-line text-gray-400" />
                  {e.role}
                </div>
              )}
              {visibleColumns.department && e.department && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <i className="ri-building-line text-gray-400" />
                  {e.department}
                </div>
              )}
              {visibleColumns.branch && e.branches?.name && (
                <div className="flex items-center justify-between text-sm text-gray-600 gap-2">
                  <div className="flex items-center gap-1.5 truncate">
                    <i className="ri-building-line text-gray-400 shrink-0" />
                    <span className="truncate">{e.branches.name}</span>
                  </div>
                  {e.work_locations?.name ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-700 bg-amber-50 border border-amber-200/70 px-1.5 py-0.5 rounded shrink-0">
                      <i className="ri-map-pin-2-fill text-[9px] text-amber-500" />
                      {e.work_locations.name}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-blue-700 bg-blue-50 border border-blue-200/70 px-1.5 py-0.5 rounded shrink-0">
                      <i className="ri-building-2-line text-[9px] text-blue-500" />
                      Main Office
                    </span>
                  )}
                </div>
              )}
            </div>
            {visibleColumns.account && (
              <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                {hasAccount ? (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
                    <i className="ri-checkbox-circle-line" />
                    Active Account
                  </span>
                ) : isInvited ? (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-[#253C7D]">
                    <i className="ri-mail-send-line" />
                    Invited
                  </span>
                ) : (
                  <span className="text-xs text-gray-400">No Account</span>
                )}
                {canManage && (
                  <button
                    type="button"
                    onClick={(ev) => {
                      ev.preventDefault();
                      onDelete(e);
                    }}
                    disabled={deletingId === e.id}
                    className="text-xs text-rose-600 hover:text-rose-700 disabled:opacity-60 cursor-pointer"
                  >
                    <i className="ri-delete-bin-line" />
                  </button>
                )}
              </div>
            )}
          </Link>
        );
      })}
    </div>
  );
});
