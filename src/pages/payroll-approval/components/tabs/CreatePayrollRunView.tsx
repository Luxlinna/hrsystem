import { memo } from "react";
import type { CreatePayrollRunForm } from "../../types";
import { DEPARTMENTS } from "../../constants";

interface CreatePayrollRunViewProps {
  form: CreatePayrollRunForm;
  setForm: React.Dispatch<React.SetStateAction<CreatePayrollRunForm>>;
  creating: boolean;
  branchDepartments?: string[];
  onSubmit: (e: React.FormEvent) => Promise<void>;
  onCancel: () => void;
}

export const CreatePayrollRunView = memo(function CreatePayrollRunView({
  form,
  setForm,
  creating,
  branchDepartments,
  onSubmit,
  onCancel,
}: CreatePayrollRunViewProps) {
  const base = Number(form.total_base || 0);
  const bonus = Number(form.total_bonus || 0);
  const deductions = Number(form.total_deductions || 0);
  const calculatedNet = base + bonus - deductions;

  const availableDepts =
    branchDepartments && branchDepartments.length > 0
      ? branchDepartments
      : DEPARTMENTS.filter((d) => d !== "All Departments");

  return (
    <div className="bg-white rounded-3xl border border-gray-200/80 p-6 sm:p-8 shadow-2xs max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
        <div>
          <h2 className="text-lg font-extrabold text-gray-900">Initiate New Department Payroll Batch</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Submit a aggregated payroll run for multi-tier executive authorization.
          </p>
        </div>
        <div className="w-10 h-10 rounded-2xl bg-[#253C7D]/10 text-[#253C7D] flex items-center justify-center">
          <i className="ri-add-circle-line text-xl" />
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        {/* Period & Department */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
              Payroll Period (Month) *
            </label>
            <input
              type="month"
              required
              value={form.period}
              onChange={(e) => setForm({ ...form, period: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 font-bold focus:bg-white focus:outline-none focus:border-[#253C7D]"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
              Target Department *
            </label>
            <select
              value={form.department}
              onChange={(e) => setForm({ ...form, department: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 font-bold focus:bg-white focus:outline-none focus:border-[#253C7D] cursor-pointer"
            >
              {availableDepts.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Employee Count & Total Base */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
              Employee Count *
            </label>
            <input
              type="number"
              min="1"
              required
              value={form.employee_count}
              onChange={(e) => setForm({ ...form, employee_count: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 font-medium focus:bg-white focus:outline-none focus:border-[#253C7D]"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
              Total Base Salary ($) *
            </label>
            <input
              type="number"
              min="0"
              required
              value={form.total_base}
              onChange={(e) => setForm({ ...form, total_base: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 font-medium focus:bg-white focus:outline-none focus:border-[#253C7D]"
            />
          </div>
        </div>

        {/* Bonuses & Deductions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
              Total Bonuses & Additions ($)
            </label>
            <input
              type="number"
              min="0"
              value={form.total_bonus}
              onChange={(e) => setForm({ ...form, total_bonus: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 font-medium focus:bg-white focus:outline-none focus:border-[#253C7D]"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
              Total Taxes & Deductions ($)
            </label>
            <input
              type="number"
              min="0"
              value={form.total_deductions}
              onChange={(e) => setForm({ ...form, total_deductions: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 font-medium focus:bg-white focus:outline-none focus:border-[#253C7D]"
            />
          </div>
        </div>

        {/* Estimated Net Pay Hero Banner */}
        <div className="p-4 bg-[#253C7D]/5 rounded-2xl border border-[#253C7D]/10 flex items-center justify-between">
          <span className="text-xs font-bold text-[#253C7D]">Total Calculated Net Batch Payout:</span>
          <span className="text-lg font-black text-[#253C7D]">${calculatedNet.toLocaleString()}</span>
        </div>

        {/* Internal Notes */}
        <div>
          <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
            Batch Run Memo / Justifications
          </label>
          <textarea
            rows={2}
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="Add context on bonus criteria, overtime, or special adjustments..."
            className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D] font-medium resize-none"
          />
        </div>

        {/* Actions */}
        <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 text-xs font-bold text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={creating}
            className="px-6 py-2.5 bg-[#253C7D] hover:bg-[#1E3064] text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
          >
            {creating ? "Submitting Queue..." : "Submit for Approval"}
          </button>
        </div>
      </form>
    </div>
  );
});
