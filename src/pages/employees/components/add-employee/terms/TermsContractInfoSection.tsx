import { memo } from "react";
import type { EmployeeFormState } from "../../types";

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
      <h3 className="text-xs font-black text-[#253C7D] uppercase tracking-wider mb-2">
        Contract Info
      </h3>

      <div className="space-y-4 max-w-3xl mx-auto">
        {/* 1. Contract Type */}
        <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
          <label className="text-xs font-bold text-slate-700 sm:text-right sm:pr-4">
            Contract Type <span className="text-rose-500">*</span>
          </label>
          <div className="sm:col-span-2">
            <select
              value={form.contract_type || ""}
              onChange={(e) => onChange("contract_type", e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#253C7D] cursor-pointer"
            >
              <option value="">Select</option>
              <option value="FDC">FDC (Fixed Duration Contract)</option>
              <option value="UDC">UDC (Undetermined Duration Contract)</option>
              <option value="Probationary">Probationary Contract</option>
              <option value="Internship">Internship Agreement</option>
              <option value="Casual">Casual / Project Basis</option>
              <option value="Part Time">Part Time Agreement</option>
            </select>
          </div>
        </div>

        {/* 2. Effective Date */}
        <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
          <label className="text-xs font-bold text-slate-700 sm:text-right sm:pr-4">
            Effective Date <span className="text-rose-500">*</span>
          </label>
          <div className="sm:col-span-2 relative flex items-center">
            <input
              type="date"
              required
              value={form.contract_effective_date || form.start_date || ""}
              onChange={(e) => onChange("contract_effective_date", e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-300 text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#253C7D]"
            />
          </div>
        </div>

        {/* 3. Contract End Date */}
        <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
          <label className="text-xs font-bold text-slate-700 sm:text-right sm:pr-4">
            Contract End Date <span className="text-rose-500">*</span>
          </label>
          <div className="sm:col-span-2 relative flex items-center">
            <input
              type="date"
              value={form.contract_end_date || form.fdc_end_date || ""}
              onChange={(e) => {
                onChange("contract_end_date", e.target.value);
                onChange("fdc_end_date", e.target.value);
              }}
              className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#253C7D]"
            />
          </div>
        </div>

        {/* 4. Rate */}
        <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
          <label className="text-xs font-bold text-slate-700 sm:text-right sm:pr-4">
            Rate <span className="text-rose-500">*</span>
          </label>
          <div className="sm:col-span-2 flex rounded-xl overflow-hidden border border-slate-300 bg-white">
            <span className="px-3.5 py-2 bg-slate-100 text-slate-600 text-xs font-bold border-r border-slate-200 select-none">
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
              className="flex-1 px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-none"
            />
            <select
              value={form.contract_rate_frequency || "Monthly"}
              onChange={(e) => onChange("contract_rate_frequency", e.target.value)}
              className="px-3 py-2 bg-slate-50 text-slate-700 text-xs font-bold border-l border-slate-200 focus:outline-none cursor-pointer"
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
        <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
          <label className="text-xs font-bold text-slate-700 sm:text-right sm:pr-4">
            Rate After Contract <span className="text-rose-500">*</span>
          </label>
          <div className="sm:col-span-2 flex rounded-xl overflow-hidden border border-slate-300 bg-white">
            <span className="px-3.5 py-2 bg-slate-100 text-slate-600 text-xs font-bold border-r border-slate-200 select-none">
              {form.contract_rate_after_currency || "USD"}
            </span>
            <input
              type="number"
              value={form.contract_rate_after ?? 0}
              onChange={(e) => onChange("contract_rate_after", e.target.value)}
              placeholder="0"
              className="flex-1 px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:outline-none"
            />
            <select
              value={form.contract_rate_after_frequency || "Monthly"}
              onChange={(e) => onChange("contract_rate_after_frequency", e.target.value)}
              className="px-3 py-2 bg-slate-50 text-slate-700 text-xs font-bold border-l border-slate-200 focus:outline-none cursor-pointer"
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
        <div className="grid grid-cols-1 sm:grid-cols-3 items-start gap-2">
          <label className="text-xs font-bold text-slate-700 sm:text-right sm:pr-4 pt-2">
            Remark
          </label>
          <div className="sm:col-span-2">
            <textarea
              rows={2}
              value={form.contract_remark || ""}
              onChange={(e) => onChange("contract_remark", e.target.value)}
              placeholder="Remark"
              className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-xs font-medium text-slate-900 focus:outline-none focus:border-[#253C7D]"
            />
          </div>
        </div>
      </div>
    </div>
  );
});
