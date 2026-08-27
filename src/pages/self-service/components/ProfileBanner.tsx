import type { Employee } from "../types";
import { STATUS_STYLES } from "../constants";

interface Props {
  employee: Employee;
  managerName: string;
}

export function ProfileBanner({ employee, managerName }: Props) {
  const yearsAtCompany = employee.join_date
    ? Math.floor((new Date().getTime() - new Date(employee.join_date).getTime()) / (365.25 * 86400000))
    : 0;

  const statusMeta =
    STATUS_STYLES[employee.status || ""] || {
      label: employee.status || "Unknown",
      className: "text-gray-600 bg-gray-50 border-gray-200",
      icon: "ri-information-line",
    };

  return (
    <div className="relative overflow-hidden bg-white border border-gray-200/80 rounded-2xl p-5 sm:p-6 mb-6 shadow-2xs">
      <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-r from-[#253C7D] via-[#2E5AA8] to-[#29ABE2] opacity-[0.06]" />
      <div className="relative flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className="relative shrink-0">
            <div className="w-16 h-16 rounded-2xl p-[2px] bg-gradient-to-br from-[#253C7D] to-[#29ABE2]">
              {employee.avatar_url ? (
                <img
                  src={employee.avatar_url}
                  alt={`${employee.first_name} ${employee.last_name}`}
                  className="w-full h-full rounded-[14px] object-cover border-2 border-white"
                />
              ) : (
                <div className="w-full h-full rounded-[14px] border-2 border-white bg-[#253C7D] text-white font-black text-lg flex items-center justify-center">
                  {employee.first_name?.[0]}
                  {employee.last_name?.[0]}
                </div>
              )}
            </div>
            <span
              className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-white ${
                employee.status === "active" ? "bg-emerald-500"
                  : employee.status === "on_leave" ? "bg-amber-500"
                  : employee.status === "onboarding" ? "bg-sky-500"
                  : employee.status === "suspended" ? "bg-rose-500"
                  : "bg-gray-400"
              }`}
              title={statusMeta.label}
            />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-gray-900 truncate">{employee.first_name} {employee.last_name}</h2>
            <p className="text-sm text-gray-500 truncate">
              {employee.role || "Staff"}
              {employee.department ? ` · ${employee.department}` : ""}
            </p>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1 text-[11px] text-gray-500">
              <a href={`mailto:${employee.email}`} className="inline-flex items-center gap-1 hover:text-[#253C7D] hover:underline truncate">
                <i className="ri-mail-line text-gray-400" />{employee.email}
              </a>
              {employee.phone && (
                <a href={`tel:${employee.phone}`} className="inline-flex items-center gap-1 hover:text-[#253C7D] hover:underline">
                  <i className="ri-phone-line text-gray-400" />{employee.phone}
                </a>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-600 bg-gray-50 border border-gray-200/70 px-2 py-0.5 rounded-full">
                <i className="ri-building-line text-gray-400" />{employee.branches?.name || "Unassigned"}
              </span>
              <span
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-600 bg-gray-50 border border-gray-200/70 px-2 py-0.5 rounded-full"
                title={`Joined ${new Date(employee.join_date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`}
              >
                <i className="ri-calendar-line text-gray-400" />
                {yearsAtCompany > 0
                  ? `${yearsAtCompany} yr${yearsAtCompany !== 1 ? "s" : ""} at company`
                  : `Joined ${new Date(employee.join_date).toLocaleDateString("en-US", { month: "short", year: "numeric" })}`}
              </span>
              {managerName && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-600 bg-gray-50 border border-gray-200/70 px-2 py-0.5 rounded-full">
                  <i className="ri-user-star-line text-gray-400" />
                  Reports to {managerName}
                </span>
              )}
              <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border ${statusMeta.className}`}>
                <i className={statusMeta.icon} />{statusMeta.label}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
