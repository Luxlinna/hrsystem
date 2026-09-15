import React from "react";

interface Props {
  probationMonths: number;
  onMonthsChange: (months: number) => void;
  probationEndDate: string;
  onEndDateChange: (date: string) => void;
}

export const ProbationFields: React.FC<Props> = ({
  probationMonths,
  onMonthsChange,
  probationEndDate,
  onEndDateChange,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div>
        <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1">
          Probation Duration (Months)
        </label>
        <select
          value={probationMonths}
          onChange={(e) => onMonthsChange(parseInt(e.target.value))}
          className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-800 dark:text-gray-200"
        >
          <option value={1}>1 Month (Fast-track)</option>
          <option value={2}>2 Months</option>
          <option value={3}>3 Months (Standard)</option>
          <option value={6}>6 Months (Extended / Managerial)</option>
        </select>
      </div>
      <div>
        <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1">
          Probation Review / End Date
        </label>
        <input
          type="date"
          value={probationEndDate}
          onChange={(e) => onEndDateChange(e.target.value)}
          className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-800 dark:text-gray-200"
        />
      </div>
    </div>
  );
};
