import { memo } from "react";
import type { EmployeeFormState } from "../../../types";
import { PAYROLL_STRUCTURES } from "../../../constants";

interface CompPayrollInfoSectionProps {
  form: EmployeeFormState;
  onChange: (field: keyof EmployeeFormState, value: any) => void;
}

export const CompPayrollInfoSection = memo(function CompPayrollInfoSection({
  form,
  onChange,
}: CompPayrollInfoSectionProps) {
  return (
    <div className="p-5 bg-white border border-slate-200/90 rounded-2xl shadow-2xs space-y-4">
      <div className="flex items-center gap-2">
        <span className="w-6 h-6 rounded-lg bg-[#253C7D] text-white flex items-center justify-center text-xs shadow-2xs">
          <i className="ri-file-list-3-line text-xs" />
        </span>
        <h3 className="text-xs font-black text-[#253C7D] uppercase tracking-wider">
          Payroll Info
        </h3>
      </div>

      <div className="space-y-3">
        {/* Payroll Structure */}
        <div>
          <label className="block text-xs font-extrabold text-slate-700 mb-1">
            Payroll Structure
          </label>
          <select
            value={form.payroll_structure || "Standard Monthly"}
            onChange={(e) => onChange("payroll_structure", e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#253C7D] focus:ring-1 focus:ring-[#253C7D] transition-all shadow-2xs cursor-pointer"
          >
            <option value="">Select Payroll Structure</option>
            {PAYROLL_STRUCTURES.map((ps) => (
              <option key={ps} value={ps}>
                {ps}
              </option>
            ))}
          </select>
        </div>

        {/* Checkboxes */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-1">
          <label className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-slate-900 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={Boolean(form.apply_day_in_month)}
              onChange={(e) => onChange("apply_day_in_month", e.target.checked)}
              className="w-4 h-4 rounded text-[#253C7D] focus:ring-[#253C7D] border-slate-300 cursor-pointer"
            />
            <span>Apply Day In Month</span>
          </label>

          <label className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-slate-900 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={Boolean(form.apply_working_hours_per_day)}
              onChange={(e) => onChange("apply_working_hours_per_day", e.target.checked)}
              className="w-4 h-4 rounded text-[#253C7D] focus:ring-[#253C7D] border-slate-300 cursor-pointer"
            />
            <span>Apply Working Hours Per Day</span>
          </label>
        </div>

        {/* Integrated Basic Salary & Disbursement Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
          <div>
            <label className="block text-xs font-extrabold text-slate-700 mb-1">
              Base Monthly Salary ($)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">$</span>
              <input
                type="number"
                step="0.01"
                value={form.basic_salary}
                onChange={(e) => onChange("basic_salary", e.target.value)}
                placeholder="0.00"
                className="w-full pl-8 pr-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#253C7D] focus:ring-1 focus:ring-[#253C7D] transition-all shadow-2xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-extrabold text-slate-700 mb-1">
              Disbursement Bank &amp; Account Number
            </label>
            <input
              type="text"
              value={form.bank_account_number}
              onChange={(e) => {
                onChange("bank_account_number", e.target.value);
                const val = e.target.value;
                if (val.toLowerCase().includes("aba")) onChange("bank_name", "ABA Bank");
                else if (val.toLowerCase().includes("acleda")) onChange("bank_name", "ACLEDA Bank");
                else if (val.toLowerCase().includes("canadia")) onChange("bank_name", "Canadia Bank");
                else if (val.toLowerCase().includes("wing")) onChange("bank_name", "Wing Bank");
              }}
              placeholder="e.g. 001 234 567 (ABA Bank)"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-[#253C7D] focus:ring-1 focus:ring-[#253C7D] transition-all shadow-2xs"
            />
          </div>
        </div>
      </div>
    </div>
  );
});
