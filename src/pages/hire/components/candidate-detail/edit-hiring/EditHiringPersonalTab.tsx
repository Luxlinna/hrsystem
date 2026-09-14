import { memo } from "react";
import type { Candidate } from "../../../types";
import type { EditHiringFormData } from "./types";

interface EditHiringPersonalTabProps {
  candidate: Candidate;
  formData: EditHiringFormData;
  onChange: (field: keyof EditHiringFormData, value: string) => void;
}

export const EditHiringPersonalTab = memo(function EditHiringPersonalTab({
  candidate,
  formData,
  onChange,
}: EditHiringPersonalTabProps) {
  return (
    <div className="space-y-4">
      <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50/90 via-indigo-50/50 to-white border border-blue-200/80 flex items-start gap-3.5 shadow-2xs">
        <div className="w-9 h-9 rounded-xl bg-[#253C7D] text-white flex items-center justify-center shrink-0 shadow-xs">
          <i className="ri-user-3-line text-lg" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-xs font-black text-slate-900 tracking-wide">
              Personal &amp; Legal Identification
            </h3>
            <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200/60">
              Step 1 of 5
            </span>
          </div>
          <p className="text-[11px] text-slate-600 font-medium mt-0.5 leading-relaxed">
            Official candidate identity, Khmer script legal naming, gender, date of birth, marital status, and national identification number.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Candidate Code (Read-Only) */}
        <div>
          <label className="block text-xs font-extrabold text-slate-700 mb-1">
            Candidate Code / ID
          </label>
          <input
            type="text"
            disabled
            value={candidate.candidate_code || candidate.id || "System Assigned"}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-mono font-bold text-slate-600 cursor-not-allowed"
          />
        </div>

        {/* Full Name (English) */}
        <div>
          <label className="block text-xs font-extrabold text-slate-700 mb-1">
            Full Name (English) <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={formData.full_name}
            onChange={(e) => onChange("full_name", e.target.value)}
            placeholder="Candidate full name"
            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#253C7D] focus:ring-1 focus:ring-[#253C7D]"
          />
        </div>

        {/* Khmer Name */}
        <div>
          <label className="block text-xs font-extrabold text-slate-700 mb-1">
            Khmer Name (KH Name)
          </label>
          <input
            type="text"
            value={formData.kh_name}
            onChange={(e) => onChange("kh_name", e.target.value)}
            placeholder="ឈ្មោះជាភាសាខ្មែរ"
            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#253C7D] focus:ring-1 focus:ring-[#253C7D]"
          />
        </div>

        {/* Gender */}
        <div>
          <label className="block text-xs font-extrabold text-slate-700 mb-1">
            Gender
          </label>
          <select
            value={formData.gender}
            onChange={(e) => onChange("gender", e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#253C7D]"
          >
            <option value="">-- Select Gender --</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {/* Date of Birth */}
        <div>
          <label className="block text-xs font-extrabold text-slate-700 mb-1">
            Date of Birth
          </label>
          <input
            type="date"
            value={formData.date_of_birth}
            onChange={(e) => onChange("date_of_birth", e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#253C7D]"
          />
        </div>

        {/* Marital Status */}
        <div>
          <label className="block text-xs font-extrabold text-slate-700 mb-1">
            Marital Status
          </label>
          <select
            value={formData.marital_status}
            onChange={(e) => onChange("marital_status", e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#253C7D]"
          >
            <option value="">-- Select Marital Status --</option>
            <option value="Single">Single</option>
            <option value="Married">Married</option>
            <option value="Divorced">Divorced</option>
            <option value="Widowed">Widowed</option>
          </select>
        </div>

        {/* National ID Number */}
        <div className="md:col-span-2">
          <label className="block text-xs font-extrabold text-slate-700 mb-1">
            National ID Number (Khmer ID / Passport)
          </label>
          <input
            type="text"
            value={formData.national_id_number}
            onChange={(e) => onChange("national_id_number", e.target.value)}
            placeholder="Khmer ID / Passport Number"
            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-[#253C7D]"
          />
        </div>
      </div>
    </div>
  );
});
