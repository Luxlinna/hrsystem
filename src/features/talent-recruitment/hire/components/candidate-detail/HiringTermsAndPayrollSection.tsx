import { memo } from "react";
import type { Candidate } from "../../types";

interface HiringTermsAndPayrollSectionProps {
  candidate: Candidate;
  copiedField: string | null;
  onCopy: (text: string | null | undefined, label: string) => void;
}

export const HiringTermsAndPayrollSection = memo(function HiringTermsAndPayrollSection({
  candidate,
  copiedField,
  onCopy,
}: HiringTermsAndPayrollSectionProps) {
  return (
    <>
      {/* Section 3: Terms & Employment Schedule */}
      <div className="space-y-3 pt-4 border-t border-slate-100">
        <div className="flex items-center gap-2">
          <i className="ri-calendar-check-line text-emerald-600 text-sm" />
          <h4 className="text-xs font-black text-slate-600 uppercase tracking-wider">
            3. Employment Terms, Schedule &amp; Contract
          </h4>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Working Hour */}
          <div className="p-3 bg-slate-50/70 rounded-2xl border border-slate-100">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
              Working Hour
            </span>
            <p className="text-xs font-bold text-slate-800 mt-1">
              {candidate.working_hour || <span className="text-slate-400 font-normal italic">Not recorded</span>}
            </p>
          </div>

          {/* Total Working Day */}
          <div className="p-3 bg-slate-50/70 rounded-2xl border border-slate-100">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
              Total Working Day
            </span>
            <p className="text-xs font-bold text-slate-800 mt-1">
              {candidate.total_working_days || <span className="text-slate-400 font-normal italic">Not recorded</span>}
            </p>
          </div>

          {/* Full Time / Part Time */}
          <div className="p-3 bg-slate-50/70 rounded-2xl border border-slate-100">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
              Full Time / Part Time
            </span>
            <p className="text-xs font-bold text-slate-800 mt-1">
              {candidate.employment_type || "Full Time"}
            </p>
          </div>

          {/* Start Date */}
          <div className="p-3 bg-slate-50/70 rounded-2xl border border-slate-100">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
              Start Date
            </span>
            <p className="text-xs font-bold text-slate-800 mt-1">
              {candidate.start_date || <span className="text-slate-400 font-normal italic">Not scheduled</span>}
            </p>
          </div>

          {/* Line Manager */}
          <div className="p-3 bg-slate-50/70 rounded-2xl border border-slate-100">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
              Line Manager
            </span>
            <p className="text-xs font-bold text-slate-800 mt-1">
              {candidate.line_manager || <span className="text-slate-400 font-normal italic">Not assigned</span>}
            </p>
          </div>

          {/* Type of Contract */}
          <div className="p-3 bg-slate-50/70 rounded-2xl border border-slate-100">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
              Type of Contract
            </span>
            <p className="text-xs font-bold text-slate-800 mt-1">
              {candidate.contract_type || "FDC"}
            </p>
          </div>

          {/* Date End of FDC */}
          <div className="p-3 bg-slate-50/70 rounded-2xl border border-slate-100">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
              Date End of FDC
            </span>
            <p className="text-xs font-bold text-slate-800 mt-1">
              {candidate.fdc_end_date || <span className="text-slate-400 font-normal italic">N/A</span>}
            </p>
          </div>

          {/* Status (probation, intern) */}
          <div className="p-3 bg-slate-50/70 rounded-2xl border border-slate-100">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
              Status (probation, intern)
            </span>
            <div className="mt-1">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-extrabold capitalize">
                {candidate.hiring_status || "Probation"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Section 4: Compensation & Payroll */}
      <div className="space-y-3 pt-4 border-t border-slate-100">
        <div className="flex items-center gap-2">
          <i className="ri-money-dollar-circle-line text-emerald-600 text-sm" />
          <h4 className="text-xs font-black text-slate-600 uppercase tracking-wider">
            4. Compensation, Tax &amp; Payroll Setup
          </h4>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Basic Salary */}
          <div className="p-3 bg-emerald-50/50 rounded-2xl border border-emerald-100">
            <span className="text-[10px] font-extrabold text-emerald-700 uppercase tracking-wider block">
              Basic Salary
            </span>
            <p className="text-sm font-black text-emerald-700 mt-1">
              {candidate.basic_salary
                ? `$${candidate.basic_salary.toLocaleString()} / mo`
                : candidate.expected_salary
                ? `$${candidate.expected_salary.toLocaleString()} / mo`
                : "Pending"}
            </p>
          </div>

          {/* Tax Method */}
          <div className="p-3 bg-slate-50/70 rounded-2xl border border-slate-100">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
              Tax Method
            </span>
            <p className="text-xs font-bold text-slate-800 mt-1">
              {candidate.tax_method || "Resident"}
            </p>
          </div>

          {/* Allowance */}
          <div className="p-3 bg-slate-50/70 rounded-2xl border border-slate-100">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
              Allowance
            </span>
            <p className="text-xs font-bold text-slate-800 mt-1">
              {candidate.allowance || <span className="text-slate-400 font-normal italic">None</span>}
            </p>
          </div>

          {/* Bank Account */}
          <div className="p-3 bg-slate-50/70 rounded-2xl border border-slate-100 group relative">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
              Bank Account
            </span>
            <div className="flex items-center justify-between mt-1">
              <p className="text-xs font-mono font-bold text-slate-800 truncate">
                {candidate.bank_account_number || <span className="text-slate-400 font-normal italic font-sans">Not recorded</span>}
              </p>
              {candidate.bank_account_number && (
                <button
                  type="button"
                  onClick={() => onCopy(candidate.bank_account_number, "Bank Account")}
                  className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-700 text-xs cursor-pointer"
                  title="Copy Bank Account"
                >
                  <i className={copiedField === "Bank Account" ? "ri-check-line text-emerald-600" : "ri-file-copy-line"} />
                </button>
              )}
            </div>
          </div>

          {/* NSSF */}
          <div className="p-3 bg-slate-50/70 rounded-2xl border border-slate-100 group relative">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
              NSSF Number
            </span>
            <div className="flex items-center justify-between mt-1">
              <p className="text-xs font-mono font-bold text-slate-800 truncate">
                {candidate.nssf_number || <span className="text-slate-400 font-normal italic font-sans">Not recorded</span>}
              </p>
              {candidate.nssf_number && (
                <button
                  type="button"
                  onClick={() => onCopy(candidate.nssf_number, "NSSF Number")}
                  className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-700 text-xs cursor-pointer"
                  title="Copy NSSF Number"
                >
                  <i className={copiedField === "NSSF Number" ? "ri-check-line text-emerald-600" : "ri-file-copy-line"} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Section 5: Communication & Emergency Contacts */}
      <div className="space-y-3 pt-4 border-t border-slate-100">
        <div className="flex items-center gap-2">
          <i className="ri-contacts-book-line text-purple-600 text-sm" />
          <h4 className="text-xs font-black text-slate-600 uppercase tracking-wider">
            5. Communication &amp; Emergency Contacts
          </h4>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Email */}
          <div className="p-3 bg-slate-50/70 rounded-2xl border border-slate-100 group relative">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
              Email Address
            </span>
            <div className="flex items-center justify-between mt-1">
              <p className="text-xs font-bold text-slate-800 truncate">
                {candidate.email}
              </p>
              <button
                type="button"
                onClick={() => onCopy(candidate.email, "Email")}
                className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-700 text-xs cursor-pointer"
                title="Copy Email"
              >
                <i className={copiedField === "Email" ? "ri-check-line text-emerald-600" : "ri-file-copy-line"} />
              </button>
            </div>
          </div>

          {/* Phone Number */}
          <div className="p-3 bg-slate-50/70 rounded-2xl border border-slate-100 group relative">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
              Phone Number
            </span>
            <div className="flex items-center justify-between mt-1">
              <p className="text-xs font-bold text-slate-800">
                {candidate.phone || <span className="text-slate-400 font-normal italic">Not recorded</span>}
              </p>
              {candidate.phone && (
                <button
                  type="button"
                  onClick={() => onCopy(candidate.phone, "Phone")}
                  className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-700 text-xs cursor-pointer"
                  title="Copy Phone"
                >
                  <i className={copiedField === "Phone" ? "ri-check-line text-emerald-600" : "ri-file-copy-line"} />
                </button>
              )}
            </div>
          </div>

          {/* Emergency Contact Name */}
          <div className="p-3 bg-slate-50/70 rounded-2xl border border-slate-100">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
              Emergency Contact Name
            </span>
            <p className="text-xs font-bold text-slate-800 mt-1">
              {candidate.emergency_contact_name || <span className="text-slate-400 font-normal italic">Not recorded</span>}
            </p>
          </div>

          {/* Emergency Phone Number */}
          <div className="p-3 bg-slate-50/70 rounded-2xl border border-slate-100 group relative">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
              Emergency Phone Number
            </span>
            <div className="flex items-center justify-between mt-1">
              <p className="text-xs font-bold text-slate-800">
                {candidate.emergency_phone_number || <span className="text-slate-400 font-normal italic">Not recorded</span>}
              </p>
              {candidate.emergency_phone_number && (
                <button
                  type="button"
                  onClick={() => onCopy(candidate.emergency_phone_number, "Emergency Phone")}
                  className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-700 text-xs cursor-pointer"
                  title="Copy Emergency Phone"
                >
                  <i className={copiedField === "Emergency Phone" ? "ri-check-line text-emerald-600" : "ri-file-copy-line"} />
                </button>
              )}
            </div>
          </div>

          {/* Current Address */}
          <div className="p-3 bg-slate-50/70 rounded-2xl border border-slate-100 sm:col-span-2 lg:col-span-4">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
              Current Address
            </span>
            <p className="text-xs font-medium text-slate-800 mt-1">
              {candidate.current_address || candidate.location || (
                <span className="text-slate-400 font-normal italic">Not recorded</span>
              )}
            </p>
          </div>
        </div>
      </div>
    </>
  );
});
