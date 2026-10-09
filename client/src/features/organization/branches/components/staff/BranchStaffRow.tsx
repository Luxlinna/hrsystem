import { memo } from "react";
import { Link } from "react-router-dom";
import type { Employee } from "../../types";
import { formatBiometricId } from "@/lib/biometricUtils";
import { getStaffStatusMeta } from "./types";

interface BranchStaffRowProps {
  employee: Employee;
  branchName?: string;
}

export const BranchStaffRow = memo(function BranchStaffRow({
  employee: emp,
  branchName,
}: BranchStaffRowProps) {
  const fullName = `${emp.last_name || ""} ${emp.first_name || ""}`.trim() || "Unnamed Staff";
  const initials = `${emp.last_name?.[0] || ""}${emp.first_name?.[0] || ""}`.toUpperCase() || "E";
  const statusMeta = getStaffStatusMeta(emp.status);
  const locationName = emp.work_locations?.name || "Main Office";

  return (
    <div className="group flex items-center justify-between px-4 py-3.5 hover:bg-slate-50/80 transition-colors gap-3">
      {/* Left: Avatar & Details */}
      <div className="flex items-center gap-3.5 min-w-0">
        {emp.avatar_url ? (
          <img
            src={emp.avatar_url}
            alt={fullName}
            className="w-10 h-10 rounded-full object-cover border border-slate-200/80 shrink-0 shadow-2xs"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#253C7D] to-[#3B5998] flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-2xs">
            {initials}
          </div>
        )}

        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              to={`/employees/${emp.id}`}
              className="text-sm font-semibold text-slate-900 hover:text-[#0088cc] truncate transition-colors"
            >
              {fullName}
            </Link>

            {emp.biometric_user_id && (
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-mono font-semibold bg-slate-100/90 text-slate-700 border border-slate-200/80 shrink-0"
                title={`Biometric ID: ${emp.biometric_user_id}`}
              >
                <i className="ri-fingerprint-line text-[11px] text-slate-400" />
                {formatBiometricId(emp.biometric_user_id, branchName)}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500 flex-wrap">
            <span className="font-medium text-slate-600 truncate">{emp.role || "Staff"}</span>
            <span className="text-slate-300">·</span>
            <span className="inline-flex items-center gap-1 text-slate-500">
              <i className="ri-map-pin-2-line text-[11px] text-slate-400" />
              <span>{locationName}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Right: Status Pill & Action */}
      <div className="flex items-center gap-3 shrink-0">
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${statusMeta.pill}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${statusMeta.dot}`} />
          {statusMeta.label}
        </span>

        <Link
          to={`/employees/${emp.id}`}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 opacity-0 group-hover:opacity-100 transition-all hidden sm:flex"
          title="View Employee Profile"
        >
          <i className="ri-arrow-right-s-line text-base" />
        </Link>
      </div>
    </div>
  );
});
