import { memo } from "react";
import type { PersonalSectionProps } from "./types";

export const PersonalTaxAndIdFields = memo(function PersonalTaxAndIdFields({
  form,
  onChange,
}: PersonalSectionProps) {
  return (
    <div className="space-y-4">
      {/* Blood Group */}
      <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
        <label className="text-xs font-bold text-slate-700 sm:text-right sm:pr-4">
          Blood Group
        </label>
        <div className="sm:col-span-2">
          <select
            value={form.blood_group || "None"}
            onChange={(e) => onChange("blood_group", e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#253C7D] cursor-pointer"
          >
            <option value="None">None</option>
            <option value="A+">A+</option>
            <option value="A-">A-</option>
            <option value="B+">B+</option>
            <option value="B-">B-</option>
            <option value="AB+">AB+</option>
            <option value="AB-">AB-</option>
            <option value="O+">O+</option>
            <option value="O-">O-</option>
          </select>
        </div>
      </div>

      {/* Religion */}
      <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
        <label className="text-xs font-bold text-slate-700 sm:text-right sm:pr-4">
          Religion
        </label>
        <div className="sm:col-span-2">
          <select
            value={form.religion || "None"}
            onChange={(e) => onChange("religion", e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#253C7D] cursor-pointer"
          >
            <option value="None">None</option>
            <option value="Buddhism">Buddhism</option>
            <option value="Christianity">Christianity</option>
            <option value="Islam">Islam</option>
            <option value="Hinduism">Hinduism</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>

      {/* Employee Tax Number */}
      <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
        <label className="text-xs font-bold text-slate-700 sm:text-right sm:pr-4">
          Employee Tax Number
        </label>
        <div className="sm:col-span-2">
          <input
            type="text"
            value={form.employee_tax_number}
            onChange={(e) => onChange("employee_tax_number", e.target.value)}
            placeholder="Employee Tax Number"
            className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-[#253C7D]"
          />
        </div>
      </div>

      {/* National ID Number */}
      <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
        <label className="text-xs font-bold text-slate-700 sm:text-right sm:pr-4">
          National ID / Passport
        </label>
        <div className="sm:col-span-2">
          <input
            type="text"
            value={form.national_id_number}
            onChange={(e) => onChange("national_id_number", e.target.value)}
            placeholder="National Identification Number"
            className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-[#253C7D]"
          />
        </div>
      </div>
    </div>
  );
});
