import React from "react";
import { CONTRACT_TYPES } from "../../constants";

interface Props {
  contractType: string;
  onContractTypeChange: (val: string) => void;
  contractStartDate: string;
  onContractStartDateChange: (val: string) => void;
  contractEndDate: string;
  onContractEndDateChange: (val: string) => void;
}

export const ChangeContractFields: React.FC<Props> = ({
  contractType,
  onContractTypeChange,
  contractStartDate,
  onContractStartDateChange,
  contractEndDate,
  onContractEndDateChange,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <div>
        <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1">
          New Contract Type
        </label>
        <select
          value={contractType}
          onChange={(e) => onContractTypeChange(e.target.value)}
          className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-800 dark:text-gray-200"
        >
          {CONTRACT_TYPES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1">
          Contract Start Date
        </label>
        <input
          type="date"
          value={contractStartDate}
          onChange={(e) => onContractStartDateChange(e.target.value)}
          className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-800 dark:text-gray-200"
        />
      </div>
      <div>
        <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1">
          Contract End Date (if FDC)
        </label>
        <input
          type="date"
          value={contractEndDate}
          onChange={(e) => onContractEndDateChange(e.target.value)}
          className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-800 dark:text-gray-200"
        />
      </div>
    </div>
  );
};
