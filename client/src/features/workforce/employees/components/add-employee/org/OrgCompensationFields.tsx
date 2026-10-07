import { memo } from "react";
import type { EmployeeFormState } from "../../../types";
import { SearchableSelect } from "@/components/SearchableSelect";

interface OrgCompensationFieldsProps {
  form: EmployeeFormState;
  onChange: (field: keyof EmployeeFormState, value: any) => void;
}

export const OrgCompensationFields = memo(function OrgCompensationFields({
  form,
  onChange,
}: OrgCompensationFieldsProps) {
  return (
    <>
      {/* Salary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
        <label className="text-xs font-normal text-slate-700 sm:text-right sm:pr-4">
          Salary <span className="text-rose-500">*</span>
        </label>
        <div className="sm:col-span-2 flex rounded border border-slate-300 bg-white overflow-hidden focus-within:border-[#253C7D] focus-within:ring-1 focus-within:ring-[#253C7D]">
          <select
            value={form.tax_salary_currency || "USD"}
            onChange={(e) => onChange("tax_salary_currency", e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 text-slate-700 text-xs border-r border-slate-300 focus:outline-none cursor-pointer"
          >
            <option value="USD">USD</option>
            <option value="KHR">KHR</option>
          </select>
          <input
            type="number"
            value={form.basic_salary ?? 0}
            onChange={(e) => {
              const val = e.target.value;
              onChange("basic_salary", val);
              onChange("tax_salary", val);
              if (!form.contract_rate) onChange("contract_rate", val);
            }}
            placeholder="0"
            className="flex-1 px-3 py-1.5 text-xs font-mono text-slate-800 focus:outline-none"
          />
          <select
            value={form.tax_salary_frequency || "Monthly"}
            onChange={(e) => onChange("tax_salary_frequency", e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 text-slate-700 text-xs border-l border-slate-300 focus:outline-none cursor-pointer"
          >
            <option value="Monthly">Monthly</option>
            <option value="Hourly">Hourly</option>
            <option value="Daily">Daily</option>
          </select>
        </div>
      </div>

      {/* Salary Type */}
      <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
        <label className="text-xs font-normal text-slate-700 sm:text-right sm:pr-4">
          Salary Type <span className="text-rose-500">*</span>
        </label>
        <div className="sm:col-span-2">
          <SearchableSelect
            options={["Gross", "Net"]}
            value={form.payroll_structure || "Gross"}
            onChange={(val) => onChange("payroll_structure", val)}
            placeholder="Select Salary Type"
          />
        </div>
      </div>
    </>
  );
});
