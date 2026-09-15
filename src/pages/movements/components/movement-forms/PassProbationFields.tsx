import React from "react";

interface Props {
  rating: string;
  onRatingChange: (val: string) => void;
  confirmedRole: string;
  onConfirmedRoleChange: (val: string) => void;
  defaultRole?: string | null;
}

export const PassProbationFields: React.FC<Props> = ({
  rating,
  onRatingChange,
  confirmedRole,
  onConfirmedRoleChange,
  defaultRole,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div>
        <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1">
          Performance Appraisal Score / Rating
        </label>
        <select
          value={rating}
          onChange={(e) => onRatingChange(e.target.value)}
          className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-800 dark:text-gray-200"
        >
          <option value="Outstanding (5.0/5)">Outstanding (5.0/5)</option>
          <option value="Exceeds Expectations (4.8/5)">Exceeds Expectations (4.8/5)</option>
          <option value="Meets Expectations (4.0/5)">Meets Expectations (4.0/5)</option>
          <option value="Satisfactory (3.5/5)">Satisfactory (3.5/5)</option>
        </select>
      </div>
      <div>
        <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1">
          Confirmed Regular Position
        </label>
        <input
          type="text"
          value={confirmedRole}
          placeholder={defaultRole || "e.g. Senior Software Engineer"}
          onChange={(e) => onConfirmedRoleChange(e.target.value)}
          className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-gray-800 dark:text-gray-200"
        />
      </div>
    </div>
  );
};
