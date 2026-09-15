import React from "react";

interface Props {
  newRole: string;
  onNewRoleChange: (val: string) => void;
  newGrade: string;
  onNewGradeChange: (val: string) => void;
  salaryIncrease: string;
  onSalaryIncreaseChange: (val: string) => void;
}

export const PromoteFields: React.FC<Props> = ({
  newRole,
  onNewRoleChange,
  newGrade,
  onNewGradeChange,
  salaryIncrease,
  onSalaryIncreaseChange,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <div>
        <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1">
          New Promoted Title <span className="text-rose-500">*</span>
        </label>
        <input
          type="text"
          required
          value={newRole}
          placeholder="e.g. Lead Technical Architect"
          onChange={(e) => onNewRoleChange(e.target.value)}
          className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-800 dark:text-gray-200"
        />
      </div>
      <div>
        <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1">
          Career Grade / Level
        </label>
        <select
          value={newGrade}
          onChange={(e) => onNewGradeChange(e.target.value)}
          className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-800 dark:text-gray-200"
        >
          <option value="L2 - Associate">L2 - Associate</option>
          <option value="L3 - Senior">L3 - Senior</option>
          <option value="L4 - Lead / Specialist">L4 - Lead / Specialist</option>
          <option value="L5 - Manager / Director">L5 - Manager / Director</option>
          <option value="L6 - Executive">L6 - Executive</option>
        </select>
      </div>
      <div>
        <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1">
          Salary Increase ($)
        </label>
        <input
          type="number"
          value={salaryIncrease}
          placeholder="e.g. 250"
          onChange={(e) => onSalaryIncreaseChange(e.target.value)}
          className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-800 dark:text-gray-200"
        />
      </div>
    </div>
  );
};
