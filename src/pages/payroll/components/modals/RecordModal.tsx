import { memo } from "react";
import type { PayrollForm, PayrollRecord, Employee } from "../../types";
import EmployeeSearchSelect from "@/components/EmployeeSearchSelect";

interface RecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  recordToEdit: PayrollRecord | null;
  form: PayrollForm;
  setForm: React.Dispatch<React.SetStateAction<PayrollForm>>;
  employees: Employee[];
  saving: boolean;
  onSubmit: (e: React.FormEvent) => Promise<void>;
}

export const RecordModal = memo(function RecordModal({
  isOpen,
  onClose,
  recordToEdit,
  form,
  setForm,
  employees,
  saving,
  onSubmit,
}: RecordModalProps) {
  if (!isOpen) return null;

  const calculatedNet =
    Number(form.base_salary || 0) + Number(form.bonus || 0) - Number(form.deductions || 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-base font-extrabold text-gray-900 dark:text-white">
              {recordToEdit ? "Edit Payroll Entry" : "Add Payroll Record"}
            </h3>
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
              Enter compensation breakdown, additions, and withholdings
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 flex items-center justify-center text-gray-400 cursor-pointer"
          >
            <i className="ri-close-line text-lg" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          {/* Employee Selection */}
          {!recordToEdit ? (
            <div>
              <label className="text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                Select Employee *
              </label>
              <EmployeeSearchSelect
                employees={employees}
                value={form.employee_id}
                onChange={(id) => setForm({ ...form, employee_id: id })}
                placeholder="Search by name, role, or department..."
              />
            </div>
          ) : (
            <div className="p-3 bg-gray-50 dark:bg-slate-800/60 rounded-2xl border border-gray-200/80 dark:border-slate-700">
              <span className="text-[10px] text-gray-400 dark:text-slate-500 uppercase tracking-wider block">
                Employee
              </span>
              <span className="font-extrabold text-xs text-gray-900 dark:text-white">
                {recordToEdit.employees
                  ? `${recordToEdit.employees.first_name} ${recordToEdit.employees.last_name}`
                  : "Employee"}
              </span>
            </div>
          )}

          {/* Month Period & Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                Month Period *
              </label>
              <input
                type="month"
                required
                value={form.month}
                onChange={(e) => setForm({ ...form, month: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs text-gray-900 dark:text-white font-medium focus:outline-none focus:border-[#253C7D]"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                Payment Status *
              </label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as any })}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs text-gray-900 dark:text-white font-medium focus:outline-none focus:border-[#253C7D] cursor-pointer"
              >
                <option value="processed">Processed</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>

          {/* Breakdown Numbers */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                Base Salary ($) *
              </label>
              <input
                type="number"
                min="0"
                step="50"
                required
                value={form.base_salary}
                onChange={(e) => setForm({ ...form, base_salary: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs text-gray-900 dark:text-white font-medium focus:outline-none focus:border-[#253C7D]"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                Bonuses ($)
              </label>
              <input
                type="number"
                min="0"
                step="25"
                value={form.bonus}
                onChange={(e) => setForm({ ...form, bonus: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs text-gray-900 dark:text-white font-medium focus:outline-none focus:border-[#253C7D]"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
                Deductions ($)
              </label>
              <input
                type="number"
                min="0"
                step="10"
                value={form.deductions}
                onChange={(e) => setForm({ ...form, deductions: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs text-gray-900 dark:text-white font-medium focus:outline-none focus:border-[#253C7D]"
              />
            </div>
          </div>

          {/* Calculated Net Take-Home preview */}
          <div className="p-3 bg-[#253C7D]/5 dark:bg-sky-400/10 rounded-2xl border border-[#253C7D]/10 dark:border-sky-400/20 flex items-center justify-between">
            <span className="text-xs font-bold text-[#253C7D] dark:text-sky-300">
              Calculated Net Pay:
            </span>
            <span className="text-base font-black text-[#253C7D] dark:text-sky-300">
              ${calculatedNet.toLocaleString()}
            </span>
          </div>

          {/* Notes */}
          <div>
            <label className="text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider block mb-1">
              Internal Notes / Details
            </label>
            <textarea
              rows={2}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="e.g., Performance incentive included for Q3 milestone..."
              className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs text-gray-900 dark:text-white focus:outline-none focus:border-[#253C7D] font-medium resize-none"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-bold text-gray-500 hover:text-gray-800 dark:text-slate-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !form.employee_id}
              className="px-5 py-2.5 bg-[#253C7D] hover:bg-[#1E3064] text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              {saving ? "Saving..." : recordToEdit ? "Save Changes" : "Create Record"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});
