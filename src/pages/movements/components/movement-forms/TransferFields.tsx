import React from "react";

interface BranchOption {
  id: string;
  name: string;
}

interface WorkLocationOption {
  id: string;
  name: string;
  branch_id?: string;
}

interface Props {
  targetBranchId: string;
  onTargetBranchIdChange: (val: string) => void;
  targetWorkLocationId: string;
  onTargetWorkLocationIdChange: (val: string) => void;
  targetDepartment: string;
  onTargetDepartmentChange: (val: string) => void;
  branches: BranchOption[];
  workLocations: WorkLocationOption[];
  defaultDepartment?: string | null;
}

export const TransferFields: React.FC<Props> = ({
  targetBranchId,
  onTargetBranchIdChange,
  targetWorkLocationId,
  onTargetWorkLocationIdChange,
  targetDepartment,
  onTargetDepartmentChange,
  branches,
  workLocations,
  defaultDepartment,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <div>
        <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1">
          Target Branch / BU <span className="text-rose-500">*</span>
        </label>
        <select
          value={targetBranchId}
          onChange={(e) => onTargetBranchIdChange(e.target.value)}
          className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-800 dark:text-gray-200"
        >
          <option value="">Select Destination Branch</option>
          {branches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1">
          Target Work Site / Location
        </label>
        <select
          value={targetWorkLocationId}
          onChange={(e) => onTargetWorkLocationIdChange(e.target.value)}
          className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-800 dark:text-gray-200"
        >
          <option value="">Standard Main Facility</option>
          {workLocations
            .filter((loc) => !targetBranchId || loc.branch_id === targetBranchId)
            .map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name}
              </option>
            ))}
        </select>
      </div>
      <div>
        <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1">
          Target Department
        </label>
        <input
          type="text"
          value={targetDepartment}
          placeholder={defaultDepartment || "e.g. Operations"}
          onChange={(e) => onTargetDepartmentChange(e.target.value)}
          className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-800 dark:text-gray-200"
        />
      </div>
    </div>
  );
};
