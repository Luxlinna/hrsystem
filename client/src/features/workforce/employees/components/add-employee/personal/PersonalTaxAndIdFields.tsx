import { memo } from "react";
import type { PersonalSectionProps } from "./types";
import { SearchableSelect } from "@/components/SearchableSelect";

const BLOOD_GROUP_OPTIONS = [
  "None",
  "A+",
  "A-",
  "B+",
  "B-",
  "AB+",
  "AB-",
  "O+",
  "O-",
];

const RELIGION_OPTIONS = [
  "None",
  "Buddhism",
  "Christianity",
  "Islam",
  "Hinduism",
  "Other",
];

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
          <SearchableSelect
            options={BLOOD_GROUP_OPTIONS}
            value={form.blood_group || "None"}
            onChange={(val) => onChange("blood_group", val)}
            placeholder="Select Blood Group"
          />
        </div>
      </div>

      {/* 2. Religion */}
      <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
        <label className="text-xs font-normal text-slate-700 sm:text-right sm:pr-4">
          Religion
        </label>
        <div className="sm:col-span-2">
          <SearchableSelect
            options={RELIGION_OPTIONS}
            value={form.religion || "None"}
            onChange={(val) => onChange("religion", val)}
            placeholder="Select Religion"
            searchPlaceholder="Search religion..."
          />
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
