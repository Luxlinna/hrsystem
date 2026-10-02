import React, { useState, useEffect, memo } from "react";
import type { BranchFinancePolicy } from "../../types";

interface BranchFinancePolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  policy: BranchFinancePolicy | null;
  branchName?: string;
  isSuperAdmin: boolean;
  canManage: boolean;
  saving: boolean;
  onSave: (policyUpdates: Partial<BranchFinancePolicy>) => void;
}

export const BranchFinancePolicyModal = memo(function BranchFinancePolicyModal({
  isOpen,
  onClose,
  policy,
  branchName,
  isSuperAdmin,
  canManage,
  saving,
  onSave,
}: BranchFinancePolicyModalProps) {
  const [form, setForm] = useState<Partial<BranchFinancePolicy>>({});

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
                Branch Financial &amp; Expense Policy
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                {branchName ? `Budget limits & claim thresholds for ${branchName}` : "Branch-isolated finance governance"}
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

        {/* Security Shield Banner */}
        <div className="mx-6 mt-4 p-3.5 bg-teal-50/80 border border-teal-200/80 rounded-2xl flex items-start gap-3 text-xs">
          <i className="ri-lock-2-line text-teal-700 text-base mt-0.5 shrink-0" />
          <div>
            <p className="font-bold text-teal-900">Partner Branch Financial Confidentiality</p>
            <p className="text-teal-700/90 mt-0.5 leading-relaxed text-[11px]">
              Operating budgets, expense approval thresholds, and reimbursement rules are isolated and managed exclusively by your branch leadership.
            </p>
          </div>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-gray-700 mb-1">Monthly Operating Budget ($)</label>
              <input
                type="number"
                min="0"
                value={form.monthly_budget_limit ?? 50000}
                onChange={(e) => setForm({ ...form, monthly_budget_limit: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-900 focus:outline-none focus:border-[#253C7D]"
              />
              <span className="text-[10px] text-gray-400 mt-0.5 block">Branch ceiling limit</span>
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1">Currency</label>
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
              <label className="block font-bold text-gray-700 mb-1">Auto-Approval Threshold ($)</label>
              <input
                type="number"
                min="0"
                value={form.auto_approve_threshold ?? 100}
                onChange={(e) => setForm({ ...form, auto_approve_threshold: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-900 focus:outline-none focus:border-[#253C7D]"
              />
              <span className="text-[10px] text-gray-400 mt-0.5 block">Claims below this auto-clear</span>
            </div>

            <div>
              <label className="block font-bold text-gray-700 mb-1">Receipt Required Above ($)</label>
              <input
                type="number"
                min="0"
                value={form.receipt_required_above ?? 25}
                onChange={(e) => setForm({ ...form, receipt_required_above: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-900 focus:outline-none focus:border-[#253C7D]"
              />
              <span className="text-[10px] text-gray-400 mt-0.5 block">Mandatory invoice attachment</span>
            </div>
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1">2-Tier Executive Approval Above ($)</label>
            <input
              type="number"
              min="0"
              value={form.require_two_approvers_above ?? 500}
              onChange={(e) => setForm({ ...form, require_two_approvers_above: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-900 focus:outline-none focus:border-[#253C7D]"
            />
            <span className="text-[10px] text-gray-400 mt-0.5 block">High-value expenses require Branch Director sign-off</span>
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1">Branch Finance Bylaws / Policy Notes</label>
            <textarea
              rows={3}
              value={form.policy_notes || ""}
              onChange={(e) => setForm({ ...form, policy_notes: e.target.value })}
              placeholder="Internal branch spending limits, eligible travel vendors, or reimbursement cycles..."
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
              Save Finance Policy
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});
