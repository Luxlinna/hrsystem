import { memo } from "react";
import type { BranchPayrollPolicy } from "../../types";

interface BranchPayrollPolicyFormFieldsProps {
  form: Partial<BranchPayrollPolicy>;
  setForm: React.Dispatch<React.SetStateAction<Partial<BranchPayrollPolicy>>>;
}

export const BranchPayrollPolicyFormFields = memo(function BranchPayrollPolicyFormFields({
  form,
  setForm,
}: BranchPayrollPolicyFormFieldsProps) {
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block font-bold text-gray-700 mb-1">Pay Cycle</label>
          <select
            value={form.pay_cycle || "monthly"}
            onChange={(e) => setForm({ ...form, pay_cycle: e.target.value as any })}
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-semibold text-gray-800 focus:outline-none focus:border-[#253C7D] cursor-pointer"
          >
            <option value="monthly">Monthly</option>
            <option value="semi-monthly">Semi-Monthly</option>
            <option value="bi-weekly">Bi-Weekly</option>
            <option value="weekly">Weekly</option>
          </select>
        </div>

        <div>
          <label className="block font-bold text-gray-700 mb-1">Disbursement Currency</label>
          <input
            type="text"
            value={form.currency || "USD"}
            onChange={(e) => setForm({ ...form, currency: e.target.value })}
            placeholder="e.g. USD, EUR, KHR"
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-semibold text-gray-800 focus:outline-none focus:border-[#253C7D]"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block font-bold text-gray-700 mb-1">Monthly Pay Day</label>
          <input
            type="number"
            min="1"
            max="31"
            value={form.pay_day || 28}
            onChange={(e) => setForm({ ...form, pay_day: parseInt(e.target.value) || 28 })}
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-semibold text-gray-800 focus:outline-none focus:border-[#253C7D]"
          />
          <span className="text-[10px] text-gray-400 mt-0.5 block">e.g. 28th of every month</span>
        </div>

        <div>
          <label className="block font-bold text-gray-700 mb-1">Cut-Off Day</label>
          <input
            type="number"
            min="1"
            max="31"
            value={form.cutoff_day || 25}
            onChange={(e) => setForm({ ...form, cutoff_day: parseInt(e.target.value) || 25 })}
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-semibold text-gray-800 focus:outline-none focus:border-[#253C7D]"
          />
          <span className="text-[10px] text-gray-400 mt-0.5 block">Attendance / OT cut-off</span>
        </div>
      </div>

      <div className="p-3.5 bg-gray-50/80 border border-gray-200/80 rounded-2xl space-y-3">
        <h4 className="font-extrabold text-gray-800 text-[11px] uppercase tracking-wider">
          Statutory Tax &amp; Overtime Multipliers
        </h4>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="block text-[11px] font-semibold text-gray-600 mb-1">Tax Rate (%)</label>
            <input
              type="number"
              step="0.1"
              value={form.tax_rate ?? 5.0}
              onChange={(e) => setForm({ ...form, tax_rate: parseFloat(e.target.value) || 0 })}
              className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg font-bold text-gray-800 text-xs focus:outline-none focus:border-[#253C7D]"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-gray-600 mb-1">Social Sec (%)</label>
            <input
              type="number"
              step="0.1"
              value={form.social_security_rate ?? 4.0}
              onChange={(e) => setForm({ ...form, social_security_rate: parseFloat(e.target.value) || 0 })}
              className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg font-bold text-gray-800 text-xs focus:outline-none focus:border-[#253C7D]"
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-gray-600 mb-1">Overtime (x)</label>
            <input
              type="number"
              step="0.1"
              value={form.overtime_rate ?? 1.5}
              onChange={(e) => setForm({ ...form, overtime_rate: parseFloat(e.target.value) || 1.5 })}
              className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg font-bold text-gray-800 text-xs focus:outline-none focus:border-[#253C7D]"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block font-bold text-gray-700 mb-1">Branch Payroll Bank</label>
          <input
            type="text"
            value={form.bank_name || ""}
            onChange={(e) => setForm({ ...form, bank_name: e.target.value })}
            placeholder="e.g. ABA Bank / Canadia Bank"
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-semibold text-gray-800 focus:outline-none focus:border-[#253C7D]"
          />
        </div>

        <div>
          <label className="block font-bold text-gray-700 mb-1">Disbursement Account #</label>
          <input
            type="text"
            value={form.bank_account_number || ""}
            onChange={(e) => setForm({ ...form, bank_account_number: e.target.value })}
            placeholder="e.g. 001 234 567"
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-semibold text-gray-800 focus:outline-none focus:border-[#253C7D]"
          />
        </div>
      </div>

      <div className="space-y-2 pt-1">
        <label className="flex items-center gap-2.5 p-2.5 bg-gray-50 border border-gray-100 rounded-xl cursor-pointer hover:bg-gray-100/80">
          <input
            type="checkbox"
            checked={form.requires_two_tier_approval ?? true}
            onChange={(e) => setForm({ ...form, requires_two_tier_approval: e.target.checked })}
            className="rounded text-[#253C7D] focus:ring-0 cursor-pointer"
          />
          <span className="text-gray-700 font-semibold">
            Require 2-Tier Approval (Branch Manager sign-off before payout)
          </span>
        </label>

        <label className="flex items-center gap-2.5 p-2.5 bg-gray-50 border border-gray-100 rounded-xl cursor-pointer hover:bg-gray-100/80">
          <input
            type="checkbox"
            checked={form.auto_deduct_late_penalties ?? false}
            onChange={(e) => setForm({ ...form, auto_deduct_late_penalties: e.target.checked })}
            className="rounded text-[#253C7D] focus:ring-0 cursor-pointer"
          />
          <span className="text-gray-700 font-semibold">
            Auto-calculate late arrival deductions from Attendance logs
          </span>
        </label>
      </div>

      <div>
        <label className="block font-bold text-gray-700 mb-1">Branch Policy Notes / Remarks</label>
        <textarea
          rows={2}
          value={form.policy_notes || ""}
          onChange={(e) => setForm({ ...form, policy_notes: e.target.value })}
          placeholder="Internal branch compensation bylaws or special conditions..."
          className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:border-[#253C7D]"
        />
      </div>
    </>
  );
});
