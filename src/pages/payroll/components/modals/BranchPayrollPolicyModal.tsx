import React, { useState, useEffect, memo } from "react";
import type { BranchPayrollPolicy, Branch } from "../../types";

interface BranchPayrollPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  policy: BranchPayrollPolicy | null;
  branchName?: string;
  isSuperAdmin: boolean;
  canManage: boolean;
  saving: boolean;
  onSave: (policyUpdates: Partial<BranchPayrollPolicy>) => void;
}

export const BranchPayrollPolicyModal = memo(function BranchPayrollPolicyModal({
  isOpen,
  onClose,
  policy,
  branchName,
  isSuperAdmin,
  canManage,
  saving,
  onSave,
}: BranchPayrollPolicyModalProps) {
  const [form, setForm] = useState<Partial<BranchPayrollPolicy>>({});

  useEffect(() => {
    if (policy) {
      setForm({ ...policy });
    }
  }, [policy]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/50 backdrop-blur-xs overflow-y-auto no-scrollbar"
      onClick={() => !saving && onClose()}
    >
      <div
        className="bg-white rounded-3xl w-full max-w-xl shadow-2xl border border-gray-100/90 overflow-hidden flex flex-col animate-in zoom-in-95 duration-150 max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-gray-100 bg-gradient-to-r from-slate-50 via-gray-50/50 to-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#253C7D] text-white flex items-center justify-center font-bold text-xl shrink-0 shadow-xs">
              <i className="ri-shield-keyhole-line" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-gray-900 tracking-tight">
                Branch Payroll Policy &amp; Security
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                {branchName ? `Custom payroll process for ${branchName}` : "Branch-isolated compensation policy"}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-700 cursor-pointer"
          >
            <i className="ri-close-line text-lg" />
          </button>
        </div>

        {/* Security Notice */}
        <div className="mx-6 mt-4 p-3.5 bg-sky-50/80 border border-sky-200/80 rounded-2xl flex items-start gap-3 text-xs">
          <i className="ri-lock-2-line text-sky-700 text-base mt-0.5 shrink-0" />
          <div>
            <p className="font-bold text-sky-900">Branch Tenant Isolation &amp; Privacy Rule</p>
            <p className="text-sky-700/90 mt-0.5 leading-relaxed text-[11px]">
              Payroll rates, bank disbursement details, and cut-off rules are secured and managed directly by the branch administration.
            </p>
          </div>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1 text-xs">
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

          {/* Rates and Deductions */}
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

          {/* Disbursement & Banking */}
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

          {/* Approval & Automated Switches */}
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

          {/* Policy Notes */}
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

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 rounded-xl font-semibold text-gray-600 hover:bg-gray-100 disabled:opacity-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-xl font-semibold text-white bg-[#253C7D] hover:bg-[#1F336A] disabled:opacity-50 transition-all cursor-pointer flex items-center gap-1.5"
            >
              {saving && <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />}
              Save Branch Policy
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});
