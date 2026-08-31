import { memo } from "react";
import type { LeaveRequest } from "../types";
import { LeaveExportMenu } from "./LeaveExportMenu";

interface LeaveHeaderProps {
  onLeaveTodayCount: number;
  filteredRequests: LeaveRequest[];
  onRequestLeave: () => void;
  onToast?: (toast: { type: "success" | "info" | "error"; message: string }) => void;
}

export const LeaveHeader = memo(function LeaveHeader({
  onLeaveTodayCount,
  filteredRequests,
  onRequestLeave,
  onToast,
}: LeaveHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
          <span>Time & Attendance</span>
          <i className="ri-arrow-right-s-line text-xs" />
          <span className="text-[#253C7D] font-bold">Absence & Leave</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2.5">
          Leave Management
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            {onLeaveTodayCount} On Leave Today
          </span>
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">
          Track employee time off, approve leave requests, and manage leave balances across the organisation.
        </p>
      </div>

      <div className="flex items-center gap-2.5 flex-wrap">
        <LeaveExportMenu filteredRequests={filteredRequests} onToast={onToast} />

        <button
          onClick={onRequestLeave}
          className="inline-flex items-center gap-2 bg-[#253C7D] hover:bg-[#1E3064] text-white px-4 py-2.5 rounded-xl text-xs sm:text-[13px] font-bold transition-all shadow-sm hover:shadow-md cursor-pointer active:scale-98"
        >
          <i className="ri-add-circle-line text-base font-bold" />
          Request Leave
        </button>
      </div>
    </div>
  );
});
