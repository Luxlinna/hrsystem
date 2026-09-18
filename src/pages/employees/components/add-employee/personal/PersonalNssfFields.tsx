import { memo } from "react";
import type { EmployeeNssfInfo } from "../../../types";
import { PersonalNssfStatusFields } from "./PersonalNssfStatusFields";

interface PersonalNssfFieldsProps {
  nssf: EmployeeNssfInfo;
  updateNssf: (field: keyof EmployeeNssfInfo, value: any) => void;
}

export const PersonalNssfFields = memo(function PersonalNssfFields({
  nssf,
  updateNssf,
}: PersonalNssfFieldsProps) {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-[#253C7D] uppercase tracking-wide">
          NSSF INFO
        </h3>

        <div className="space-y-3 max-w-4xl">
          {/* Identity Code of Worker */}
          <div className="grid grid-cols-1 md:grid-cols-12 items-center gap-2">
            <label className="md:col-span-4 text-xs font-medium text-slate-700 md:text-right md:pr-4">
              Identity Code of Worker <span className="text-rose-500">*</span>
            </label>
            <div className="md:col-span-8">
              <input
                type="text"
                required
                value={nssf.identity_code || ""}
                onChange={(e) => updateNssf("identity_code", e.target.value)}
                placeholder="Identity Code of Worker"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:border-[#253C7D]"
              />
            </div>
          </div>

          {/* NSSF Joining Date */}
          <div className="grid grid-cols-1 md:grid-cols-12 items-center gap-2">
            <label className="md:col-span-4 text-xs font-medium text-slate-700 md:text-right md:pr-4">
              NSSF Joining Date <span className="text-rose-500">*</span>
            </label>
            <div className="md:col-span-8">
              <input
                type="date"
                required
                value={nssf.joining_date || ""}
                onChange={(e) => updateNssf("joining_date", e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:border-[#253C7D]"
              />
            </div>
          </div>

          {/* First Name & Last Name */}
          <div className="grid grid-cols-1 md:grid-cols-12 items-center gap-2">
            <label className="md:col-span-4 text-xs font-medium text-slate-700 md:text-right md:pr-4">
              First Name <span className="text-rose-500">*</span>
            </label>
            <div className="md:col-span-8">
              <input
                type="text"
                required
                value={nssf.first_name_kh || ""}
                onChange={(e) => updateNssf("first_name_kh", e.target.value)}
                placeholder="First Name"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:border-[#253C7D]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 items-center gap-2">
            <label className="md:col-span-4 text-xs font-medium text-slate-700 md:text-right md:pr-4">
              Last Name <span className="text-rose-500">*</span>
            </label>
            <div className="md:col-span-8">
              <input
                type="text"
                required
                value={nssf.last_name_kh || ""}
                onChange={(e) => updateNssf("last_name_kh", e.target.value)}
                placeholder="Last Name"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:border-[#253C7D]"
              />
            </div>
          </div>

          {/* First Name in Latin & Last Name in Latin */}
          <div className="grid grid-cols-1 md:grid-cols-12 items-center gap-2">
            <label className="md:col-span-4 text-xs font-medium text-slate-700 md:text-right md:pr-4">
              First Name in Latin
            </label>
            <div className="md:col-span-8">
              <input
                type="text"
                value={nssf.first_name_latin || ""}
                onChange={(e) => updateNssf("first_name_latin", e.target.value)}
                placeholder="First Name in Latin"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:border-[#253C7D]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 items-center gap-2">
            <label className="md:col-span-4 text-xs font-medium text-slate-700 md:text-right md:pr-4">
              Last Name in Latin
            </label>
            <div className="md:col-span-8">
              <input
                type="text"
                value={nssf.last_name_latin || ""}
                onChange={(e) => updateNssf("last_name_latin", e.target.value)}
                placeholder="Last Name in Latin"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:border-[#253C7D]"
              />
            </div>
          </div>

          {/* Monthly Wage Type & Monthly Wage */}
          <div className="grid grid-cols-1 md:grid-cols-12 items-center gap-2">
            <label className="md:col-span-4 text-xs font-medium text-slate-700 md:text-right md:pr-4">
              Monthly Wage Type <span className="text-rose-500">*</span>
            </label>
            <div className="md:col-span-8">
              <select
                value={nssf.monthly_wage_type || "Formula"}
                onChange={(e) => updateNssf("monthly_wage_type", e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:border-[#253C7D] cursor-pointer"
              >
                <option value="Formula">Formula</option>
                <option value="Gross Salary">Gross Salary</option>
                <option value="Net Salary">Net Salary</option>
                <option value="Fixed Rate">Fixed Rate</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 items-center gap-2">
            <label className="md:col-span-4 text-xs font-medium text-slate-700 md:text-right md:pr-4">
              Monthly Wage <span className="text-rose-500">*</span>
            </label>
            <div className="md:col-span-8">
              <select
                value={nssf.monthly_wage || "Taxable Salary"}
                onChange={(e) => updateNssf("monthly_wage", e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:border-[#253C7D] cursor-pointer"
              >
                <option value="Taxable Salary">Taxable Salary</option>
                <option value="Basic Salary">Basic Salary</option>
                <option value="Gross Salary">Gross Salary</option>
                <option value="Actual Earnings">Actual Earnings</option>
              </select>
            </div>
          </div>

          {/* Seniority Pension Fund Payment */}
          <div className="grid grid-cols-1 md:grid-cols-12 items-center gap-2">
            <label className="md:col-span-4 text-xs font-medium text-slate-700 md:text-right md:pr-4">
              Seniority Pension Fund Payment
            </label>
            <div className="md:col-span-8">
              <input
                type="text"
                value={nssf.seniority_pension_fund || ""}
                onChange={(e) => updateNssf("seniority_pension_fund", e.target.value)}
                placeholder="Seniority Pension Fund Payment"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:border-[#253C7D]"
              />
            </div>
          </div>

          {/* Remark */}
          <div className="grid grid-cols-1 md:grid-cols-12 items-start gap-2">
            <label className="md:col-span-4 text-xs font-medium text-slate-700 md:text-right md:pr-4 md:pt-2">
              Remark
            </label>
            <div className="md:col-span-8">
              <textarea
                rows={3}
                value={nssf.remark || ""}
                onChange={(e) => updateNssf("remark", e.target.value)}
                placeholder="Remark"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:border-[#253C7D] resize-y"
              />
            </div>
          </div>
        </div>
      </div>

      <PersonalNssfStatusFields nssf={nssf} updateNssf={updateNssf} />
    </div>
  );
});
