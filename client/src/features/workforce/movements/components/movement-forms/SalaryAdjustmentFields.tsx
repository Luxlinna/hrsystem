import React from "react";
import { SALARY_ADJUSTMENT_REASONS } from "../../constants";

interface Props {
  adjustmentType: string;
  onAdjustmentTypeChange: (val: string) => void;
  currentSalary: string;
  onCurrentSalaryChange: (val: string) => void;
  newSalary: string;
  onNewSalaryChange: (val: string) => void;
  currency: string;
}

export const SalaryAdjustmentFields: React.FC<Props> = ({
  adjustmentType,
  onAdjustmentTypeChange,
  currentSalary,
  onCurrentSalaryChange,
  newSalary,
  onNewSalaryChange,
  currency,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <div>
        <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1">
          Adjustment Reason
        </label>
        <select
          value={adjustmentType}
          onChange={(e) => onAdjustmentTypeChange(e.target.value)}
          className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-800 dark:text-gray-200"
        >
          {SALARY_ADJUSTMENT_REASONS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1">
          Current Base Salary
        </label>
        <input
          type="number"
          value={currentSalary}
          onChange={(e) => onCurrentSalaryChange(e.target.value)}
          className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-800 dark:text-gray-200"
        />
      </div>
      <div>
        <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1">
          New Base Salary ({currency}) <span className="text-rose-500">*</span>
        </label>
        <input
          type="number"
          required
          value={newSalary}
          onChange={(e) => onNewSalaryChange(e.target.value)}
          className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-800 dark:text-gray-200 font-bold"
        />
      </div>
    </div>
  );
};
