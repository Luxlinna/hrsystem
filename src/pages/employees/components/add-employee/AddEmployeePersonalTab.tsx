import { memo } from "react";
import type { EmployeeFormState } from "../../types";

interface AddEmployeePersonalTabProps {
  form: EmployeeFormState;
  onChange: (field: keyof EmployeeFormState, value: any) => void;
}

export const AddEmployeePersonalTab = memo(function AddEmployeePersonalTab({
  form,
  onChange,
}: AddEmployeePersonalTabProps) {
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
            Official employee identity, Khmer script legal naming, gender, date of birth, marital status, and national identification number.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Employee Code / ID */}
        <div>
          <label className="block text-xs font-extrabold text-slate-700 mb-1">
            Employee Code / Biometric ID
          </label>
          <input
            type="text"
            value={form.employee_code || form.biometric_user_id || ""}
            onChange={(e) => {
              onChange("employee_code", e.target.value);
              onChange("biometric_user_id", e.target.value);
            }}
            placeholder="Auto-generated if left blank (e.g. 001)"
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-[#253C7D] focus:ring-1 focus:ring-[#253C7D]"
          />
          <p className="text-[10px] text-slate-400 mt-0.5">
            Leave blank to auto-sequence 3-digit PIN for device check-in
          </p>
        </div>

        {/* Full Name (English) */}
        <div>
          <label className="block text-xs font-extrabold text-slate-700 mb-1">
            Full Name (English) <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={form.full_name}
            onChange={(e) => {
              const val = e.target.value;
              onChange("full_name", val);
              const parts = val.trim().split(/\s+/);
              onChange("first_name", parts[0] || "");
              onChange("last_name", parts.slice(1).join(" ") || parts[0] || "");
            }}
            placeholder="e.g. Sok Dara"
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
            value={form.kh_name}
            onChange={(e) => onChange("kh_name", e.target.value)}
            placeholder="ឈ្មោះជាភាសាខ្មែរ (e.g. សុខ តារា)"
            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#253C7D] focus:ring-1 focus:ring-[#253C7D]"
          />
        </div>

        {/* Gender */}
        <div>
          <label className="block text-xs font-extrabold text-slate-700 mb-1">
            Gender
          </label>
          <select
            value={form.gender}
            onChange={(e) => onChange("gender", e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#253C7D] cursor-pointer"
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
            value={form.date_of_birth}
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
            value={form.marital_status}
            onChange={(e) => onChange("marital_status", e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#253C7D] cursor-pointer"
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
            National Identification Number (NID / Passport)
          </label>
          <input
            type="text"
            value={form.national_id_number}
            onChange={(e) => onChange("national_id_number", e.target.value)}
            placeholder="e.g. 010123456"
            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-[#253C7D]"
          />
        </div>
      </div>
    </div>
  );
});
