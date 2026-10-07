import { memo, useState } from "react";
import type { Employee } from "../../../types";

interface Props {
  employee: Employee;
}

export const ProfileAddressContactSection = memo(function ProfileAddressContactSection({
  employee,
}: Props) {
  const [showPhone, setShowPhone] = useState(false);

  const currentAddress =
    employee.current_address ||
    (employee.same_as_present_address !== false ? employee.permanent_address : "") ||
    "-";

  return (
    <div className="space-y-6 pt-4 border-t border-slate-100 dark:border-slate-800">
      {/* 1. Current Address Info */}
      <div className="space-y-3">
        <h3 className="text-[13px] font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider">
          CURRENT ADDRESS INFO
        </h3>

        <div className="space-y-1.5 text-[13px]">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-y-1">
            <span className="sm:col-span-3 text-slate-700 dark:text-slate-300">Address</span>
            <span className="sm:col-span-9 text-slate-900 dark:text-slate-100">{currentAddress}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-y-1">
            <span className="sm:col-span-3 text-slate-700 dark:text-slate-300">City</span>
            <span className="sm:col-span-9 text-slate-900 dark:text-slate-100">{employee.permanent_city || ""}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-y-1">
            <span className="sm:col-span-3 text-slate-700 dark:text-slate-300">Province</span>
            <span className="sm:col-span-9 text-slate-900 dark:text-slate-100">{employee.permanent_province || "-"}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-y-1">
            <span className="sm:col-span-3 text-slate-700 dark:text-slate-300">Postal Code</span>
            <span className="sm:col-span-9 text-slate-900 dark:text-slate-100">{employee.permanent_postal_code || ""}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-y-1">
            <span className="sm:col-span-3 text-slate-700 dark:text-slate-300">Country</span>
            <span className="sm:col-span-9 text-slate-900 dark:text-slate-100">{employee.permanent_country || "Cambodia"}</span>
          </div>
        </div>
      </div>

      {/* 2. Permanent Address Info */}
      <div className="space-y-3">
        <h3 className="text-[13px] font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider">
          PERMANENT ADDRESS INFO
        </h3>

        <div className="space-y-1.5 text-[13px]">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-y-1">
            <span className="sm:col-span-3 text-slate-700 dark:text-slate-300">Address</span>
            <span className="sm:col-span-9 text-slate-900 dark:text-slate-100">{employee.permanent_address || "-"}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-y-1">
            <span className="sm:col-span-3 text-slate-700 dark:text-slate-300">City</span>
            <span className="sm:col-span-9 text-slate-900 dark:text-slate-100">{employee.permanent_city || ""}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-y-1">
            <span className="sm:col-span-3 text-slate-700 dark:text-slate-300">Province</span>
            <span className="sm:col-span-9 text-slate-900 dark:text-slate-100">{employee.permanent_province || "-"}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-y-1">
            <span className="sm:col-span-3 text-slate-700 dark:text-slate-300">Postal Code</span>
            <span className="sm:col-span-9 text-slate-900 dark:text-slate-100">{employee.permanent_postal_code || ""}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-y-1">
            <span className="sm:col-span-3 text-slate-700 dark:text-slate-300">Country</span>
            <span className="sm:col-span-9 text-slate-900 dark:text-slate-100">{employee.permanent_country || "Cambodia"}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-y-1 items-center">
            <span className="sm:col-span-3 text-slate-700 dark:text-slate-300">Same as Present Address</span>
            <span className="sm:col-span-9">
              <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded border border-slate-400 bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-700 dark:text-slate-300">
                {employee.same_as_present_address !== false ? "✓" : ""}
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* 3. Contact Info */}
      <div className="space-y-3">
        <h3 className="text-[13px] font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider">
          CONTACT INFO
        </h3>

        <div className="space-y-1.5 text-[13px]">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-y-1 items-center">
            <span className="sm:col-span-3 text-slate-700 dark:text-slate-300">Phone Number</span>
            <span className="sm:col-span-9 text-slate-900 dark:text-slate-100 inline-flex items-center gap-1.5">
              {showPhone ? employee.phone || "-" : "*****"}
              <button
                type="button"
                onClick={() => setShowPhone((prev) => !prev)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                title={showPhone ? "Hide Phone" : "Show Phone"}
              >
                <i className={showPhone ? "ri-eye-off-line" : "ri-eye-line"} />
              </button>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-y-1">
            <span className="sm:col-span-3 text-slate-700 dark:text-slate-300">Home Phone Number</span>
            <span className="sm:col-span-9 text-slate-900 dark:text-slate-100">{employee.home_phone || ""}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-y-1">
            <span className="sm:col-span-3 text-slate-700 dark:text-slate-300">Office Phone Number</span>
            <span className="sm:col-span-9 text-slate-900 dark:text-slate-100">{employee.office_phone || ""}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-y-1">
            <span className="sm:col-span-3 text-slate-700 dark:text-slate-300">Email</span>
            <span className="sm:col-span-9 text-slate-900 dark:text-slate-100">{employee.email || ""}</span>
          </div>
        </div>
      </div>
    </div>
  );
});
