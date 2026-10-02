import React from "react";

interface Props {
  demoteRole: string;
  onDemoteRoleChange: (val: string) => void;
  demoteReason: string;
  onDemoteReasonChange: (val: string) => void;
}

export const DemoteFields: React.FC<Props> = ({
  demoteRole,
  onDemoteRoleChange,
  demoteReason,
  onDemoteReasonChange,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div>
        <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1">
          Reclassified Role <span className="text-rose-500">*</span>
        </label>
        <input
          type="text"
          required
          value={demoteRole}
          placeholder="e.g. Junior Operations Associate"
          onChange={(e) => onDemoteRoleChange(e.target.value)}
          className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-800 dark:text-gray-200"
        />
      </div>
      <div>
        <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1">
          Reclassification Justification
        </label>
        <input
          type="text"
          value={demoteReason}
          placeholder="e.g. Team restructuring or mutual agreement"
          onChange={(e) => onDemoteReasonChange(e.target.value)}
          className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-800 dark:text-gray-200"
        />
      </div>
    </div>
  );
};
