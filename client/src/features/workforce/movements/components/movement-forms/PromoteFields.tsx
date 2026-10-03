import React from "react";

interface Props {
  currentBranchName?: string | null;
  currentRole?: string | null;
  currentDepartment?: string | null;
  newRole: string;
  onNewRoleChange: (val: string) => void;
  newGrade: string;
  onNewGradeChange: (val: string) => void;
  salaryIncrease: string;
  onSalaryIncreaseChange: (val: string) => void;
}

export const PromoteFields: React.FC<Props> = ({
  currentBranchName,
  currentRole,
  currentDepartment,
  newRole,
  onNewRoleChange,
  newGrade,
  onNewGradeChange,
  salaryIncrease,
  onSalaryIncreaseChange,
}) => {
  return (
    <div className="space-y-3">
      {/* Dynamic BU & Role Snapshot */}
      <div className="p-3 rounded-xl border border-purple-200 dark:border-purple-900/60 bg-purple-50/60 dark:bg-purple-950/30 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center font-bold shadow-xs">
            <i className="ri-building-line text-sm" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-purple-600 dark:text-purple-400">
              Current Business Unit (BU)
            </div>
            <div className="font-extrabold text-gray-900 dark:text-white text-xs flex items-center gap-1.5 mt-0.5">
              <span>{currentBranchName || "Main Headquarters"}</span>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300">
                Active BU
              </span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] uppercase font-bold text-gray-400">
            Current Position
          </div>
          <div className="font-bold text-gray-800 dark:text-gray-200 text-xs mt-0.5">
            {currentRole || "Staff"}{currentDepartment ? ` · ${currentDepartment}` : ""}
          </div>
        </div>
      </div>

      {/* Promotion Form Inputs */}
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
            className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
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
    </div>
  );
};
