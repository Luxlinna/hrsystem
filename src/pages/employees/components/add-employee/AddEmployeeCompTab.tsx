import { memo } from "react";
import type { EmployeeFormState } from "../../types";

interface AddEmployeeCompTabProps {
  form: EmployeeFormState;
  onChange: (field: keyof EmployeeFormState, value: any) => void;
}

export const AddEmployeeCompTab = memo(function AddEmployeeCompTab({
  form,
  onChange,
}: AddEmployeeCompTabProps) {
  return (
    <div className="space-y-4">
      <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50/90 via-blue-50/40 to-white border border-emerald-200/80 flex items-start gap-3.5 shadow-2xs">
        <div className="w-9 h-9 rounded-xl bg-[#253C7D] text-white flex items-center justify-center shrink-0 shadow-xs">
          <i className="ri-money-dollar-circle-line text-lg" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-xs font-black text-slate-900 tracking-wide">
              Compensation, Tax &amp; Payroll Setup
            </h3>
            <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200/60">
              Step 4 of 5
            </span>
          </div>
          <p className="text-[11px] text-slate-600 font-medium mt-0.5 leading-relaxed">
            Base monthly salary, residency tax method, monthly allowances, bank account disbursement, and NSSF registration.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Basic Salary */}
        <div>
          <label className="block text-xs font-extrabold text-slate-700 mb-1">
            Basic Salary (USD $)
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-2.5 text-xs font-bold text-slate-400">
              $
            </span>
            <input
              type="number"
              step="0.01"
              value={form.basic_salary}
              onChange={(e) => onChange("basic_salary", e.target.value)}
              placeholder="e.g. 850.00"
              className="w-full pl-8 pr-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#253C7D]"
            />
          </div>
        </div>

        {/* Tax Method */}
        <div>
          <label className="block text-xs font-extrabold text-slate-700 mb-1">
            Tax Method
          </label>
          <select
            value={form.tax_method}
            onChange={(e) => onChange("tax_method", e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#253C7D] cursor-pointer"
          >
            <option value="Resident">Resident (Progressive 0% - 20%)</option>
            <option value="Non-resident">Non-resident (Flat 20%)</option>
            <option value="Standard">Standard Cambodian Payroll Tax</option>
            <option value="Gross">Gross Up</option>
            <option value="Net">Net Guaranteed</option>
          </select>
        </div>

        {/* Allowance */}
        <div className="md:col-span-2">
          <label className="block text-xs font-extrabold text-slate-700 mb-1">
            Allowance &amp; Monthly Benefits
          </label>
          <input
            type="text"
            value={form.allowance}
            onChange={(e) => onChange("allowance", e.target.value)}
            placeholder="e.g. $50 Food Allowance + $30 Transport Allowance"
            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#253C7D]"
          />
        </div>

        {/* Bank Account */}
        <div>
          <label className="block text-xs font-extrabold text-slate-700 mb-1">
            Bank Account Number &amp; Bank Name
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
            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-[#253C7D]"
          />
        </div>

        {/* NSSF Number */}
        <div>
          <label className="block text-xs font-extrabold text-slate-700 mb-1">
            NSSF Member Number
          </label>
          <input
            type="text"
            value={form.nssf_number}
            onChange={(e) => onChange("nssf_number", e.target.value)}
            placeholder="e.g. 1002345678"
            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-[#253C7D]"
          />
        </div>
      </div>
    </div>
  );
});
