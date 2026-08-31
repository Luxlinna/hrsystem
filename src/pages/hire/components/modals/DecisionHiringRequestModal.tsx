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
  const status = request.status || "pending";
  const isStage1Branch = status === "pending" || status === "pending_branch_review";
  const isStage2HrReview = status === "pending_hr_review";
  const isStage3HrAdmin = status === "pending_hr_admin_review";
  const isStage4Chairman = status === "pending_chairman_review";

  const getStageTitle = () => {
    if (!isApprove) return "Reject Hiring Requisition";
    if (isStage1Branch) return "Branch Leadership Endorsement";
    if (isStage2HrReview) return "HR Manager Review & Endorsement";
    if (isStage3HrAdmin) return "Admin Manager Approval";
    return "Chairman Final Round Authorization";
  };

  const getStageSubtitle = () => {
    if (!isApprove) return "Decline this requisition with explanatory feedback.";
    if (isStage1Branch) return "Endorse headcount for your branch and forward to HR Manager.";
    if (isStage2HrReview) return "Review role specification & budget, then forward to Admin Manager.";
    if (isStage3HrAdmin) return "Approve requisition and escalate to Chairman for final round sign-off.";
    return "Final round executive authorization — will publish live job opening.";
  };

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
                  {getStageTitle()}
                </h2>
                <p className="text-xs text-gray-500">
                  {getStageSubtitle()}
                </p>
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
              {request.branch_approved_by && (
                <p className="text-amber-700 font-medium">
                  <strong>Branch Endorsed By:</strong> {request.branch_approved_by}
                </p>
              )}
              {request.hr_reviewed_by && (
                <p className="text-sky-700 font-medium">
                  <strong>HR Manager Reviewed:</strong> {request.hr_reviewed_by}
                </p>
              )}
              {request.hr_admin_approved_by && (
                <p className="text-purple-700 font-medium">
                  <strong>HR Admin Approved:</strong> {request.hr_admin_approved_by}
                </p>
              )}
              {request.justification && (
                <p className="text-gray-500 italic mt-1 bg-white p-2.5 rounded-xl border border-gray-100">
                  "{request.justification}"
                </p>
              )}
            </div>
          </div>

          {isApprove ? (
            <p className="text-xs text-gray-600 leading-relaxed">
              {isStage1Branch && (
                <>Approving this requisition endorses the headcount for your branch and forwards it to the <strong>HR Division (HR Manager)</strong> for review.</>
              )}
              {isStage2HrReview && (
                <>Endorsing this requisition confirms HR review and forwards it to the <strong>HR Division Admin / Director</strong> for administrative sign-off.</>
              )}
              {isStage3HrAdmin && (
                <>Approving this requisition provides HR Division clearance and escalates it to the <strong>Executive Chairman</strong> for final authorization.</>
              )}
              {isStage4Chairman && (
                <>Authorizing this requisition completes the full 4-stage recruitment governance pipeline, marks it as <strong>Approved</strong>, and immediately creates a live <strong>Active Job Posting</strong>.</>
              )}
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
