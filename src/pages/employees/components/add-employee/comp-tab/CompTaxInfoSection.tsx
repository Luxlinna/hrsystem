import { memo } from "react";
import type { EmployeeFormState } from "../../../types";

interface CompTaxInfoSectionProps {
  form: EmployeeFormState;
  onChange: (field: keyof EmployeeFormState, value: any) => void;
}

export const CompTaxInfoSection = memo(function CompTaxInfoSection({
  form,
  onChange,
}: CompTaxInfoSectionProps) {
  return (
    <div className="p-5 bg-white border border-slate-200/90 rounded-2xl shadow-2xs space-y-4">
      <div className="flex items-center gap-2">
        <span className="w-6 h-6 rounded-lg bg-[#253C7D] text-white flex items-center justify-center text-xs shadow-2xs">
          <i className="ri-percent-line text-xs" />
        </span>
        <h3 className="text-xs font-black text-[#253C7D] uppercase tracking-wider">
          Tax Info
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Tax Salary (USD [ input ] Monthly) */}
        <div>
          <label className="block text-xs font-extrabold text-slate-700 mb-1">
            Tax Salary
          </label>
          <div className="flex rounded-xl overflow-hidden border border-slate-300 bg-white shadow-2xs focus-within:border-[#253C7D] focus-within:ring-1 focus-within:ring-[#253C7D]">
            <span className="px-3.5 py-2.5 bg-slate-100 text-slate-600 text-xs font-bold border-r border-slate-200 select-none">
              {form.tax_salary_currency || "USD"}
            </span>
            <input
              type="number"
              step="0.01"
              value={form.tax_salary ?? ""}
              onChange={(e) => onChange("tax_salary", e.target.value)}
              placeholder="Tax Salary"
              className="flex-1 px-3.5 py-2.5 text-xs font-mono font-bold text-slate-900 focus:outline-none"
            />
            <span className="px-3.5 py-2.5 bg-slate-50 text-slate-600 text-xs font-bold border-l border-slate-200 select-none">
              {form.tax_salary_frequency || "Monthly"}
            </span>
          </div>
        </div>

        {/* Tax Method */}
        <div>
          <label className="block text-xs font-extrabold text-slate-700 mb-1">
            Tax Method
          </label>
          <select
            value={form.tax_method || "Resident"}
            onChange={(e) => onChange("tax_method", e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#253C7D] focus:ring-1 focus:ring-[#253C7D] cursor-pointer transition-all shadow-2xs"
          >
            <option value="Resident">Resident (Progressive 0% - 20%)</option>
            <option value="Non-resident">Non-resident (Flat 20%)</option>
            <option value="Standard">Standard Cambodian Payroll Tax</option>
            <option value="Gross">Gross Up</option>
            <option value="Net">Net Guaranteed</option>
          </select>
        </div>
      </div>
    </div>
  );
});
