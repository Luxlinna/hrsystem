import React from "react";
import type { Employee, EmployeeNssfInfo } from "../../types";

interface NssfInfoDetailsProps {
  employee: Employee;
  nssf: EmployeeNssfInfo;
}

export const NssfInfoDetails: React.FC<NssfInfoDetailsProps> = ({
  employee,
  nssf,
}) => {
  const formatDisplayDate = (d?: string) => {
    if (!d) return "—";
    if (d.includes("-")) {
      const [y, m, day] = d.split("-");
      if (y && m && day) return `${day}/${m}/${y}`;
    }
    return d;
  };

  const khmerName =
    [nssf.last_name_kh, nssf.first_name_kh].filter(Boolean).join(" ") ||
    employee.kh_name ||
    "—";

  const latinName =
    [nssf.last_name_latin, nssf.first_name_latin].filter(Boolean).join(" ") ||
    [employee.last_name, employee.first_name].filter(Boolean).join(" ") ||
    "—";

  return (
    <div className="space-y-6">
      {/* 1. NSSF INFO */}
      <div className="space-y-3">
        <h3 className="text-xs font-black text-[#253C7D] uppercase tracking-wider">
          NSSF INFO
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-y-3 text-xs">
          <div className="md:col-span-3 text-slate-500 font-medium">
            Identity Code of Worker
          </div>
          <div className="md:col-span-9 font-semibold text-slate-900 font-mono">
            {nssf.identity_code || employee.nssf_number || "—"}
          </div>

          <div className="md:col-span-3 text-slate-500 font-medium">
            NSSF Joining Date
          </div>
          <div className="md:col-span-9 text-slate-900 font-medium">
            {formatDisplayDate(nssf.joining_date)}
          </div>

          <div className="md:col-span-3 text-slate-500 font-medium">
            Worker's Name in Khmer
          </div>
          <div className="md:col-span-9 font-semibold text-slate-900">
            {khmerName}
          </div>

          <div className="md:col-span-3 text-slate-500 font-medium">
            Worker's Name in Latin
          </div>
          <div className="md:col-span-9 font-medium text-slate-900">
            {latinName}
          </div>

          <div className="md:col-span-3 text-slate-500 font-medium">
            Monthly Wage Type
          </div>
          <div className="md:col-span-9 text-slate-900 font-medium">
            {nssf.monthly_wage_type || "Formula"}
          </div>

          <div className="md:col-span-3 text-slate-500 font-medium">
            Monthly Wage
          </div>
          <div className="md:col-span-9 text-slate-900 font-medium">
            {nssf.monthly_wage || "Taxable Salary"}
          </div>

          <div className="md:col-span-3 text-slate-500 font-medium">
            Remark
          </div>
          <div className="md:col-span-9 text-slate-700">
            {nssf.remark || "—"}
          </div>
        </div>
      </div>

      {/* 2. STATUS INFO */}
      <div className="pt-5 border-t border-slate-100 space-y-3">
        <h3 className="text-xs font-black text-[#253C7D] uppercase tracking-wider">
          STATUS INFO
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-y-3 text-xs">
          <div className="md:col-span-3 text-slate-500 font-medium">
            Status
          </div>
          <div className="md:col-span-9">
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                (nssf.status || "Active") === "Active"
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-slate-100 text-slate-600 border border-slate-200"
              }`}
            >
              {nssf.status || "Active"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
