import { memo } from "react";
import type { LeaveRequest } from "../../types";
import { LEAVE_TYPE_CONFIG } from "../../constants";
import { formatDateShort } from "../../dateUtils";

interface LeaveCancelModalProps {
  isOpen: boolean;
  onClose: () => void;
  cancelTargetRequest: LeaveRequest | null;
  cancelReason: string;
  setCancelReason: (reason: string) => void;
  processingCancel: boolean;
  onConfirm: () => Promise<void>;
}

export const LeaveCancelModal = memo(function LeaveCancelModal({
  isOpen,
  onClose,
  cancelTargetRequest,
  cancelReason,
  setCancelReason,
  processingCancel,
  onConfirm,
}: LeaveCancelModalProps) {
  if (!isOpen || !cancelTargetRequest) return null;

  const cfg = LEAVE_TYPE_CONFIG[cancelTargetRequest.leave_type] || LEAVE_TYPE_CONFIG.annual;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center text-lg">
              <i className="ri-indeterminate-circle-line" />
            </div>
            <h3 className="text-base font-extrabold text-gray-900">Cancel Leave Request</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 cursor-pointer"
          >
            <i className="ri-close-line text-lg" />
          </button>
        </div>

        <p className="text-xs text-gray-500 mb-4 leading-relaxed">
          Are you sure you want to cancel this leave application? The requested days will be restored to your balance.
        </p>

        {/* Brief Details */}
        <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-100 mb-4 text-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Leave Type:</span>
            <span className={`font-bold ${cfg.text}`}>{cfg.label}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Dates:</span>
            <span className="font-extrabold text-gray-900">
              {formatDateShort(cancelTargetRequest.start_date)} - {formatDateShort(cancelTargetRequest.end_date)} ({cancelTargetRequest.days} days)
            </span>
          </div>
        </div>

        {/* Reason */}
        <div className="mb-4">
          <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
            Reason for Cancellation (Optional)
          </label>
          <textarea
            rows={2}
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            placeholder="Change of plans, rescheduled trip, etc..."
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D] font-medium resize-none"
          />
        </div>

        <div className="flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-xs font-bold text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
          >
            Go Back
          </button>
          <button
            type="button"
            disabled={processingCancel}
            onClick={onConfirm}
            className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
          >
            {processingCancel ? "Cancelling..." : "Confirm Cancellation"}
          </button>
        </div>
      </div>
    </div>
  );
});
