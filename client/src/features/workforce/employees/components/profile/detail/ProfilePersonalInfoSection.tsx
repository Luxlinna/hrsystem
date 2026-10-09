import { memo, useState } from "react";
import type { Employee } from "../../../types";
import { formatDMY } from "../../../dateUtils";
import { formatKhmerFullName } from "../../../nameUtils";

interface Props {
  employee: Employee;
}

export const ProfilePersonalInfoSection = memo(function ProfilePersonalInfoSection({
  employee,
}: Props) {
  const [showDob, setShowDob] = useState(false);

  const displayAs = formatKhmerFullName(employee);

  const enrolledId = employee.biometric_user_id || employee.employee_code || "-";
  const paymentMethod = employee.bank_accounts?.[0]?.payment_method || "-";

  return (
    <div className="space-y-3">
      <h3 className="text-[13px] font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider">
        PERSONAL INFO
      </h3>

      <div className="space-y-1.5 text-[13px]">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-y-1">
          <span className="sm:col-span-3 text-slate-700 dark:text-slate-300">Title</span>
          <span className="sm:col-span-9 text-slate-900 dark:text-slate-100">{employee.title || "Mr"}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-y-1">
          <span className="sm:col-span-3 text-slate-700 dark:text-slate-300">First Name</span>
          <span className="sm:col-span-9 text-slate-900 dark:text-slate-100">{employee.first_name || "-"}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-y-1">
          <span className="sm:col-span-3 text-slate-700 dark:text-slate-300">Last Name</span>
          <span className="sm:col-span-9 text-slate-900 dark:text-slate-100">{employee.last_name || "-"}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-y-1">
          <span className="sm:col-span-3 text-slate-700 dark:text-slate-300">Display Name as</span>
          <span className="sm:col-span-9 text-slate-900 dark:text-slate-100">{displayAs}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-y-1">
          <span className="sm:col-span-3 text-slate-700 dark:text-slate-300">Khmer Name (KH Name)</span>
          <span className="sm:col-span-9 text-slate-900 dark:text-slate-100">{employee.kh_name || "-"}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-y-1">
          <span className="sm:col-span-3 text-slate-700 dark:text-slate-300">Employee Code</span>
          <span className="sm:col-span-9 text-slate-900 dark:text-slate-100">{employee.employee_code || "-"}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-y-1">
          <span className="sm:col-span-3 text-slate-700 dark:text-slate-300">Enrolled ID</span>
          <span className="sm:col-span-9 text-slate-900 dark:text-slate-100">{enrolledId}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-y-1 items-center">
          <span className="sm:col-span-3 text-slate-700 dark:text-slate-300">Date of Birth</span>
          <span className="sm:col-span-9 text-slate-900 dark:text-slate-100 inline-flex items-center gap-1.5">
            {showDob ? formatDMY(employee.date_of_birth) : "*****"}
            <button
              type="button"
              onClick={() => setShowDob((prev) => !prev)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              title={showDob ? "Hide Date of Birth" : "Show Date of Birth"}
            >
              <i className={showDob ? "ri-eye-off-line" : "ri-eye-line"} />
            </button>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-y-1">
          <span className="sm:col-span-3 text-slate-700 dark:text-slate-300">Gender</span>
          <span className="sm:col-span-9 text-slate-900 dark:text-slate-100 capitalize">{employee.gender || "-"}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-y-1">
          <span className="sm:col-span-3 text-slate-700 dark:text-slate-300">Marital Status</span>
          <span className="sm:col-span-9 text-slate-900 dark:text-slate-100 capitalize">{employee.marital_status || "-"}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-y-1">
          <span className="sm:col-span-3 text-slate-700 dark:text-slate-300">Nationality</span>
          <span className="sm:col-span-9 text-slate-900 dark:text-slate-100">{employee.nationality || "Khmer"}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-y-1 items-center">
          <span className="sm:col-span-3 text-slate-700 dark:text-slate-300">Resident</span>
          <span className="sm:col-span-9">
            <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded border border-slate-400 bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-700 dark:text-slate-300">
              {employee.is_resident !== false ? "✓" : ""}
            </span>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-y-1">
          <span className="sm:col-span-3 text-slate-700 dark:text-slate-300">Fringe Benefit</span>
          <span className="sm:col-span-9 text-slate-900 dark:text-slate-100">{employee.fringe_benefit ? "Yes" : "No"}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-y-1">
          <span className="sm:col-span-3 text-slate-700 dark:text-slate-300">Blood Group</span>
          <span className="sm:col-span-9 text-slate-900 dark:text-slate-100">{employee.blood_group || ""}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-y-1">
          <span className="sm:col-span-3 text-slate-700 dark:text-slate-300">Religion</span>
          <span className="sm:col-span-9 text-slate-900 dark:text-slate-100">{employee.religion || ""}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-y-1">
          <span className="sm:col-span-3 text-slate-700 dark:text-slate-300">Employee Tax Number</span>
          <span className="sm:col-span-9 text-slate-900 dark:text-slate-100">{employee.employee_tax_number || ""}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-y-1">
          <span className="sm:col-span-3 text-slate-700 dark:text-slate-300">Payment Method</span>
          <span className="sm:col-span-9 text-slate-900 dark:text-slate-100">{paymentMethod}</span>
        </div>
      </div>
    </div>
  );
});
