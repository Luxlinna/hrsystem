import { memo } from "react";
import type { PersonalSectionProps } from "./types";

export const PersonalTaxAndIdFields = memo(function PersonalTaxAndIdFields({
  form,
  onChange,
}: PersonalSectionProps) {
  return (
    <div className="space-y-3 pt-1">
      {/* 1. Blood Group */}
      <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
        <label className="text-xs font-normal text-slate-700 sm:text-right sm:pr-4">
          Blood Group
        </label>
        <div className="sm:col-span-2">
          <select
            value={form.blood_group || "None"}
            onChange={(e) => onChange("blood_group", e.target.value)}
            className="w-full px-3 py-1.5 rounded bg-white border border-slate-300 text-xs text-slate-800 focus:outline-none focus:border-[#253C7D] focus:ring-1 focus:ring-[#253C7D] cursor-pointer"
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

      {/* 2. Religion */}
      <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
        <label className="text-xs font-normal text-slate-700 sm:text-right sm:pr-4">
          Religion
        </label>
        <div className="sm:col-span-2">
          <select
            value={form.religion || "None"}
            onChange={(e) => onChange("religion", e.target.value)}
            className="w-full px-3 py-1.5 rounded bg-white border border-slate-300 text-xs text-slate-800 focus:outline-none focus:border-[#253C7D] focus:ring-1 focus:ring-[#253C7D] cursor-pointer"
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

      {/* 3. Employee Tax Number */}
      <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
        <label className="text-xs font-normal text-slate-700 sm:text-right sm:pr-4">
          Employee Tax Number
        </label>
        <div className="sm:col-span-2">
          <input
            type="text"
            value={form.employee_tax_number || ""}
            onChange={(e) => onChange("employee_tax_number", e.target.value)}
            placeholder="Employee Tax Number"
            className="w-full px-3 py-1.5 rounded bg-white border border-slate-300 text-xs font-mono text-slate-800 focus:outline-none focus:border-[#253C7D] focus:ring-1 focus:ring-[#253C7D]"
          />
        </div>
      </div>

      {/* 4. NSSF Number */}
      <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
        <label className="text-xs font-normal text-slate-700 sm:text-right sm:pr-4">
          NSSF Number
        </label>
        <div className="sm:col-span-2">
          <input
            type="text"
            value={form.nssf_number || ""}
            onChange={(e) => {
              const val = e.target.value;
              onChange("nssf_number", val);
              if (val.trim() && !form.register_nssf) {
                onChange("register_nssf", true);
              }
            }}
            placeholder="e.g. 10293847 or NSSF ID"
            className="w-full px-3 py-1.5 rounded bg-white border border-slate-300 text-xs font-mono text-slate-800 focus:outline-none focus:border-[#253C7D] focus:ring-1 focus:ring-[#253C7D]"
          />
        </div>
      </div>
    </div>
  );
});
