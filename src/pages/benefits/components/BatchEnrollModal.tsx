import React, { memo } from "react";
import type { BenefitPlan, Employee } from "../types";
import { BatchEnrollEmployeePicker } from "./BatchEnrollEmployeePicker";

interface BatchEnrollModalProps {
  isOpen: boolean;
  onClose: () => void;
  plans: BenefitPlan[];
  employees: Employee[];
  enrollForm: { plan_id: string };
  setEnrollForm: React.Dispatch<React.SetStateAction<{ plan_id: string }>>;
  enrollEmployeeIds: string[];
  setEnrollEmployeeIds: React.Dispatch<React.SetStateAction<string[]>>;
  saving: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export const BatchEnrollModal = memo(function BatchEnrollModal({
  isOpen,
  onClose,
  plans,
  employees,
  enrollForm,
  setEnrollForm,
  enrollEmployeeIds,
  setEnrollEmployeeIds,
  saving,
  onSubmit,
}: BatchEnrollModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/40 backdrop-blur-xs overflow-y-auto no-scrollbar"
      onClick={() => !saving && onClose()}
    >
      <div
        className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-gray-100/80 overflow-hidden flex flex-col animate-in zoom-in-95 duration-150 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#253C7D]/10 text-[#253C7D] flex items-center justify-center font-bold text-sm">
              <i className="ri-user-add-line" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-gray-900">Enroll Employees in Benefits</h3>
              <p className="text-[11px] text-gray-400 mt-0.5">Select plan and staff participants</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-700 cursor-pointer"
          >
            <i className="ri-close-line text-lg" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
              Select Benefit Plan <span className="text-rose-500">*</span>
            </label>
            <select
              required
              value={enrollForm.plan_id}
              onChange={(e) => setEnrollForm({ ...enrollForm, plan_id: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D] cursor-pointer"
            >
              <option value="">Choose a Benefit Plan...</option>
              {plans
                .filter((p) => p.status === "active")
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.provider}) — ${Number(p.coverage_amount).toLocaleString()}
                  </option>
                ))}
            </select>
          </div>

          <BatchEnrollEmployeePicker
            employees={employees}
            enrollEmployeeIds={enrollEmployeeIds}
            setEnrollEmployeeIds={setEnrollEmployeeIds}
          />

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !enrollForm.plan_id || enrollEmployeeIds.length === 0}
              className="px-5 py-2.5 bg-[#253C7D] hover:bg-[#1E3064] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              {saving ? "Enrolling..." : `Enroll ${enrollEmployeeIds.length} Staff`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});
