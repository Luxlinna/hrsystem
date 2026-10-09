import { memo } from "react";
import type { EmployeeFormState } from "../../../types";
import { SearchableSelect } from "@/components/SearchableSelect";
import { DatePickerDMY } from "@/components/common/DatePickerDMY";

const CONTRACT_TYPE_OPTIONS = [
  "FDC (Fixed Duration Contract)",
  "UDC (Undetermined Duration Contract)",
  "Probationary Contract",
  "Internship Agreement",
  "Casual / Project Basis",
  "Part Time Agreement",
];

interface TermsContractInfoSectionProps {
  form: EmployeeFormState;
  onChange: (field: keyof EmployeeFormState, value: any) => void;
}

export const TermsContractInfoSection = memo(function TermsContractInfoSection({
  form,
  onChange,
}: TermsContractInfoSectionProps) {
  return (
    <div className="pt-6 border-t border-slate-200/80 w-full space-y-4">
      <div className="flex items-center gap-2">
        <span className="w-6 h-6 rounded-lg bg-[#253C7D] text-white flex items-center justify-center text-xs shadow-2xs">
          <i className="ri-file-paper-2-line text-xs" />
        </span>
        <h3 className="text-xs font-black text-[#253C7D] uppercase tracking-wider">
          Contract Info
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* 1. Contract Type */}
        <div>
          <label className="block text-xs font-extrabold text-slate-700 mb-1">
            Contract Type <span className="text-rose-500">*</span>
          </label>
          <SearchableSelect
            options={CONTRACT_TYPE_OPTIONS}
            value={form.contract_type || ""}
            onChange={(val) => onChange("contract_type", val)}
            placeholder="Select Contract Type"
            searchPlaceholder="Search contract type..."
            showClear
          />
        </div>

        {/* 2. Effective Date */}
        <div>
          <label className="block text-xs font-extrabold text-slate-700 mb-1">
            Effective Date <span className="text-rose-500">*</span>
          </label>
          <DatePickerDMY
            required
            value={form.contract_effective_date || form.start_date || ""}
            onChange={(val) => onChange("contract_effective_date", val)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#253C7D] focus:ring-1 focus:ring-[#253C7D] transition-all shadow-2xs"
          />
        </div>

        {/* 3. Contract End Date */}
        <div>
          <label className="block text-xs font-extrabold text-slate-700 mb-1">
            Contract End Date <span className="text-rose-500">*</span>
          </label>
          <DatePickerDMY
            value={form.contract_end_date || form.fdc_end_date || ""}
            onChange={(val) => {
              onChange("contract_end_date", val);
              onChange("fdc_end_date", val);
            }}
            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#253C7D] focus:ring-1 focus:ring-[#253C7D] transition-all shadow-2xs"
          />
        </div>

        {/* 4. Rate */}
        <div>
          <label className="block text-xs font-extrabold text-slate-700 mb-1">
            Rate <span className="text-rose-500">*</span>
          </label>
          <div className="flex rounded-xl overflow-hidden border border-slate-300 bg-white shadow-2xs">
            <span className="px-3.5 py-2.5 bg-slate-100 text-slate-600 text-xs font-bold border-r border-slate-200 select-none">
              {form.contract_rate_currency || "USD"}
            </span>
            <input
              type="number"
              value={form.contract_rate ?? 0}
              onChange={(e) => {
                const val = e.target.value;
                onChange("contract_rate", val);
                if (!form.basic_salary) {
                  onChange("basic_salary", val);
                }
              }}
              placeholder="0"
              className="flex-1 px-3 py-2.5 text-xs font-mono font-bold text-slate-900 focus:outline-none"
            />
            <select
              value={form.contract_rate_frequency || "Monthly"}
              onChange={(e) => onChange("contract_rate_frequency", e.target.value)}
              className="px-3 py-2.5 bg-slate-50 text-slate-700 text-xs font-bold border-l border-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="Monthly">Monthly</option>
              <option value="Hourly">Hourly</option>
              <option value="Daily">Daily</option>
              <option value="Weekly">Weekly</option>
              <option value="Yearly">Yearly</option>
            </select>
          </div>
        </div>

        {/* 5. Rate After Contract */}
        <div>
          <label className="block text-xs font-extrabold text-slate-700 mb-1">
            Rate After Contract <span className="text-rose-500">*</span>
          </label>
          <div className="flex rounded-xl overflow-hidden border border-slate-300 bg-white shadow-2xs">
            <span className="px-3.5 py-2.5 bg-slate-100 text-slate-600 text-xs font-bold border-r border-slate-200 select-none">
              {form.contract_rate_after_currency || "USD"}
            </span>
            <input
              type="number"
              value={form.contract_rate_after ?? 0}
              onChange={(e) => onChange("contract_rate_after", e.target.value)}
              placeholder="0"
              className="flex-1 px-3 py-2.5 text-xs font-mono font-bold text-slate-900 focus:outline-none"
            />
            <select
              value={form.contract_rate_after_frequency || "Monthly"}
              onChange={(e) => onChange("contract_rate_after_frequency", e.target.value)}
              className="px-3 py-2.5 bg-slate-50 text-slate-700 text-xs font-bold border-l border-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="Monthly">Monthly</option>
              <option value="Hourly">Hourly</option>
              <option value="Daily">Daily</option>
              <option value="Weekly">Weekly</option>
              <option value="Yearly">Yearly</option>
            </select>
          </div>
        </div>

        {/* 6. Remark */}
        <div className="md:col-span-2 lg:col-span-1">
          <label className="block text-xs font-extrabold text-slate-700 mb-1">
            Remark
          </label>
          <input
            type="text"
            value={form.contract_remark || ""}
            onChange={(e) => onChange("contract_remark", e.target.value)}
            placeholder="e.g. Probation period review after 3 months"
            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-medium text-slate-900 focus:outline-none focus:border-[#253C7D] focus:ring-1 focus:ring-[#253C7D] transition-all shadow-2xs"
          />
        </div>
      </div>
    </div>
  );
});
