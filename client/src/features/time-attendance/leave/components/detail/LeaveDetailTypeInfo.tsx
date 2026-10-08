import { memo } from "react";
import type { LeaveRequest } from "../../types";
import { getLeaveTypeDisplay, formatDateTime, getLeaveEmployeeName } from "../../utils/leaveDisplayUtils";

interface LeaveDetailTypeInfoProps {
  request: LeaveRequest;
}

function formatDateWithDay(dateStr?: string | null): string {
  if (!dateStr) return "";
  const d = new Date(dateStr.includes("T") ? dateStr : `${dateStr}T00:00:00`);
  if (isNaN(d.getTime())) return dateStr;
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dayName = days[d.getDay()];
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${dayName} ${day}/${month}/${year}`;
}

export const LeaveDetailTypeInfo = memo(function LeaveDetailTypeInfo({
  request: r,
}: LeaveDetailTypeInfoProps) {
  const typeInfo = getLeaveTypeDisplay(r.leave_type);
  const isHalfDay = r.days < 1 || (r.reason && r.reason.toLowerCase().includes("half day"));
  const cleanReason = (r.reason || "—")
    .replace(/\[Stage:[^\]]+\]/g, "")
    .replace(/\[Endorsed[^\]]+\]/g, "")
    .trim() || "—";

  const requestedBy = getLeaveEmployeeName(r.employees);

  const statusPill = (() => {
    if (r.status === "approved") {
      return (
        <span className="px-2.5 py-0.5 bg-emerald-600 text-white text-[10px] font-extrabold uppercase rounded tracking-wider shadow-2xs">
          Approved
        </span>
      );
    }
    if (r.status === "rejected") {
      return (
        <span className="px-2.5 py-0.5 bg-rose-600 text-white text-[10px] font-extrabold uppercase rounded tracking-wider shadow-2xs">
          Rejected
        </span>
      );
    }
    if (r.status === "cancelled") {
      return (
        <span className="px-2.5 py-0.5 bg-slate-500 text-white text-[10px] font-extrabold uppercase rounded tracking-wider shadow-2xs">
          Cancelled
        </span>
      );
    }
    return (
      <span className="px-2.5 py-0.5 bg-sky-500 text-white text-[10px] font-extrabold uppercase rounded tracking-wider shadow-2xs">
        Pending
      </span>
    );
  })();

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200/80 dark:border-slate-800 p-4 sm:p-5 shadow-2xs space-y-3">
      {/* Header with Title & Status Pill */}
      <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-slate-800">
        <span className="text-[#0284c7] dark:text-sky-400 font-bold text-xs tracking-wider uppercase">
          Leave Request Details
        </span>
        {statusPill}
      </div>

      {/* Top 2 Items */}
      <div className="space-y-1.5 text-xs">
        <div>
          <span className="text-gray-400 dark:text-slate-500 text-[11px] block">Leave Type</span>
          <span className="font-semibold text-gray-900 dark:text-slate-100">{typeInfo.fullName}</span>
        </div>
        <div>
          <span className="text-gray-400 dark:text-slate-500 text-[11px] block">Period Type</span>
          <span className="font-semibold text-gray-900 dark:text-slate-100">
            {isHalfDay ? "Daily (Half Day)" : "Daily (Full Day)"}
          </span>
        </div>
      </div>

      {/* 2-Column Key-Value Grid */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-xs pt-1 border-t border-gray-100 dark:border-slate-800">
        {/* Row 1 */}
        <div>
          <span className="text-gray-400 dark:text-slate-500 text-[11px] block">Requested Date</span>
          <span className="font-semibold text-gray-900 dark:text-slate-100">{formatDateTime(r.created_at)}</span>
        </div>
        <div>
          <span className="text-gray-400 dark:text-slate-500 text-[11px] block">From Date</span>
          <span className="font-semibold text-gray-900 dark:text-slate-100">{formatDateWithDay(r.start_date)}</span>
        </div>

        {/* Row 2 */}
        <div>
          <span className="text-gray-400 dark:text-slate-500 text-[11px] block">Leave Period</span>
          <span className="font-semibold text-gray-900 dark:text-slate-100">{r.days} {r.days === 1 ? "Day" : "Days"}</span>
        </div>
        <div>
          <span className="text-gray-400 dark:text-slate-500 text-[11px] block">Deduction Period</span>
          <span className="inline-block mt-0.5 px-2 py-0.5 bg-[#7e22ce] text-white text-[10px] font-bold rounded shadow-2xs">
            {typeInfo.code} : - {r.days} Day
          </span>
        </div>

        {/* Row 3 */}
        <div>
          <span className="text-gray-400 dark:text-slate-500 text-[11px] block">Reason</span>
          <span className="font-semibold text-gray-900 dark:text-slate-100 break-words">{cleanReason}</span>
        </div>
        <div>
          <span className="text-gray-400 dark:text-slate-500 text-[11px] block">Requested On</span>
          <span className="font-semibold text-gray-900 dark:text-slate-100">{formatDateTime(r.created_at)}</span>
        </div>

        {/* Row 4 */}
        <div>
          <span className="text-gray-400 dark:text-slate-500 text-[11px] block">Requested On</span>
          <span className="font-semibold text-gray-900 dark:text-slate-100">{formatDateTime(r.created_at)}</span>
        </div>
        <div>
          <span className="text-gray-400 dark:text-slate-500 text-[11px] block">Requested By</span>
          <span className="font-semibold text-gray-900 dark:text-slate-100">{requestedBy}</span>
        </div>
      </div>
    </div>
  );
});
