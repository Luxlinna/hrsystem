import { memo } from "react";
import type { LeaveRequest } from "../../types";
import { LEAVE_TYPE_CONFIG, STATUS_CONFIG } from "../../constants";
import { formatDate, formatDateShort } from "../../dateUtils";

interface LeaveTableViewProps {
  requests: LeaveRequest[];
  canApproveLeave: boolean;
  myEmployeeId: string;
  onOpenApprovalModal: (req: LeaveRequest, action: "approved" | "rejected") => void;
  onOpenCancelModal: (req: LeaveRequest) => void;
  onInspectRequest: (req: LeaveRequest) => void;
}

export const LeaveTableView = memo(function LeaveTableView({
  requests,
  canApproveLeave,
  myEmployeeId,
  onOpenApprovalModal,
  onOpenCancelModal,
  onInspectRequest,
}: LeaveTableViewProps) {
  return (
    <div className="hidden lg:block overflow-x-auto">
      <table className="w-full text-left text-xs border-collapse">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50/70 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
            <th className="px-5 py-3.5">Employee</th>
            <th className="px-5 py-3.5">Leave Type</th>
            <th className="px-5 py-3.5">Duration</th>
            <th className="px-5 py-3.5">Days</th>
            <th className="px-5 py-3.5">Status</th>
            <th className="px-5 py-3.5">Submitted</th>
            <th className="px-5 py-3.5 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {requests.map((r) => {
            const typeCfg = LEAVE_TYPE_CONFIG[r.leave_type] || LEAVE_TYPE_CONFIG.annual;
            const statusCfg = STATUS_CONFIG[r.status] || STATUS_CONFIG.pending;
            const isOwn = r.employee_id === myEmployeeId;
            const canCancel = isOwn && (r.status === "pending" || r.status === "approved");

            return (
              <tr
                key={r.id}
                id={`leave-request-desktop-${r.id}`}
                className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                onClick={() => onInspectRequest(r)}
              >
                <td className="px-5 py-3.5 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#253C7D]/10 text-[#253C7D] font-bold text-xs flex items-center justify-center shrink-0">
                      {r.employees?.first_name?.[0]}
                      {r.employees?.last_name?.[0]}
                    </div>
                    <div>
                      <p className="font-extrabold text-gray-900 text-xs sm:text-[13px]">
                        {r.employees?.first_name} {r.employees?.last_name}
                      </p>
                      <p className="text-[11px] text-gray-400 font-medium">
                        {r.employees?.role || "Staff"} &middot; {r.employees?.department || "General"}
                      </p>
                    </div>
                  </div>
                </td>

                <td className="px-5 py-3.5 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${typeCfg.bg} ${typeCfg.text}`}
                  >
                    <i className={typeCfg.icon} />
                    {typeCfg.label}
                  </span>
                </td>

                <td className="px-5 py-3.5 whitespace-nowrap font-medium text-gray-700">
                  {formatDateShort(r.start_date)} &rarr; {formatDateShort(r.end_date)}
                </td>

                <td className="px-5 py-3.5 whitespace-nowrap">
                  <span className="font-extrabold text-gray-900 bg-gray-100 px-2 py-0.5 rounded-md">
                    {r.days} {r.days === 1 ? "day" : "days"}
                  </span>
                </td>

                <td className="px-5 py-3.5 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${statusCfg.bg}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                    {statusCfg.label}
                  </span>
                </td>

                <td className="px-5 py-3.5 whitespace-nowrap text-gray-400 font-medium text-[11px]">
                  {formatDate(r.created_at?.slice(0, 10))}
                </td>

                <td
                  className="px-5 py-3.5 text-right whitespace-nowrap"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-end gap-1.5">
                    {canApproveLeave && r.status === "pending" && (
                      <>
                        <button
                          onClick={() => onOpenApprovalModal(r, "approved")}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg transition-colors cursor-pointer"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => onOpenApprovalModal(r, "rejected")}
                          className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[11px] font-bold rounded-lg transition-colors cursor-pointer"
                        >
                          Reject
                        </button>
                      </>
                    )}

                    {canCancel && (
                      <button
                        onClick={() => onOpenCancelModal(r)}
                        className="px-2.5 py-1 bg-gray-100 hover:bg-rose-50 hover:text-rose-700 text-gray-600 text-[11px] font-bold rounded-lg transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                    )}

                    <button
                      onClick={() => onInspectRequest(r)}
                      className="p-1.5 text-gray-400 hover:text-[#253C7D] hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                      title="View Details"
                    >
                      <i className="ri-eye-line text-sm" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
});
