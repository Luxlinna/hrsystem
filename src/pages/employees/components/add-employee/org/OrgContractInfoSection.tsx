import { memo } from "react";
import type { EmployeeFormState } from "../../../types";

interface OrgContractInfoSectionProps {
  form: EmployeeFormState;
  onChange: (field: keyof EmployeeFormState, value: any) => void;
  contractTypes?: string[];
}

export const OrgContractInfoSection = memo(function OrgContractInfoSection({
  form,
  onChange,
  contractTypes = [
    "1-YEAR FDC",
    "2-YEAR FDC",
    "3-YEAR FDC",
    "PERMANENT (UDC)",
    "PROBATION",
    "Internship",
  ],
}: OrgContractInfoSectionProps) {
  return (
    <div className="pt-6 border-t border-slate-100 w-full space-y-4">
      <h3 className="text-xs font-bold text-[#0088cc] uppercase tracking-wider">
        Contract Info
      </h3>

      <div className="space-y-3 max-w-xl">
        {/* 1. Contract Type */}
        <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
          <label className="text-xs font-normal text-slate-700 sm:text-right sm:pr-4">
            Contract Type <span className="text-rose-500">*</span>
          </label>
          <div className="sm:col-span-2">
            <select
              value={form.contract_type || ""}
              onChange={(e) => onChange("contract_type", e.target.value)}
              className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-800 focus:outline-none focus:border-[#0088cc] cursor-pointer"
            >
              <option value="">Select Contract Type</option>
              {contractTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 2. Effective Date */}
        <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
          <label className="text-xs font-normal text-slate-700 sm:text-right sm:pr-4">
            Effective Date <span className="text-rose-500">*</span>
          </label>
          <div className="sm:col-span-2">
            <input
              type="date"
              required
              value={form.contract_effective_date || form.start_date || ""}
              onChange={(e) => onChange("contract_effective_date", e.target.value)}
              className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-800 focus:outline-none focus:border-[#0088cc]"
            />
          </div>
        </div>

        {/* 3. Contract End Date */}
        <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
          <label className="text-xs font-normal text-slate-700 sm:text-right sm:pr-4">
            Contract End Date <span className="text-rose-500">*</span>
          </label>
          <div className="sm:col-span-2">
            <input
              type="date"
              value={form.contract_end_date || form.fdc_end_date || ""}
              onChange={(e) => {
                onChange("contract_end_date", e.target.value);
                onChange("fdc_end_date", e.target.value);
              }}
              className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-800 focus:outline-none focus:border-[#0088cc]"
            />
          </div>
        </div>

        {/* 4. Salary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
          <label className="text-xs font-normal text-slate-700 sm:text-right sm:pr-4">
            Salary <span className="text-rose-500">*</span>
          </label>
          <div className="sm:col-span-2 flex rounded border border-slate-300 bg-white overflow-hidden">
            <span className="px-2.5 py-1.5 bg-slate-50 text-slate-700 text-xs border-r border-slate-300 select-none">
              {form.contract_rate_currency || "USD"}
            </span>
            <input
              type="number"
              value={form.contract_rate ?? 0}
              onChange={(e) => onChange("contract_rate", e.target.value)}
              placeholder="0"
              className="flex-1 px-3 py-1.5 text-xs font-mono text-slate-800 focus:outline-none"
            />
            <span className="px-2.5 py-1.5 bg-slate-50 text-slate-700 text-xs border-l border-slate-300 select-none">
              {form.contract_rate_frequency || "Monthly"}
            </span>
          </div>
        </div>

        {/* 5. Salary After Contract */}
        <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
          <label className="text-xs font-normal text-slate-700 sm:text-right sm:pr-4">
            Salary After Contract <span className="text-rose-500">*</span>
          </label>
          <div className="sm:col-span-2 flex rounded border border-slate-300 bg-white overflow-hidden">
            <span className="px-2.5 py-1.5 bg-slate-50 text-slate-700 text-xs border-r border-slate-300 select-none">
              {form.contract_rate_after_currency || "USD"}
            </span>
            <input
              type="number"
              value={form.contract_rate_after ?? 0}
              onChange={(e) => onChange("contract_rate_after", e.target.value)}
              placeholder="0"
              className="flex-1 px-3 py-1.5 text-xs font-mono text-slate-800 focus:outline-none"
            />
            <span className="px-2.5 py-1.5 bg-slate-50 text-slate-700 text-xs border-l border-slate-300 select-none">
              {form.contract_rate_after_frequency || "Monthly"}
            </span>
          </div>
        </div>

        {/* 6. Remark */}
        <div className="grid grid-cols-1 sm:grid-cols-3 items-start gap-2">
          <label className="text-xs font-normal text-slate-700 sm:text-right sm:pr-4 pt-1.5">
            Remark
          </label>
          <div className="sm:col-span-2">
            <textarea
              rows={3}
              value={form.contract_remark || ""}
              onChange={(e) => onChange("contract_remark", e.target.value)}
              placeholder="Remark"
              className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#0088cc]"
            />
          </div>
        </div>
      </div>
    </div>
  );
});
