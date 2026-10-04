import { memo } from "react";
import type { PayrollForm } from "../../types";

interface RecordModalSalaryFieldsProps {
  form: PayrollForm;
  setForm: React.Dispatch<React.SetStateAction<PayrollForm>>;
}

export const RecordModalSalaryFields = memo(function RecordModalSalaryFields({
  form,
  setForm,
}: RecordModalSalaryFieldsProps) {
  const calculatedNet =
    Number(form.base_salary || 0) + Number(form.bonus || 0) - Number(form.deductions || 0);

  return (
    <>
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

      <div className="p-3 bg-[#253C7D]/5 dark:bg-sky-400/10 rounded-2xl border border-[#253C7D]/10 dark:border-sky-400/20 flex items-center justify-between">
        <span className="text-xs font-bold text-[#253C7D] dark:text-sky-300">
          Calculated Net Pay:
        </span>
        <span className="text-base font-black text-[#253C7D] dark:text-sky-300">
          ${calculatedNet.toLocaleString()}
        </span>
      </div>
    </>
  );
});
