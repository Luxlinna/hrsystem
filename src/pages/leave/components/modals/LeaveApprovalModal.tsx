import { memo } from "react";
import type { LeaveRequest } from "../../types";
import { LEAVE_TYPE_CONFIG } from "../../constants";
import { formatDateShort } from "../../dateUtils";

interface LeaveApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedRequest: LeaveRequest | null;
  approvalAction: "approved" | "rejected";
  approvalNote: string;
  setApprovalNote: (note: string) => void;
  processingApproval: boolean;
  onConfirm: () => Promise<void>;
}

export const LeaveApprovalModal = memo(function LeaveApprovalModal({
  isOpen,
  onClose,
  selectedRequest,
  approvalAction,
  approvalNote,
  setApprovalNote,
  processingApproval,
  onConfirm,
}: LeaveApprovalModalProps) {
  if (!isOpen || !selectedRequest) return null;

  const isApprove = approvalAction === "approved";
  const cfg = LEAVE_TYPE_CONFIG[selectedRequest.leave_type] || LEAVE_TYPE_CONFIG.annual;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-2xl flex items-center justify-center text-lg ${
                isApprove ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
              }`}
            >
              <i className={isApprove ? "ri-checkbox-circle-line" : "ri-close-circle-line"} />
            </div>
            <h3 className="text-base font-extrabold text-gray-900">
              {isApprove ? "Approve Leave Request" : "Reject Leave Request"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 cursor-pointer"
          >
            <i className="ri-close-line text-lg" />
          </button>
        </div>

        {/* Request Brief Summary */}
        <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-100 mb-4 text-xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Employee:</span>
            <span className="font-bold text-gray-900">
              {selectedRequest.employees?.first_name} {selectedRequest.employees?.last_name}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Leave Type:</span>
            <span className={`font-bold ${cfg.text}`}>{cfg.label}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Duration:</span>
            <span className="font-extrabold text-gray-900">
              {selectedRequest.days} days ({formatDateShort(selectedRequest.start_date)} - {formatDateShort(selectedRequest.end_date)})
            </span>
          </div>
        </div>

        {/* Approver Note */}
        <div className="mb-4">
          <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
            Managerial Decision Note (Optional)
          </label>
          <textarea
            rows={3}
            value={approvalNote}
            onChange={(e) => setApprovalNote(e.target.value)}
            placeholder={
              isApprove
                ? "Add an optional approval message..."
                : "Provide a reason for rejection..."
            }
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D] font-medium resize-none"
          />
        </div>

        <div className="flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-xs font-bold text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={processingApproval}
            onClick={onConfirm}
            className={`px-5 py-2.5 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50 ${
              isApprove ? "bg-emerald-600 hover:bg-emerald-700" : "bg-rose-600 hover:bg-rose-700"
            }`}
          >
            {processingApproval
              ? "Processing..."
              : isApprove
              ? "Confirm Approval"
              : "Confirm Rejection"}
          </button>
        </div>
      </div>
    </div>
  );
});
