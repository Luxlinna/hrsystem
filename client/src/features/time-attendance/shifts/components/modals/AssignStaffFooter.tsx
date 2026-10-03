import { memo } from "react";

interface AssignStaffFooterProps {
  assignEmployeeIds: string[];
  remainingSpots: number;
  submitting: boolean;
  onClose: () => void;
  onAssign: (e: React.FormEvent) => Promise<void>;
}

export const AssignStaffFooter = memo(function AssignStaffFooter({
  assignEmployeeIds,
  remainingSpots,
  submitting,
  onClose,
  onAssign,
}: AssignStaffFooterProps) {
  if (remainingSpots <= 0) return null;

  return (
    <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3 shrink-0">
      <div className="text-xs text-slate-500">
        {assignEmployeeIds.length === 0 ? (
          <span>Click on staff cards above to select</span>
        ) : assignEmployeeIds.length === remainingSpots ? (
          <span className="text-emerald-600 font-bold flex items-center gap-1">
            <i className="ri-checkbox-circle-fill text-sm" /> All available spots filled
          </span>
        ) : (
          <span>{remainingSpots - assignEmployeeIds.length} more spot(s) can be selected</span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2.5 border border-slate-200 bg-white text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onAssign}
          disabled={submitting || assignEmployeeIds.length === 0 || assignEmployeeIds.length > remainingSpots}
          className="px-5 py-2.5 bg-[#253C7D] hover:bg-[#1E293B] text-white text-xs font-bold rounded-xl shadow-xs disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center gap-1.5"
        >
          {submitting ? (
            <><i className="ri-loader-4-line animate-spin" /><span>Assigning...</span></>
          ) : (
            <><i className="ri-user-add-line" /><span>Assign {assignEmployeeIds.length > 0 ? `(${assignEmployeeIds.length} Staff)` : "Staff"}</span></>
          )}
        </button>
      </div>
    </div>
  );
});
