import React, { memo } from "react";
import type { BenefitPlan, PlanFormState } from "../types";
import { PLAN_TYPE_CONFIG } from "../constants";

interface PlanFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingPlan: BenefitPlan | null;
  planForm: PlanFormState;
  setPlanForm: React.Dispatch<React.SetStateAction<PlanFormState>>;
  saving: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export const PlanFormModal = memo(function PlanFormModal({
  isOpen,
  onClose,
  editingPlan,
  planForm,
  setPlanForm,
  saving,
  onSubmit,
}: PlanFormModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/40 backdrop-blur-xs overflow-y-auto no-scrollbar"
      onClick={() => !saving && onClose()}
    >
      <div
        className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-gray-100/80 overflow-hidden flex flex-col animate-in zoom-in-95 duration-150 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#253C7D]/10 text-[#253C7D] flex items-center justify-center font-bold text-sm">
              <i className={editingPlan ? "ri-edit-line" : "ri-heart-pulse-line"} />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-gray-900">
                {editingPlan ? "Edit Benefit Program" : "Create Benefit Program"}
              </h3>
              <p className="text-[11px] text-gray-400 mt-0.5">
                {editingPlan
                  ? "Modify policy terms, rates, and coverage limits"
                  : "Register new company health or perk policy"}
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

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
              Plan Name <span className="text-rose-500">*</span>
            </label>
            <input
              required
              value={planForm.name}
              onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
              placeholder="e.g. Executive Platinum Healthcare Plan"
              className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                Provider Organization <span className="text-rose-500">*</span>
              </label>
              <input
                required
                value={planForm.provider}
                onChange={(e) => setPlanForm({ ...planForm, provider: e.target.value })}
                placeholder="e.g. Forte Insurance"
                className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D]"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                Category Type <span className="text-rose-500">*</span>
              </label>
              <select
                value={planForm.type}
                onChange={(e) => setPlanForm({ ...planForm, type: e.target.value })}
                className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D] cursor-pointer"
              >
                {Object.keys(PLAN_TYPE_CONFIG).map((t) => (
                  <option key={t} value={t}>
                    {PLAN_TYPE_CONFIG[t].label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                Coverage Limit ($)
              </label>
              <input
                type="number"
                min={0}
                value={planForm.coverage_amount}
                onChange={(e) => setPlanForm({ ...planForm, coverage_amount: e.target.value })}
                className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D]"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                Employee ($/mo)
              </label>
              <input
                type="number"
                min={0}
                value={planForm.employee_contribution}
                onChange={(e) => setPlanForm({ ...planForm, employee_contribution: e.target.value })}
                className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D]"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                Eligible Seats
              </label>
              <input
                type="number"
                min={1}
                value={planForm.eligible_count}
                onChange={(e) => setPlanForm({ ...planForm, eligible_count: e.target.value })}
                className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D]"
              />
            </div>
          </div>

          {editingPlan && (
            <div>
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                Plan Status
              </label>
              <select
                value={planForm.status}
                onChange={(e) => setPlanForm({ ...planForm, status: e.target.value })}
                className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D] cursor-pointer"
              >
                <option value="active">Active Plan</option>
                <option value="inactive">Inactive / Suspended</option>
              </select>
            </div>
          )}

          <div>
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
              Plan Description & Coverage Scope
            </label>
            <textarea
              rows={2}
              value={planForm.description}
              onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
              placeholder="Inpatient, outpatient, deductible, or special network terms..."
              className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D]"
            />
          </div>

          <div className="flex gap-2 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !planForm.name || !planForm.provider}
              className="flex-1 px-4 py-2.5 bg-[#253C7D] hover:bg-[#1E3064] text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50"
            >
              {saving
                ? editingPlan
                  ? "Saving..."
                  : "Creating..."
                : editingPlan
                ? "Save Changes"
                : "Create Plan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});
