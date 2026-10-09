import { useState } from "react";
import type { Employee } from "../types";
import { STATUS_STYLES } from "../constants";

interface Props {
  employee: Employee;
  managerName: string;
  todayAttendance?: any;
  onGoToCheckIn?: () => void;
}

export function ProfileBanner({ employee, managerName, todayAttendance, onGoToCheckIn }: Props) {
  const [imgError, setImgError] = useState(false);
  const yearsAtCompany = employee.join_date
    ? Math.floor((new Date().getTime() - new Date(employee.join_date).getTime()) / (365.25 * 86400000))
    : 0;

  const statusMeta = STATUS_STYLES[employee.status || ""] || {
    label: employee.status || "Active",
    className: "text-slate-600 bg-slate-50 border-slate-200",
    icon: "ri-information-line",
  };

  const fullName =
    employee.display_name?.trim() ||
    employee.full_name?.trim() ||
    `${employee.last_name || ""} ${employee.first_name || ""}`.trim();
  const avatarSrc = employee.avatar_url || (employee as any).photo_url;
  const isClockedIn = Boolean(todayAttendance?.clock_in);
  const isDayDone = Boolean(todayAttendance?.clock_in && todayAttendance?.clock_out);
  const initials = fullName
    ? fullName.split(" ").filter(Boolean).map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : `${employee.last_name?.[0] || ""}${employee.first_name?.[0] || ""}`.toUpperCase();

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 mb-5 shadow-xs">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Avatar & Identity */}
        <div className="flex items-start sm:items-center gap-3.5 sm:gap-4.5 min-w-0">
          <div className="relative w-14 h-14 sm:w-16 sm:h-16 shrink-0">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-2xs bg-slate-900 dark:bg-slate-800">
              {avatarSrc && !imgError ? (
                <img
                  src={avatarSrc}
                  alt={fullName}
                  onError={() => setImgError(true)}
                  className="w-full h-full object-cover aspect-square block"
                />
              ) : (
                <div className="w-full h-full bg-[#253C7D] text-white font-bold text-base sm:text-lg flex items-center justify-center select-none">
                  {initials || "EM"}
                </div>
              )}
            </div>
            <span
              className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-slate-900 z-10 ${
                employee.status === "active" ? "bg-emerald-500" : employee.status === "on_leave" ? "bg-amber-500" : "bg-blue-500"
              }`}
            />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight truncate">
                {fullName || "Employee"}
              </h2>
              <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md border ${statusMeta.className}`}>
                <i className={`${statusMeta.icon} text-[11px]`} />
                {statusMeta.label}
              </span>
            </div>

            <p className="text-xs sm:text-[13px] text-slate-600 dark:text-slate-300 font-medium truncate mt-0.5">
              {employee.role || "Staff"}
              {employee.department ? <span className="text-slate-400 dark:text-slate-500"> &bull; {employee.department}</span> : ""}
            </p>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-xs text-slate-500 dark:text-slate-400">
              {employee.phone && (
                <span className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                  <i className="ri-phone-line text-slate-400 text-xs" />
                  <span>{employee.phone}</span>
                </span>
              )}
              {employee.email && (
                <span className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-300 truncate">
                  <i className="ri-mail-line text-slate-400 text-xs" />
                  <span className="truncate max-w-[200px] sm:max-w-none">{employee.email}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Quick Punch Action & Org Info */}
        <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end justify-between gap-3 pt-3 md:pt-0 border-t md:border-t-0 md:border-l md:pl-5 border-slate-100 dark:border-slate-800 shrink-0">
          {onGoToCheckIn && (
            <div className="w-full sm:w-auto">
              <button
                type="button"
                onClick={onGoToCheckIn}
                className={`w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-bold text-xs shadow-xs transition-all cursor-pointer select-none active:scale-98 ${
                  isDayDone
                    ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                    : isClockedIn
                    ? "bg-[#253C7D] hover:bg-[#1E3066] active:bg-[#172554] text-white border border-[#253C7D] shadow-sm"
                    : "bg-[#253C7D] hover:bg-[#1E3066] active:bg-[#172554] text-white border border-[#253C7D] shadow-sm"
                }`}
              >
                <i className={`${isDayDone ? "ri-checkbox-circle-fill text-emerald-600 dark:text-emerald-400" : isClockedIn ? "ri-logout-box-r-line text-[#29ABE2]" : "ri-fingerprint-line text-[#29ABE2]"} text-base`} />
                <span>{isDayDone ? "Shift Completed" : isClockedIn ? "Check Out Now" : "Check In Now"}</span>
              </button>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1">
              <i className="ri-building-2-line text-slate-400 text-xs" />
              <span>{employee.branches?.name || "Main BU"}</span>
            </span>
            {employee.join_date && (
              <span className="flex items-center gap-1">
                <i className="ri-calendar-line text-slate-400 text-xs" />
                <span>Joined {new Date(employee.join_date).toLocaleDateString("en-US", { month: "short", year: "numeric" })}</span>
              </span>
            )}
            {managerName && (
              <span className="flex items-center gap-1 truncate max-w-[180px]">
                <i className="ri-user-star-line text-slate-400 text-xs" />
                <span>{managerName}</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
