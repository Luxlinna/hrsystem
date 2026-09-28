import React from "react";
import { MovementContractSalaryFields } from "./MovementContractSalaryFields";

export interface MovementFormValues {
  title: string;
  effectiveDate: string;
  site: string;
  department: string;
  designation: string;
  contractType: string;
  contractStartDate: string;
  contractEndDate: string;
  employeeType: string;
  supervisor: string;
  salary: string;
  salaryFreq: string;
  salaryAfter: string;
  salaryAfterFreq: string;
  remarks: string;
}

interface Props {
  values: MovementFormValues;
  onChange: (field: keyof MovementFormValues, val: string) => void;
  file: File | null;
  onFileChange: (file: File | null) => void;
}

const COMMON_TITLES = [
  "Promotion",
  "Inter-Branch / Department Transfer",
  "Salary Adjustment",
  "Pass Probation Confirmation",
  "Contract Renewal / Extension",
  "Role Reclassification",
  "Resignation / Offboarding",
];

export const MovementFormFields: React.FC<Props> = ({
  values,
  onChange,
  onFileChange,
}) => {
  return (
    <div className="space-y-4 text-xs">
      {/* Title & Effective Date */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div>
          <label className="block font-semibold text-gray-700 dark:text-slate-300 mb-1">
            Movement Title <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            list="movement-titles-list"
            value={values.title}
            onChange={(e) => onChange("title", e.target.value)}
            required
            placeholder="e.g. Promotion, Transfer, Salary Adjustment..."
            className="w-full px-3 py-2 border rounded-md border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
          <datalist id="movement-titles-list">
            {COMMON_TITLES.map((t) => (
              <option key={t} value={t} />
            ))}
          </datalist>
        </div>
        <div>
          <label className="block font-semibold text-gray-700 dark:text-slate-300 mb-1">
            Effective Date <span className="text-rose-500">*</span>
          </label>
          <input
            type="date"
            value={values.effectiveDate}
            onChange={(e) => onChange("effectiveDate", e.target.value)}
            required
            className="w-full px-3 py-2 border rounded-md border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
        </div>
      </div>

      {/* Site, Department, Designation */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div>
          <label className="block font-semibold text-gray-700 dark:text-slate-300 mb-1">Site</label>
          <input
            type="text"
            value={values.site}
            onChange={(e) => onChange("site", e.target.value)}
            placeholder="Store / Branch code or name"
            className="w-full px-3 py-2 border rounded-md border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
        </div>
        <div>
          <label className="block font-semibold text-gray-700 dark:text-slate-300 mb-1">Department</label>
          <input
            type="text"
            value={values.department}
            onChange={(e) => onChange("department", e.target.value)}
            placeholder="e.g. IT, Operations"
            className="w-full px-3 py-2 border rounded-md border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
        </div>
        <div>
          <label className="block font-semibold text-gray-700 dark:text-slate-300 mb-1">Designation</label>
          <input
            type="text"
            value={values.designation}
            onChange={(e) => onChange("designation", e.target.value)}
            placeholder="e.g. Senior Developer"
            className="w-full px-3 py-2 border rounded-md border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
        </div>
      </div>

      {/* Contract & Salary Fields */}
      <MovementContractSalaryFields values={values} onChange={onChange} />

      {/* Employee Type & Supervisor */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div>
          <label className="block font-semibold text-gray-700 dark:text-slate-300 mb-1">Employee Type</label>
          <select
            value={values.employeeType}
            onChange={(e) => onChange("employeeType", e.target.value)}
            className="w-full px-3 py-2 border rounded-md border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          >
            <option value="FULL-TIME">FULL-TIME</option>
            <option value="PART-TIME">PART-TIME</option>
            <option value="PROBATION">PROBATION</option>
            <option value="INTERNSHIP">INTERNSHIP</option>
          </select>
        </div>
        <div>
          <label className="block font-semibold text-gray-700 dark:text-slate-300 mb-1">Supervisor</label>
          <input
            type="text"
            value={values.supervisor}
            onChange={(e) => onChange("supervisor", e.target.value)}
            placeholder="Reports to / Line manager"
            className="w-full px-3 py-2 border rounded-md border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
        </div>
      </div>

      {/* Remark / Reason */}
      <div>
        <label className="block font-semibold text-gray-700 dark:text-slate-300 mb-1">Remark / Reason</label>
        <textarea
          rows={2}
          value={values.remarks}
          onChange={(e) => onChange("remarks", e.target.value)}
          placeholder="Enter details, reason or transfer/salary remark..."
          className="w-full px-3 py-2 border rounded-md border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
        />
      </div>

      {/* Supporting Document (AWS S3) */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block font-semibold text-gray-700 dark:text-slate-300">Supporting Document</label>
          <span className="text-[10px] text-sky-600 dark:text-sky-400 font-semibold bg-sky-50 dark:bg-sky-950/50 px-1.5 py-0.5 rounded">
            AWS S3 Storage
          </span>
        </div>
        <input
          type="file"
          onChange={(e) => onFileChange(e.target.files?.[0] || null)}
          className="w-full text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100 cursor-pointer"
        />
      </div>
    </div>
  );
};
