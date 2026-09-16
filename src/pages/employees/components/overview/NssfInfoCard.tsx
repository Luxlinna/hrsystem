import React from "react";
import type { Employee } from "../../types";

interface NssfInfoCardProps {
  employee: Employee;
}

export const NssfInfoCard: React.FC<NssfInfoCardProps> = ({ employee }) => {
  const isExplicitlyExempt = employee?.register_nssf === false;
  const nssfNumber = employee?.nssf_number || (employee as any)?.candidate_records?.nssf_number;
  const isEnrolled = Boolean(employee?.register_nssf || nssfNumber);

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs">
      <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-teal-700 shadow-2xs">
            <i className="ri-shield-cross-line text-xl" />
          </div>
          <div>
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-wide">
              National Social Security Fund (NSSF)
            </h3>
            <p className="text-xs text-gray-500 font-medium">
              Official Cambodian social protection, health care, and pension coverage
            </p>
          </div>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-bold border ${
            isEnrolled
              ? "bg-teal-50 text-teal-700 border-teal-200"
              : isExplicitlyExempt
              ? "bg-slate-100 text-slate-600 border-slate-200"
              : "bg-amber-50 text-amber-700 border-amber-200"
          }`}
        >
          {isEnrolled
            ? "Active Member"
            : isExplicitlyExempt
            ? "Excluded / Non-NSSF"
            : "Verification Pending"}
        </span>
      </div>

      {/* Main NSSF Card Identity Strip */}
      <div
        className={`rounded-2xl p-6 text-white shadow-xs mb-6 ${
          isEnrolled
            ? "bg-gradient-to-r from-teal-900 to-[#1e3a5f]"
            : "bg-gradient-to-r from-slate-800 to-slate-900"
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xs tracking-widest uppercase font-bold text-teal-200">
              KINGDOM OF CAMBODIA &middot; NSSF
            </span>
          </div>
          <span className="text-xs font-mono bg-white/20 px-2.5 py-0.5 rounded font-bold">
            MLVT / NSSF-KH
          </span>
        </div>
        <div className="mb-3">
          <span className="text-[10px] text-teal-300 uppercase tracking-wider block font-semibold">
            NSSF Member ID
          </span>
          <span className="text-2xl font-mono font-extrabold tracking-wider">
            {nssfNumber || (isExplicitlyExempt ? "EXEMPT / NON-ENROLLED" : "Pending Registration")}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs text-teal-100 border-t border-teal-800/80 pt-3">
          <span>
            Holder:{" "}
            <strong>
              {employee.kh_name ? `${employee.kh_name} (${employee.first_name} ${employee.last_name})` : `${employee.first_name} ${employee.last_name}`}
            </strong>
          </span>
          <span>
            Status:{" "}
            <strong>
              {isEnrolled
                ? "Enrolled & Compliant"
                : isExplicitlyExempt
                ? "Designated Non-NSSF in Hiring Setup"
                : "Awaiting MLVT Card"}
            </strong>
          </span>
        </div>
      </div>

      {/* Scheme Coverage Details */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="border border-gray-200 rounded-lg p-3.5 bg-gray-50/50">
          <div className="flex items-center gap-2 text-teal-700 font-bold text-xs mb-1">
            <i className="ri-heart-pulse-line text-sm" />
            <span>Health Care</span>
          </div>
          <p className="text-[11px] text-gray-600">
            Outpatient &amp; inpatient hospitalization benefits at contracted public/private clinics nationwide.
          </p>
        </div>

        <div className="border border-gray-200 rounded-lg p-3.5 bg-gray-50/50">
          <div className="flex items-center gap-2 text-indigo-700 font-bold text-xs mb-1">
            <i className="ri-shield-user-line text-sm" />
            <span>Occupational Risk</span>
          </div>
          <p className="text-[11px] text-gray-600">
            100% employer-funded work accident and occupational injury emergency coverage.
          </p>
        </div>

        <div className="border border-gray-200 rounded-lg p-3.5 bg-gray-50/50">
          <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs mb-1">
            <i className="ri-coin-line text-sm" />
            <span>Pension Scheme</span>
          </div>
          <p className="text-[11px] text-gray-600">
            Mandatory monthly retirement savings shared equally between enterprise and staff.
          </p>
        </div>
      </div>
    </div>
  );
};
