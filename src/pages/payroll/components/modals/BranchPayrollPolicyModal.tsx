import React, { useState, useEffect, memo } from "react";
import type { BranchPayrollPolicy } from "../../types";
import { BranchPayrollPolicyFormFields } from "./BranchPayrollPolicyFormFields";

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
          <BranchPayrollPolicyFormFields form={form} setForm={setForm} />

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
