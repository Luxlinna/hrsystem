import { memo } from "react";
import type { LeaveRequest } from "../../types";
import { getLeaveTypeDisplay, formatDateTime } from "../../utils/leaveDisplayUtils";

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

  const requestedBy = `${r.employees?.first_name || ""} ${r.employees?.last_name || ""}`.trim() || "Employee";

  const rows = [
    { label: "Leave Type", value: <span className="font-medium text-gray-800">{typeInfo.fullName}</span> },
    { label: "Period Type", value: <span className="text-gray-700">{isHalfDay ? "Daily (Half Day)" : "Daily (Full Day)"}</span> },
    { label: "Requested Date", value: <span className="text-gray-700">{formatDateTime(r.created_at)}</span> },
    { label: "From Date", value: <span className="text-gray-700">{formatDateWithDay(r.start_date)}</span> },
    { label: "To Date", value: <span className="text-gray-700">{formatDateWithDay(r.end_date)}</span> },
    { label: "Leave Period", value: <span className="text-gray-800 font-semibold">{r.days}</span> },
    {
      label: "Deduction Period",
      value: (
        <div className="flex items-center gap-2">
          <span className="text-gray-800">{r.days} Day</span>
          <span className="px-2 py-0.5 bg-[#7e22ce] text-white text-[10px] font-semibold rounded">
            {typeInfo.code} : - {r.days} Day
          </span>
        </div>
      ),
    },
    { label: "Reason", value: <span className="text-gray-800">{cleanReason}</span> },
    { label: "Requested on", value: <span className="text-gray-700">{formatDateTime(r.created_at)}</span> },
    { label: "Requested by", value: <span className="text-gray-800 font-medium">{requestedBy}</span> },
    { label: "Remark", value: <span className="text-gray-700">{r.remark || cleanReason}</span> },
    {
      label: "Status",
      value: (
        <span>
          {r.status === "approved" ? (
            <span className="inline-block px-3 py-1 bg-[#14b8a6] text-white text-xs font-semibold rounded-md shadow-2xs">
              Approved
            </span>
          ) : r.status === "rejected" ? (
            <span className="inline-block px-3 py-1 bg-rose-500 text-white text-xs font-semibold rounded-md shadow-2xs">
              Rejected
            </span>
          ) : (
            <span className="inline-block px-3 py-1 bg-[#38bdf8] text-white text-xs font-semibold rounded-md shadow-2xs">
              Pending
            </span>
          )}
        </span>
      ),
    },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200/80 p-5 shadow-2xs">
      <div className="text-[#0284c7] font-semibold text-xs tracking-wider uppercase pb-3 border-b border-gray-100">
        LEAVE TYPE INFO
      </div>

      <div className="mt-4 divide-y divide-gray-50 text-xs">
        {rows.map((row) => (
          <div key={row.label} className="py-2.5 grid grid-cols-1 sm:grid-cols-4 gap-2 items-center">
            <div className="text-gray-500 sm:col-span-1">{row.label}</div>
            <div className="sm:col-span-3">{row.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
});
