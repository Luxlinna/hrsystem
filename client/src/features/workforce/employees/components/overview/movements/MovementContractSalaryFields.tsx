import React from "react";
import type { MovementFormValues } from "./MovementFormFields";

interface Props {
  values: MovementFormValues;
  onChange: (field: keyof MovementFormValues, val: string) => void;
}

export const MovementContractSalaryFields: React.FC<Props> = ({ values, onChange }) => {
  return (
    <>
      {/* Contract Type & Period */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div>
          <label className="block font-semibold text-gray-700 dark:text-slate-300 mb-1">Contract Type</label>
          <input
            type="text"
            value={values.contractType}
            onChange={(e) => onChange("contractType", e.target.value)}
            placeholder="Standard Contract, UDC, FDC"
            className="w-full px-3 py-2 border rounded-md border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
        </div>
        <div>
          <label className="block font-semibold text-gray-700 dark:text-slate-300 mb-1">Contract Start Date</label>
          <input
            type="date"
            value={values.contractStartDate}
            onChange={(e) => onChange("contractStartDate", e.target.value)}
            className="w-full px-3 py-2 border rounded-md border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
        </div>
        <div>
          <label className="block font-semibold text-gray-700 dark:text-slate-300 mb-1">Contract End Date</label>
          <input
            type="date"
            value={values.contractEndDate}
            onChange={(e) => onChange("contractEndDate", e.target.value)}
            className="w-full px-3 py-2 border rounded-md border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
        </div>
      </div>

      {/* Salary & Salary After Probation */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div>
          <label className="block font-semibold text-gray-700 dark:text-slate-300 mb-1">Salary ($)</label>
          <div className="flex gap-2">
            <input
              type="number"
              step="0.01"
              value={values.salary}
              onChange={(e) => onChange("salary", e.target.value)}
              placeholder="0.00"
              className="flex-1 px-3 py-2 border rounded-md border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
            <select
              value={values.salaryFreq}
              onChange={(e) => onChange("salaryFreq", e.target.value)}
              className="w-28 px-2 py-2 border rounded-md border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            >
              <option value="Monthly">Monthly</option>
              <option value="Daily">Daily</option>
              <option value="Hourly">Hourly</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block font-semibold text-gray-700 dark:text-slate-300 mb-1">Salary After Probation ($)</label>
          <div className="flex gap-2">
            <input
              type="number"
              step="0.01"
              value={values.salaryAfter}
              onChange={(e) => onChange("salaryAfter", e.target.value)}
              placeholder="0.00"
              className="flex-1 px-3 py-2 border rounded-md border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
            <select
              value={values.salaryAfterFreq}
              onChange={(e) => onChange("salaryAfterFreq", e.target.value)}
              className="w-28 px-2 py-2 border rounded-md border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            >
              <option value="Monthly">Monthly</option>
              <option value="Daily">Daily</option>
              <option value="Hourly">Hourly</option>
            </select>
          </div>
        </div>
      </div>
    </>
  );
};
