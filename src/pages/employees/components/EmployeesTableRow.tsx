import { memo } from "react";
import { Link } from "react-router-dom";
import type { Employee, AccountStatus, VisibleColumns, BiometricDeviceRef } from "../types";
import { isEmployeeBiometricEligible } from "../types";
import { getStatusMeta } from "../constants";
import { isPhoneSyntheticEmail, syntheticEmailToPhone } from "@/lib/phoneUtils";
import { formatBiometricId } from "@/lib/biometricUtils";

interface EmployeesTableRowProps {
  employee: Employee;
  accountStatus?: AccountStatus;
  biometricDevices?: BiometricDeviceRef[];
  isSelected: boolean;
  visibleColumns: VisibleColumns;
  canManage: boolean;
  invitingId: string | null;
  deletingId: string | null;
  tableGridStyle: React.CSSProperties;
  onSelectOne: (id: string) => void;
  onInvite: (e: Employee) => void;
  onSetUpPhoneAccount?: (e: Employee) => void;
  onDelete: (e: Employee) => void;
}

export const EmployeesTableRow = memo(function EmployeesTableRow({
  employee: e,
  accountStatus: acc,
  biometricDevices = [],
  isSelected,
  visibleColumns,
  canManage,
  invitingId,
  deletingId,
  tableGridStyle,
  onSelectOne,
  onInvite,
  onSetUpPhoneAccount,
  onDelete,
}: EmployeesTableRowProps) {
  const isInvited = acc?.invited;
  const hasAccount = acc?.hasAccount;
  const isBiometricEligible = isEmployeeBiometricEligible(e, biometricDevices);
  const hasRealEmail = Boolean(e.email && !isPhoneSyntheticEmail(e.email));
  const effectivePhone = e.phone || (e.email && isPhoneSyntheticEmail(e.email) ? syntheticEmailToPhone(e.email) : null);
  const hasContact = hasRealEmail || Boolean(effectivePhone);

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
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="text-sm font-bold text-gray-900 truncate">
              {e.first_name} {e.last_name}
            </p>
            {e.biometric_user_id && (
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-[#253C7D]/10 text-[#253C7D] border border-[#253C7D]/20 shrink-0"
                title={`ZKTeco Machine Fingerprint/Face ID: ${e.biometric_user_id}`}
              >
                <i className="ri-fingerprint-line text-[10px]" />
                {formatBiometricId(e.biometric_user_id, e.branches?.name)}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 truncate mt-0.5">
            {hasRealEmail ? (
              e.email
            ) : effectivePhone ? (
              <span className="text-gray-700 font-medium inline-flex items-center gap-1">
                <i className="ri-phone-line text-gray-400 text-[11px]" />
                {effectivePhone}
              </span>
            ) : isBiometricEligible ? (
              <span className="text-gray-400 italic">No contact (Biometric only)</span>
            ) : (
              <span className="text-gray-400 italic">No contact info</span>
            )}
          </p>
        </div>
      </div>

      {visibleColumns.role && <div className="text-sm text-gray-600 truncate">{e.role || "—"}</div>}
      {visibleColumns.department && <div className="text-sm text-gray-600 truncate">{e.department || "—"}</div>}
      {visibleColumns.branch && (
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900 dark:text-slate-100 truncate">
            {e.branches?.name || e.branch_id || "—"}
          </p>
          <div className="mt-1 flex items-center">
            {e.work_locations?.name ? (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50/80 dark:bg-emerald-950/60 border border-emerald-200/70 dark:border-emerald-800/60 px-2 py-0.5 rounded-lg whitespace-nowrap shadow-2xs">
                <i className="ri-map-pin-2-fill text-[10px] text-emerald-500 dark:text-emerald-400 shrink-0" />
                <span>{e.work_locations.name}</span>
                <span className="text-[9px] uppercase tracking-wider font-extrabold px-1 py-0.2 rounded bg-emerald-100/70 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200">
                  Site
                </span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-normal text-gray-400 dark:text-slate-500">
                <i className="ri-building-line text-[10px]" />
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
          ) : !hasContact && isBiometricEligible ? (
            <span
              className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 bg-slate-100 border border-slate-200/70 px-2 py-0.5 rounded-md"
              title="Biometric fingerprint machine only; cannot log into web portal"
            >
              <i className="ri-fingerprint-line text-slate-500" /> Biometric Only
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
          {!hasAccount && hasRealEmail && (
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
