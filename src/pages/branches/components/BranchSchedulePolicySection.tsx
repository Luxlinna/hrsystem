import type { Branch } from "../types";

interface BranchSchedulePolicySectionProps {
  branch: Branch;
  canManage: boolean;
  onOpenEditModal: (branch: Branch, tab?: "profile" | "schedule") => void;
}

export function BranchSchedulePolicySection({
  branch,
  canManage,
  onOpenEditModal,
}: BranchSchedulePolicySectionProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-4 sm:p-7 space-y-5 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-3 sm:pb-4 gap-2.5">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Work Schedule & Attendance Policy</h3>
          <p className="text-xs text-slate-500 mt-0.5">Operating hours and grace windows applied for {branch.name}</p>
        </div>
        {canManage && (
          <button
            type="button"
            onClick={() => onOpenEditModal(branch, "schedule")}
            className="inline-flex items-center justify-center gap-1 px-3.5 py-1.5 text-xs font-semibold text-[#0088cc] border border-[#0088cc]/30 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer w-full sm:w-auto"
          >
            <i className="ri-edit-line" />
            Adjust Hours
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div className="p-3.5 sm:p-4 bg-slate-50/80 rounded-xl border border-slate-100">
          <span className="text-[10.5px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Check-In Time</span>
          <p className="text-lg sm:text-xl font-bold text-slate-900">
            {branch.work_start_time ? branch.work_start_time.slice(0, 5) : "08:00"}
          </p>
          <p className="text-xs text-emerald-600 font-semibold mt-1">
            +{branch.late_grace_minutes ?? 15} mins late grace chance
          </p>
        </div>
        <div className="p-3.5 sm:p-4 bg-slate-50/80 rounded-xl border border-slate-100">
          <span className="text-[10.5px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Check-Out Time</span>
          <p className="text-lg sm:text-xl font-bold text-slate-900">
            {branch.work_end_time ? branch.work_end_time.slice(0, 5) : "17:00"}
          </p>
          <p className="text-xs text-indigo-600 font-semibold mt-1">
            {branch.early_leave_grace_minutes ?? 15} mins early departure grace
          </p>
        </div>
      </div>
    </div>
  );
}
