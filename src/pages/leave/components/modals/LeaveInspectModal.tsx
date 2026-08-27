import { memo } from "react";
import type { LeaveRequest } from "../../types";
import { LEAVE_TYPE_CONFIG, STATUS_CONFIG } from "../../constants";
import { formatDate, formatDateShort } from "../../dateUtils";

interface LeaveInspectModalProps {
  inspectRequest: LeaveRequest | null;
  onClose: () => void;
  canApproveLeave: boolean;
  myEmployeeId: string;
  onOpenApprovalModal: (req: LeaveRequest, action: "approved" | "rejected") => void;
  onOpenCancelModal: (req: LeaveRequest) => void;
}

export const LeaveInspectModal = memo(function LeaveInspectModal({
  inspectRequest,
  onClose,
  canApproveLeave,
  myEmployeeId,
  onOpenApprovalModal,
  onOpenCancelModal,
}: LeaveInspectModalProps) {
  if (!inspectRequest) return null;

  const typeCfg = LEAVE_TYPE_CONFIG[inspectRequest.leave_type] || LEAVE_TYPE_CONFIG.annual;
  const statusCfg = STATUS_CONFIG[inspectRequest.status] || STATUS_CONFIG.pending;
  const isOwn = inspectRequest.employee_id === myEmployeeId;
  const canCancel = isOwn && (inspectRequest.status === "pending" || inspectRequest.status === "approved");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between mb-5">
          <div>
            <span className="text-[10px] font-mono text-gray-400 font-bold uppercase tracking-wider block">
              LEAVE ID: #{inspectRequest.id.slice(0, 8)}
            </span>
            <h3 className="text-base font-extrabold text-gray-900 mt-0.5">Leave Application Details</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 cursor-pointer"
          >
            <i className="ri-close-line text-lg" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Employee Header */}
          <div className="flex items-center gap-3 p-3.5 bg-gray-50 rounded-2xl border border-gray-100">
            <div className="w-10 h-10 rounded-2xl bg-[#253C7D]/10 text-[#253C7D] font-extrabold text-sm flex items-center justify-center shrink-0">
              {inspectRequest.employees?.first_name?.[0]}
              {inspectRequest.employees?.last_name?.[0]}
            </div>
            <div className="min-w-0">
              <h4 className="font-extrabold text-sm text-gray-900 truncate">
                {inspectRequest.employees?.first_name} {inspectRequest.employees?.last_name}
              </h4>
              <p className="text-[11px] text-gray-400 font-medium truncate">
                {inspectRequest.employees?.role || "Staff"} &middot; {inspectRequest.employees?.department || "General"}
              </p>
            </div>
          </div>

          {/* Status & Type Details */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Leave Type</span>
              <span className={`text-xs font-extrabold mt-1 inline-flex items-center gap-1 ${typeCfg.text}`}>
                <i className={typeCfg.icon} />
                {typeCfg.label}
              </span>
            </div>

            <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Status</span>
              <span className={`text-xs font-extrabold mt-1 inline-flex items-center gap-1 ${statusCfg.text}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                {statusCfg.label}
              </span>
            </div>
          </div>

          {/* Duration info */}
          <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-100 text-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Total Duration:</span>
              <strong className="font-extrabold text-gray-900">
                {inspectRequest.days} working {inspectRequest.days === 1 ? "day" : "days"}
              </strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Dates:</span>
              <span className="font-semibold text-gray-700">
                {formatDate(inspectRequest.start_date)} &rarr; {formatDate(inspectRequest.end_date)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Submitted On:</span>
              <span className="text-gray-500 font-medium">
                {formatDate(inspectRequest.created_at?.slice(0, 10))}
              </span>
            </div>
          </div>

          {/* Reason */}
          {inspectRequest.reason && (
            <div>
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                Reason & Notes
              </span>
              <p className="text-xs text-gray-700 bg-gray-50 rounded-2xl p-3.5 border border-gray-100 leading-relaxed whitespace-pre-wrap">
                {inspectRequest.reason}
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-5 mt-4 border-t border-gray-100 flex items-center justify-end gap-2">
          {canApproveLeave && inspectRequest.status === "pending" && (
            <>
              <button
                onClick={() => {
                  onClose();
                  onOpenApprovalModal(inspectRequest, "approved");
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
              >
                Approve
              </button>
              <button
                onClick={() => {
                  onClose();
                  onOpenApprovalModal(inspectRequest, "rejected");
                }}
                className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Reject
              </button>
            </>
          )}

          {canCancel && (
            <button
              onClick={() => {
                onClose();
                onOpenCancelModal(inspectRequest);
              }}
              className="px-4 py-2 bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              Cancel Leave
            </button>
          )}

          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
});
