import { useState } from "react";
import type { Employee } from "../types";
import { STATUS_STYLES } from "../constants";

interface Props {
  employee: Employee;
  managerName: string;
}

export function ProfileBanner({ employee, managerName }: Props) {
  const [imgError, setImgError] = useState(false);
  const yearsAtCompany = employee.join_date
    ? Math.floor((new Date().getTime() - new Date(employee.join_date).getTime()) / (365.25 * 86400000))
    : 0;

  const statusMeta =
    STATUS_STYLES[employee.status || ""] || {
      label: employee.status || "Unknown",
      className: "text-slate-600 bg-slate-50 border-slate-200",
      icon: "ri-information-line",
    };

  const fullName = `${employee.first_name || ""} ${employee.last_name || ""}`.trim();
  const avatarSrc = employee.avatar_url || (employee as any).photo_url;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 sm:p-5 mb-5 shadow-2xs">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Avatar & Identity Details */}
        <div className="flex items-start sm:items-center gap-3.5 sm:gap-4.5 min-w-0">
          <div className="relative w-14 h-14 sm:w-16 sm:h-16 shrink-0">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden border border-slate-200/80 dark:border-slate-700 shadow-2xs bg-slate-900 dark:bg-slate-800">
              {avatarSrc && !imgError ? (
                <img
                  src={avatarSrc}
                  alt={fullName}
                  onError={() => setImgError(true)}
                  className="w-full h-full object-cover aspect-square block"
                />
              ) : (
                <div className="w-full h-full bg-slate-900 dark:bg-slate-800 text-white font-bold text-base sm:text-lg flex items-center justify-center select-none">
                  {employee.first_name?.[0]}
                  {employee.last_name?.[0]}
                </div>
              )}
            </div>
            <span
              className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-slate-900 z-10 ${
                employee.status === "active"
                  ? "bg-emerald-500"
                  : employee.status === "on_leave"
                  ? "bg-amber-500"
                  : employee.status === "onboarding"
                  ? "bg-blue-500"
                  : employee.status === "suspended"
                  ? "bg-rose-500"
                  : "bg-slate-400"
              }`}
              title={statusMeta.label}
            />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight truncate">
                {fullName || "Employee"}
              </h2>
              <span
                className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md border ${statusMeta.className}`}
              >
                <i className={`${statusMeta.icon} text-[11px]`} />
                {statusMeta.label}
              </span>
            </div>

            <p className="text-xs sm:text-[13px] text-slate-600 dark:text-slate-300 font-medium truncate mt-0.5">
              {employee.role || "Staff"}
              {employee.department ? <span className="text-slate-400 dark:text-slate-500"> · {employee.department}</span> : ""}
            </p>

            {/* Contact row */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-xs text-slate-500 dark:text-slate-400">
              {employee.email && (
                <a
                  href={`mailto:${employee.email}`}
                  className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors truncate"
                >
                  <i className="ri-mail-line text-slate-400 dark:text-slate-500 text-xs" />
                  <span className="truncate max-w-[220px] sm:max-w-none">{employee.email}</span>
                </a>
              )}
              {employee.phone && (
                <a
                  href={`tel:${employee.phone}`}
                  className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  <i className="ri-phone-line text-slate-400 dark:text-slate-500 text-xs" />
                  <span>{employee.phone}</span>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Right / Bottom Metadata Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 md:flex md:flex-col gap-2 pt-3 md:pt-0 border-t md:border-t-0 md:border-l md:pl-5 border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 shrink-0">
          <div className="flex items-center gap-2">
            <i className="ri-building-2-line text-slate-400 dark:text-slate-500 text-sm shrink-0" />
            <span className="text-slate-500 dark:text-slate-400">Unit:</span>
            <span className="font-medium text-slate-800 dark:text-slate-200 truncate">{employee.branches?.name || "Unassigned"}</span>
          </div>

          {employee.join_date && (
            <div className="flex items-center gap-2">
              <i className="ri-calendar-line text-slate-400 dark:text-slate-500 text-sm shrink-0" />
              <span className="text-slate-500 dark:text-slate-400">Joined:</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">
                {new Date(employee.join_date).toLocaleDateString("en-US", {
                  month: "short",
                  year: "numeric",
                })}
                {yearsAtCompany > 0 && <span className="text-slate-400 dark:text-slate-500 font-normal"> ({yearsAtCompany}y)</span>}
              </span>
            </div>
          )}

          {managerName && (
            <div className="flex items-center gap-2">
              <i className="ri-user-star-line text-slate-400 dark:text-slate-500 text-sm shrink-0" />
              <span className="text-slate-500 dark:text-slate-400">Reports to:</span>
              <span className="font-medium text-slate-800 dark:text-slate-200 truncate">{managerName}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
