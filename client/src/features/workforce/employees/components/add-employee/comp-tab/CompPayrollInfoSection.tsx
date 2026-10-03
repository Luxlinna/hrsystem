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
    <div className="space-y-4 pt-1">
      <h3 className="text-xs font-bold text-[#253C7D] uppercase tracking-wider">
        PAYROLL INFO
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] items-start gap-y-3 gap-x-6">
        <label className="text-xs font-semibold text-slate-700 sm:text-right pt-2">
          Payroll Structure
        </label>
        <div className="space-y-3 max-w-xl">
          <select
            value={form.payroll_structure || ""}
            onChange={(e) => onChange("payroll_structure", e.target.value)}
            className="w-full px-3.5 py-2 rounded-md bg-white border border-slate-300 text-xs text-slate-800 focus:outline-none focus:border-[#253C7D] focus:ring-1 focus:ring-[#253C7D] transition-all cursor-pointer"
          >
            <option value="">Select</option>
            {PAYROLL_STRUCTURES.map((ps) => (
              <option key={ps} value={ps}>
                {ps}
              </option>
            ))}
          </select>

          <div className="space-y-2.5 pt-1">
            <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={Boolean(form.apply_day_in_month)}
                onChange={(e) => onChange("apply_day_in_month", e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-[#253C7D] focus:ring-[#253C7D] cursor-pointer"
              />
              <span>Apply Day In Month</span>
            </label>

            <label className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={Boolean(form.apply_working_hours_per_day)}
                onChange={(e) => onChange("apply_working_hours_per_day", e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-[#253C7D] focus:ring-[#253C7D] cursor-pointer"
              />
              <span>Apply Working Hours Per Day</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
});
