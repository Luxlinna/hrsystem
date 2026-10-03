import { memo } from "react";
import { Link } from "react-router-dom";
import type { Employee } from "../../types";
import { DefaultAvatarSvg } from "@/components/DefaultAvatarSvg";

interface EmployeeInfoCellProps {
  employee: Employee;
  fullName: string;
  buCode: string;
  employeeCode: string;
}

export const EmployeeInfoCell = memo(function EmployeeInfoCell({
  employee: e,
  fullName,
  buCode,
  employeeCode,
}: EmployeeInfoCellProps) {
  const initials = [e.first_name?.[0], e.last_name?.[0]].filter(Boolean).join("").toUpperCase() || "?";
  const buLabel = e.branches?.name || e.bu_full_name || buCode || "Main BU";

  return (
    <td className="py-2.5 px-3">
      <Link to={`/employees/${e.id}`} className="flex items-center gap-2.5 group">
        <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shrink-0 flex items-center justify-center font-bold text-[11px]">
          {e.avatar_url ? (
            <img src={e.avatar_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <DefaultAvatarSvg />
          )}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-slate-900 dark:text-slate-100 group-hover:text-[#253C7D] transition-colors truncate leading-snug text-xs">
            {fullName}
          </p>
          <span className="inline-flex items-center gap-1 mt-0.5 px-1.5 py-0.2 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-[10px] text-slate-600 dark:text-slate-400 font-mono">
            <i className="ri-global-line text-[10px] text-slate-400" />
            <span>{buLabel} {employeeCode ? `${employeeCode}` : ""}</span>
          </span>
        </div>
      </Link>
    </td>
  );
});

interface DepartmentLocationCellProps {
  department: string;
  siteName: string;
}

export const DepartmentLocationCell = memo(function DepartmentLocationCell({
  department,
  siteName,
}: DepartmentLocationCellProps) {
  return (
    <td className="py-2.5 px-3">
      <p className="font-bold text-slate-800 dark:text-slate-100 uppercase text-[11px] truncate">
        {department}
      </p>
      <span className="inline-flex items-center gap-1 mt-0.5 px-1.5 py-0.2 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-[10px] text-slate-600 dark:text-slate-400 font-mono">
        <i className="ri-building-line text-[10px] text-slate-400" />
        <span>{siteName}</span>
      </span>
    </td>
  );
});
