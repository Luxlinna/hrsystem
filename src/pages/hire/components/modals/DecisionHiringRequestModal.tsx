import { memo } from "react";
import type { HiringRequest } from "../../types";

interface DecisionHiringRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: HiringRequest | null;
  action: "approved" | "rejected";
  reason?: string;
  rejectionReason?: string;
  setReason?: (reason: string) => void;
  setRejectionReason?: (reason: string) => void;
  processing: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export const DecisionHiringRequestModal = memo(function DecisionHiringRequestModal({
  isOpen,
  onClose,
  request,
  action,
  reason,
  rejectionReason,
  setReason,
  setRejectionReason,
  processing,
  onSubmit,
}: DecisionHiringRequestModalProps) {
  if (!isOpen || !request) return null;

  const currentReason = reason ?? rejectionReason ?? "";
  const updateReason = setReason || setRejectionReason || (() => {});

  const isApprove = action === "approved";

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className={`p-6 border-b border-gray-100 ${isApprove ? "bg-emerald-50/60" : "bg-rose-50/60"}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${isApprove ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}>
                <i className={isApprove ? "ri-checkbox-circle-line text-xl" : "ri-close-circle-line text-xl"} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  {isApprove ? "Accept & Publish Requisition" : "Reject Hiring Requisition"}
                </h2>
                <p className="text-xs text-gray-500">Executive CEO Decision</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg hover:bg-black/5 flex items-center justify-center text-gray-400 hover:text-gray-700 cursor-pointer"
            >
              <i className="ri-close-line text-lg" />
            </button>
          </div>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-4">
          {/* Requisition Summary Card */}
          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-gray-900">{request.title}</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                {request.headcount} opening{request.headcount > 1 ? "s" : ""}
              </span>
            </div>
            <div className="text-xs text-gray-600 space-y-1">
              <p><strong>Department:</strong> {request.department} {request.branches?.name ? `· ${request.branches.name}` : ""}</p>
              <p><strong>Requested By:</strong> {request.requested_by_name} ({new Date(request.created_at).toLocaleDateString()})</p>
              {request.justification && (
                <p className="text-gray-500 italic mt-1 bg-white p-2.5 rounded-xl border border-gray-100">
                  "{request.justification}"
                </p>
              )}
            </div>
          </div>

          {isApprove ? (
            <p className="text-xs text-gray-600">
              Approving this requisition will mark it as <strong>Approved by CEO</strong>, automatically generate an <strong>Active Job Posting</strong> for recruitment, and report the headcount authorization to the <strong>Chairman / Chairwoman</strong>.
            </p>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Reason for Rejection *
              </label>
              <textarea
                rows={3}
                required
                placeholder="Explain why this requisition is declined (e.g. budget cap, defer to Q3, etc.)..."
                value={currentReason}
                onChange={(e) => updateReason(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white transition-all"
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={processing}
              className={`inline-flex items-center gap-2 px-5 py-2.5 text-white rounded-xl text-sm font-semibold transition-all shadow-md disabled:opacity-50 cursor-pointer ${
                isApprove
                  ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20"
                  : "bg-rose-600 hover:bg-rose-700 shadow-rose-600/20"
              }`}
            >
              {processing ? (
                <>
                  <i className="ri-loader-4-line animate-spin" /> Processing...
                </>
              ) : isApprove ? (
                <>
                  <i className="ri-check-line" /> Accept & Authorize
                </>
              ) : (
                <>
                  <i className="ri-close-line" /> Confirm Rejection
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});
