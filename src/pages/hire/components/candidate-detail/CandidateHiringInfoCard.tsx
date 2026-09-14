import React, { memo, useState, useMemo } from "react";
import type { Candidate } from "../../types";
import { EditHiringInfoModal } from "./EditHiringInfoModal";
import { toast } from "@/components/Toast";

interface CandidateHiringInfoCardProps {
  candidate: Candidate;
  onCandidateUpdated?: (updated: Partial<Candidate>) => void;
}

export const CandidateHiringInfoCard: React.FC<CandidateHiringInfoCardProps> = memo(
  function CandidateHiringInfoCard({ candidate, onCandidateUpdated }) {
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [copiedField, setCopiedField] = useState<string | null>(null);

    const handleCopy = (text: string | null | undefined, label: string) => {
      if (!text) return;
      navigator.clipboard.writeText(text);
      setCopiedField(label);
      toast("Copied", `${label} copied to clipboard`, "info");
      setTimeout(() => setCopiedField(null), 2000);
    };

    // Calculate completeness of the 33 standard fields
    const { filledCount, totalFields, percent } = useMemo(() => {
      const keys: (keyof Candidate)[] = [
        "candidate_code", // 1. ID
        "full_name", // 2. Full Name
        "kh_name", // 3. KH Name
        "gender", // 4. Gender
        "code_bu", // 5. Code BU
        "bu_full_name", // 6. BU Full Name
        "handle_bu", // 7. Handle BU
        "division", // 8. Division
        "department", // 9. Department
        "position", // 10. Position
        "working_hour", // 11. Working Hour
        "total_working_days", // 12. Total Working Day
        "employment_type", // 13. Full Time/Part Time
        "start_date", // 14. Start Date
        "working_location", // 15. Working Location
        "national_id_number", // 16. National ID
        "date_of_birth", // 17. Date of Birth
        "current_address", // 18. Current Address
        "basic_salary", // 19. Basic Salary
        "tax_method", // 20. Tax Method
        "allowance", // 21. Allowance
        "line_manager", // 22. Line Manager
        "contract_type", // 23. Type of Contract
        "fdc_end_date", // 24. Date End of FDC
        "site", // 25. Site
        "bank_account_number", // 26. Bank Account
        "nssf_number", // 27. NSSF
        "email", // 28. Email
        "phone", // 29. Phone Number
        "emergency_contact_name", // 30. Emergency Contact Name
        "emergency_phone_number", // 31. Emergency Phone Number
        "hiring_status", // 32. Status (probation, intern)
        "marital_status", // 33. Marital Status
      ];

      let count = 0;
      keys.forEach((k) => {
        const val = candidate[k];
        if (val !== undefined && val !== null && String(val).trim() !== "") {
          count++;
        }
      });

      return {
        filledCount: count,
        totalFields: keys.length,
        percent: Math.round((count / keys.length) * 100),
      };
    }, [candidate]);

    const handleSaved = (updated: Partial<Candidate>) => {
      Object.assign(candidate, updated);
      onCandidateUpdated?.(updated);
    };

    return (
      <div className="bg-white rounded-3xl border border-gray-200/80 p-6 sm:p-7 shadow-xs space-y-6">
        {/* Card Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="w-2.5 h-2.5 rounded-full bg-[#253C7D]" />
              <h3 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span>Hiring &amp; Employment Master Information</span>
              </h3>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200/70 text-blue-700 text-[11px] font-mono font-black">
                33 Standard Fields
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200/70 text-emerald-700 text-[11px] font-extrabold flex items-center gap-1">
                <i className="ri-checkbox-circle-line" />
                {filledCount} / {totalFields} Completed ({percent}%)
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Official recruitment master record covering physical site stationing, payroll specifications, and contractual terms.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsEditModalOpen(true)}
            className="self-start sm:self-auto px-4 py-2 rounded-xl bg-[#253C7D] hover:bg-[#1E3064] text-white text-xs font-black transition-all flex items-center gap-1.5 shadow-xs cursor-pointer hover:shadow-md"
          >
            <i className="ri-edit-line text-sm" />
            <span>Edit Hiring Info</span>
          </button>
        </div>

        {/* Completeness Bar */}
        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              percent >= 80 ? "bg-emerald-500" : percent >= 50 ? "bg-blue-600" : "bg-amber-500"
            }`}
            style={{ width: `${percent}%` }}
          />
        </div>

        {/* Section 1: Personal & Legal Identification */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <i className="ri-user-smile-line text-blue-600 text-sm" />
            <h4 className="text-xs font-black text-slate-600 uppercase tracking-wider">
              1. Personal &amp; Legal Identification
            </h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {/* Candidate ID */}
            <div className="p-3 bg-slate-50/70 rounded-2xl border border-slate-100 group relative">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                ID (Candidate Code)
              </span>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs font-mono font-bold text-blue-700">
                  {candidate.candidate_code || candidate.id}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(candidate.candidate_code || candidate.id, "Candidate ID")}
                  className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-700 text-xs cursor-pointer"
                  title="Copy ID"
                >
                  <i className={copiedField === "Candidate ID" ? "ri-check-line text-emerald-600" : "ri-file-copy-line"} />
                </button>
              </div>
            </div>

            {/* Full Name */}
            <div className="p-3 bg-slate-50/70 rounded-2xl border border-slate-100">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                Full Name (English)
              </span>
              <p className="text-xs font-black text-slate-800 mt-1">
                {candidate.full_name}
              </p>
            </div>

            {/* Khmer Name */}
            <div className="p-3 bg-blue-50/40 rounded-2xl border border-blue-100/70">
              <span className="text-[10px] font-extrabold text-blue-600 uppercase tracking-wider block">
                KH Name (Khmer Script)
              </span>
              <p className="text-xs font-black text-blue-950 mt-1 font-khmer">
                {candidate.kh_name || <span className="text-slate-400 font-normal italic font-sans">Not recorded</span>}
              </p>
            </div>

            {/* Gender */}
            <div className="p-3 bg-slate-50/70 rounded-2xl border border-slate-100">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                Gender
              </span>
              <p className="text-xs font-bold text-slate-800 mt-1">
                {candidate.gender || <span className="text-slate-400 font-normal italic">Not recorded</span>}
              </p>
            </div>

            {/* Date of Birth */}
            <div className="p-3 bg-slate-50/70 rounded-2xl border border-slate-100">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                Date of Birth
              </span>
              <p className="text-xs font-bold text-slate-800 mt-1">
                {candidate.date_of_birth || <span className="text-slate-400 font-normal italic">Not recorded</span>}
              </p>
            </div>

            {/* Marital Status */}
            <div className="p-3 bg-slate-50/70 rounded-2xl border border-slate-100">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                Marital Status
              </span>
              <p className="text-xs font-bold text-slate-800 mt-1">
                {candidate.marital_status || <span className="text-slate-400 font-normal italic">Not recorded</span>}
              </p>
            </div>

            {/* National ID Number */}
            <div className="p-3 bg-slate-50/70 rounded-2xl border border-slate-100 group relative sm:col-span-2 lg:col-span-3">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                National ID Number (Khmer ID / Passport)
              </span>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs font-mono font-bold text-slate-800">
                  {candidate.national_id_number || (
                    <span className="text-slate-400 font-normal italic font-sans">Not recorded</span>
                  )}
                </span>
                {candidate.national_id_number && (
                  <button
                    type="button"
                    onClick={() => handleCopy(candidate.national_id_number, "National ID")}
                    className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-700 text-xs cursor-pointer"
                    title="Copy National ID"
                  >
                    <i className={copiedField === "National ID" ? "ri-check-line text-emerald-600" : "ri-file-copy-line"} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Organizational Placement & Physical Site */}
        <div className="space-y-3 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <i className="ri-building-line text-indigo-600 text-sm" />
            <h4 className="text-xs font-black text-slate-600 uppercase tracking-wider">
              2. Organizational Structure &amp; Physical Site Workplace
            </h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Code BU */}
            <div className="p-3 bg-slate-50/70 rounded-2xl border border-slate-100">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                Code BU
              </span>
              <p className="text-xs font-mono font-bold text-slate-800 mt-1">
                {candidate.code_bu || <span className="text-slate-400 font-normal italic font-sans">Not recorded</span>}
              </p>
            </div>

            {/* BU Full Name */}
            <div className="p-3 bg-slate-50/70 rounded-2xl border border-slate-100 sm:col-span-2">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                BU Full Name
              </span>
              <p className="text-xs font-bold text-slate-800 mt-1">
                {candidate.bu_full_name || candidate.business_unit || (
                  <span className="text-slate-400 font-normal italic">Not recorded</span>
                )}
              </p>
            </div>

            {/* Handle BU */}
            <div className="p-3 bg-slate-50/70 rounded-2xl border border-slate-100">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                Handle BU
              </span>
              <p className="text-xs font-bold text-slate-800 mt-1">
                {candidate.handle_bu || <span className="text-slate-400 font-normal italic">Not recorded</span>}
              </p>
            </div>

            {/* Division */}
            <div className="p-3 bg-slate-50/70 rounded-2xl border border-slate-100">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                Division
              </span>
              <p className="text-xs font-bold text-slate-800 mt-1">
                {candidate.division || <span className="text-slate-400 font-normal italic">Not recorded</span>}
              </p>
            </div>

            {/* Department */}
            <div className="p-3 bg-slate-50/70 rounded-2xl border border-slate-100">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                Department
              </span>
              <p className="text-xs font-bold text-slate-800 mt-1">
                {candidate.department || candidate.job_postings?.department || (
                  <span className="text-slate-400 font-normal italic">Not recorded</span>
                )}
              </p>
            </div>

            {/* Position */}
            <div className="p-3 bg-slate-50/70 rounded-2xl border border-slate-100 sm:col-span-2">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                Position
              </span>
              <p className="text-xs font-bold text-slate-800 mt-1">
                {candidate.position || candidate.job_title || candidate.job_postings?.title || (
                  <span className="text-slate-400 font-normal italic">Not recorded</span>
                )}
              </p>
            </div>

            {/* Site (Physical Workplace Station) - Specially Styled */}
            <div className="p-3.5 bg-indigo-50/80 rounded-2xl border border-indigo-200/80 sm:col-span-2 lg:col-span-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-indigo-700 uppercase tracking-wider flex items-center gap-1.5">
                  <i className="ri-building-4-line text-indigo-600" />
                  <span>Site (Physical Workplace)</span>
                </span>
                <span className="text-[10px] font-bold text-indigo-600 bg-indigo-100/70 px-2 py-0.2 rounded-md">
                  Stationed Workplace
                </span>
              </div>
              <p className="text-xs font-extrabold text-indigo-950 mt-1">
                {candidate.site || <span className="text-slate-400 font-normal italic font-sans">No physical site assigned</span>}
              </p>
              <p className="text-[10px] text-indigo-600/80 font-medium mt-0.5">
                Specific branch, office building, or project location where employee is stationed.
              </p>
            </div>

            {/* Working Location */}
            <div className="p-3.5 bg-slate-50/70 rounded-2xl border border-slate-100 sm:col-span-2 lg:col-span-2">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                Working Location (City / Region)
              </span>
              <p className="text-xs font-bold text-slate-800 mt-1">
                {candidate.working_location || candidate.location || (
                  <span className="text-slate-400 font-normal italic">Not recorded</span>
                )}
              </p>
            </div>
          </div>
        </div>

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
                {candidate.basic_salary ? `$${candidate.basic_salary.toLocaleString()} / mo` : candidate.expected_salary ? `$${candidate.expected_salary.toLocaleString()} / mo` : "Pending"}
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
                    onClick={() => handleCopy(candidate.bank_account_number, "Bank Account")}
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
                    onClick={() => handleCopy(candidate.nssf_number, "NSSF Number")}
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
                  onClick={() => handleCopy(candidate.email, "Email")}
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
                    onClick={() => handleCopy(candidate.phone, "Phone")}
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
                    onClick={() => handleCopy(candidate.emergency_phone_number, "Emergency Phone")}
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

        {/* Edit Modal */}
        <EditHiringInfoModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          candidate={candidate}
          onSaved={handleSaved}
        />
      </div>
    );
  }
);
