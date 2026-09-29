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
    <div className="space-y-4 pt-4 border-t border-slate-100">
      <h3 className="text-xs font-bold text-[#0088cc] uppercase tracking-wider">
        TAX INFO
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] items-center gap-y-3 gap-x-6">
        <label className="text-xs font-semibold text-slate-700 sm:text-right">
          Tax Salary
        </label>
        <div className="max-w-xl">
          <div className="flex rounded-md overflow-hidden border border-slate-300 bg-white shadow-2xs focus-within:border-[#0088cc] focus-within:ring-1 focus-within:ring-[#0088cc]">
            <span className="px-3.5 py-2 bg-slate-100 text-slate-600 text-xs font-medium border-r border-slate-200 select-none">
              {form.tax_salary_currency || "USD"}
            </span>
            <input
              type="number"
              step="0.01"
              value={form.tax_salary ?? ""}
              onChange={(e) => onChange("tax_salary", e.target.value)}
              placeholder="Tax Salary"
              className="flex-1 px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none bg-white"
            />
            <span className="px-3.5 py-2 bg-slate-100 text-slate-600 text-xs font-medium border-l border-slate-200 select-none">
              {form.tax_salary_frequency || "Monthly"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
});
