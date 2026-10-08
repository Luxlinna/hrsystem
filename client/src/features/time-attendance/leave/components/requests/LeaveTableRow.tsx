import { memo } from "react";
import type { LeaveRequest } from "../../types";
import { getLeaveTypeDisplay, formatDMY, formatDateTime, getLeaveEmployeeName, getLeaveEmployeeInitials } from "../../utils/leaveDisplayUtils";
import { LeaveRowActionsDropdown } from "./LeaveRowActionsDropdown";

interface LeaveTableRowProps {
  request: LeaveRequest;
  index: number;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  canAct: boolean;
  actionLabel: string;
  canCancel: boolean;
  canDelete?: boolean;
  onInspect: (req: LeaveRequest) => void;
  onApprove: (req: LeaveRequest) => void;
  onReject: (req: LeaveRequest) => void;
  onCancel: (req: LeaveRequest) => void;
  onDelete?: (req: LeaveRequest) => void;
}

export const LeaveTableRow = memo(function LeaveTableRow({
  request: r,
  index,
  isSelected,
  onToggleSelect,
  canAct,
  actionLabel,
  canCancel,
  canDelete,
  onInspect,
  onApprove,
  onReject,
  onCancel,
  onDelete,
}: LeaveTableRowProps) {
  const typeInfo = getLeaveTypeDisplay(r.leave_type);
  const isHalfDay = r.days < 1 || (r.reason && r.reason.toLowerCase().includes("half day"));
  const empName = getLeaveEmployeeName(r.employees);
  const empCode = r.employees?.employee_code || r.employees?.biometric_user_id || r.employee_id.slice(0, 5);

  const cleanReason = (r.reason || "—")
    .replace(/\[Stage:[^\]]+\]/g, "")
    .replace(/\[Endorsed[^\]]+\]/g, "")
    .trim() || "—";

  const dateRangeStr = r.start_date === r.end_date
    ? `${formatDMY(r.start_date)} - ${formatDMY(r.end_date)}`
    : `${formatDMY(r.start_date)} - ${formatDMY(r.end_date)}`;

  return (
    <tr
      className={`border-b border-gray-100 hover:bg-slate-50/70 transition-colors ${
        isSelected ? "bg-blue-50/40" : ""
      }`}
    >
      <td className="px-4 py-3 text-center">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggleSelect(r.id)}
          className="w-4 h-4 rounded border-gray-300 text-[#253C7D] focus:ring-0 cursor-pointer"
        />
      </td>

      <td className="px-3 py-3 text-xs text-gray-500 font-medium">
        {index + 1}
      </td>

      <td className="px-4 py-3 min-w-[220px]">
        <div className="font-semibold text-gray-800 text-[13px] leading-snug">
          {typeInfo.fullName}
        </div>
        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
          <span className="px-1.5 py-0.5 bg-[#3b82f6] text-white text-[10px] font-medium rounded">
            Daily
          </span>
          <span className="px-1.5 py-0.5 bg-white border border-gray-300 text-gray-600 text-[10px] font-medium rounded">
            {isHalfDay ? "Half Day" : "Full Day"}
          </span>
        </div>
      </td>

      <td className="px-4 py-3 whitespace-nowrap min-w-[170px]">
        <div className="flex items-center gap-2.5">
          {r.employees?.avatar_url ? (
            <img
              src={r.employees.avatar_url}
              alt={empName}
              className="w-8 h-8 rounded-full object-cover border border-gray-200"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 font-semibold text-xs flex items-center justify-center shrink-0">
              {getLeaveEmployeeInitials(r.employees)}
            </div>
          )}
          <div>
            <div className="font-bold text-gray-800 text-[13px]">{empName}</div>
            <span className="inline-block mt-0.5 px-1 py-0.1 border border-gray-300 rounded text-[10px] text-gray-500 font-mono">
              {empCode}
            </span>
          </div>
        </div>
      </td>

      <td className="px-4 py-3 whitespace-nowrap min-w-[190px]">
        <div className="text-xs font-semibold text-gray-800">{dateRangeStr}</div>
        <div className="flex items-center gap-1 mt-1.5 flex-wrap">
          <span className="px-1.5 py-0.5 bg-[#3b82f6] text-white text-[10px] font-semibold rounded">
            {r.days} {r.days === 1 ? "Days" : "Days"}
          </span>
          {isHalfDay && (
            <span className="px-1.5 py-0.5 bg-[#3b82f6] text-white text-[10px] font-semibold rounded">
              12:00 PM - 5:00 PM : 0.5 Day
            </span>
          )}
          <span className="px-1.5 py-0.5 bg-[#7e22ce] text-white text-[10px] font-semibold rounded">
            {typeInfo.code} : - {r.days} Days
          </span>
        </div>
      </td>

      <td className="px-4 py-3 min-w-[200px]">
        <div className="text-xs text-gray-700 font-medium line-clamp-1">{cleanReason}</div>
        <div className="text-[11px] text-gray-500 mt-1">
          Requested by <span className="font-medium text-gray-700">{empName}</span> on{" "}
          <span>{formatDateTime(r.created_at)}</span>
        </div>
      </td>

      <td className="px-4 py-3 text-center whitespace-nowrap">
        {r.status === "approved" ? (
          <span className="inline-block px-3 py-1 bg-[#14b8a6] text-white text-[11px] font-semibold rounded-md shadow-2xs">
            Approved
          </span>
        ) : r.status === "rejected" ? (
          <span className="inline-block px-3 py-1 bg-rose-500 text-white text-[11px] font-semibold rounded-md shadow-2xs">
            Rejected
          </span>
        ) : r.status === "cancelled" ? (
          <span className="inline-block px-3 py-1 bg-slate-400 text-white text-[11px] font-semibold rounded-md shadow-2xs">
            Cancelled
          </span>
        ) : (
          <span className="inline-block px-3 py-1 bg-[#38bdf8] text-white text-[11px] font-semibold rounded-md shadow-2xs">
            Pending
          </span>
        )}
      </td>

      <td className="px-4 py-3 text-right whitespace-nowrap">
        <LeaveRowActionsDropdown
          request={r}
          canAct={canAct}
          actionLabel={actionLabel}
          canCancel={canCancel}
          canDelete={canDelete}
          onInspect={onInspect}
          onApprove={(req) => onApprove(req)}
          onReject={(req) => onReject(req)}
          onCancel={(req) => onCancel(req)}
          onDelete={onDelete}
        />
      </td>
    </tr>
  );
});
