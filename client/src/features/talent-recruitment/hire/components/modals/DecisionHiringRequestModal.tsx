import { memo, useState } from "react";
import type { HiringRequest } from "../../types";
import { formatDateTime } from "../../hireUtils";
import { exportHiringRequestPdf } from "../../exports/exportHiringRequestPdf";

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
  const [showFullJd, setShowFullJd] = useState(false);

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
    if (isStage1Branch) return "Stage 1: Branch CEO / Director";
    if (isStage2HrReview) return "Stage 2: HR Manager";
    if (isStage3HrAdmin) return "Stage 3: HR Admin Director";
    return "Stage 4: Chairwoman / Chairman";
  };

  const getStageSubtitle = () => {
    if (!isApprove) return "Decline this requisition with explanatory feedback.";
    if (isStage1Branch) return "Endorse headcount for your branch and forward to HR Manager.";
    if (isStage2HrReview) return "Review role specification and forward to HR Admin Director.";
    if (isStage3HrAdmin) return "Validate enterprise HR compliance and forward to Chairwoman/Chairman.";
    return "Final executive authorization — will publish vacancy live immediately.";
  };

  const getActionDescription = () => {
    if (isStage1Branch) {
      return (
        <>
          By approving this requisition, you endorse the headcount for your branch and forward it to the{" "}
          <strong>HR Division (HR Manager)</strong> for review.
        </>
      );
    }
    if (isStage2HrReview) {
      return (
        <>
          By endorsing this requisition, you confirm HR review and forward it to the{" "}
          <strong>HR Division Admin / Director</strong> for administrative sign-off.
        </>
      );
    }
    if (isStage3HrAdmin) {
      return (
        <>
          By approving this requisition, you provide HR Division clearance and escalate it to the{" "}
          <strong>Chairwoman</strong> for final authorization.
        </>
      );
    }
    return (
      <>
        By authorizing this requisition, you complete the full 4-stage recruitment governance pipeline, mark it as{" "}
        <strong>Approved</strong>, and immediately create a live <strong>Active Job Posting</strong>.
      </>
    );
  };

  const departmentDisplay = [
    request.department,
    request.business_unit || request.branches?.name || "",
  ]
    .filter(Boolean)
    .join(" - ");

  const hasStructuredJd = Boolean(
    request.jd_summary ||
      request.jd_responsibilities ||
      request.jd_requirements ||
      request.jd_qualifications ||
      request.jd_reporting_line
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-2xl sm:max-w-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-slate-100 relative my-auto">
        {/* Subtle decorative curved background shape in top right corner */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#E8F8F0] rounded-bl-[100px] pointer-events-none" />

        {/* Modal Header */}
        <div className="px-6 pt-6 pb-4 flex items-start justify-between relative z-10">
          <div className="flex items-center gap-3.5">
            <div
              className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 ${
                isApprove
                  ? "bg-[#E8F8F0] text-[#00A86B]"
                  : "bg-rose-100/90 text-rose-600"
              }`}
            >
              <i
                className={
                  isApprove
                    ? "ri-team-line text-xl"
                    : "ri-close-circle-line text-xl"
                }
              />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                {getStageTitle()}
              </h2>
              <p className="text-xs text-slate-500 font-normal mt-0.5">
                {getStageSubtitle()}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors cursor-pointer shrink-0"
          >
            <i className="ri-close-line text-2xl" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={onSubmit} className="px-6 pb-6 space-y-3.5 relative z-10">
          {/* Card 1: Main Requisition Info Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 space-y-3.5 shadow-2xs">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-[#E8F1FF] text-[#2B6CB0] flex items-center justify-center text-xl shrink-0 mt-0.5">
                  <i className="ri-briefcase-line" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 leading-snug">
                    {request.title}
                  </h3>
                  <p className="text-xs text-slate-500 font-normal mt-0.5">
                    <strong className="font-semibold text-slate-700">Department:</strong> {departmentDisplay || "General"}
                  </p>
                  <p className="text-xs text-slate-500 font-normal">
                    <strong className="font-semibold text-slate-700">Requested By:</strong> {request.requested_by_name || "Unknown"} (
                    {formatDateTime(request.created_at)})
                  </p>
                </div>
              </div>

              <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold bg-[#E8F1FF] text-[#2563EB] shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]" />
                {request.headcount} opening{request.headcount > 1 ? "s" : ""}
              </span>
            </div>

            {/* Job Description & Role Requirements Inner Box */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                  <i className="ri-file-text-line text-[#2563EB]" />
                  <span>Job Description &amp; Role Requirements</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowFullJd((prev) => !prev)}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-[#2563EB] hover:text-[#1D4ED8] bg-white hover:bg-slate-50 border border-slate-200 transition-colors shadow-2xs cursor-pointer"
                >
                  <i className={showFullJd ? "ri-eye-off-line text-xs" : "ri-eye-line text-xs"} />
                  <span>{showFullJd ? "Hide Full JD" : "View Full JD"}</span>
                </button>
              </div>

              {/* Justification note container */}
              <div className="bg-[#F1F5F9]/80 rounded-xl p-3.5 border border-slate-100 text-xs text-slate-600 font-normal min-h-[44px] flex items-center">
                {request.justification ? (
                  <p className="italic">"{request.justification}"</p>
                ) : request.jd_summary ? (
                  <p className="line-clamp-2">"{request.jd_summary}"</p>
                ) : (
                  <p className="italic text-slate-400">"No additional justification notes provided."</p>
                )}
              </div>

              {/* Expanded Full JD Details */}
              {showFullJd && (
                <div className="mt-2 p-4 bg-[#F8FAFC] rounded-xl border border-blue-100 space-y-3 text-xs text-slate-700 animate-in fade-in duration-150">
                  {request.jd_reporting_line && (
                    <div className="pb-2 border-b border-slate-200/60 flex items-center gap-2">
                      <span className="font-semibold text-slate-500">Reports To:</span>
                      <span className="font-bold text-slate-800">{request.jd_reporting_line}</span>
                    </div>
                  )}

                  {request.jd_summary && (
                    <div>
                      <p className="font-bold text-slate-900 mb-0.5 flex items-center gap-1">
                        <i className="ri-information-line text-blue-600" /> Purpose &amp; Summary
                      </p>
                      <p className="pl-4 text-slate-600 leading-relaxed whitespace-pre-wrap">
                        {request.jd_summary}
                      </p>
                    </div>
                  )}

                  {request.jd_responsibilities && (
                    <div>
                      <p className="font-bold text-slate-900 mb-0.5 flex items-center gap-1">
                        <i className="ri-task-line text-emerald-600" /> Key Responsibilities
                      </p>
                      <p className="pl-4 text-slate-600 leading-relaxed whitespace-pre-wrap">
                        {request.jd_responsibilities}
                      </p>
                    </div>
                  )}

                  {request.jd_requirements && (
                    <div>
                      <p className="font-bold text-slate-900 mb-0.5 flex items-center gap-1">
                        <i className="ri-checkbox-circle-line text-amber-600" /> Core Competencies &amp; Skills
                      </p>
                      <p className="pl-4 text-slate-600 leading-relaxed whitespace-pre-wrap">
                        {request.jd_requirements}
                      </p>
                    </div>
                  )}

                  {request.jd_qualifications && (
                    <div>
                      <p className="font-bold text-slate-900 mb-0.5 flex items-center gap-1">
                        <i className="ri-award-line text-indigo-600" /> Education &amp; Qualifications
                      </p>
                      <p className="pl-4 text-slate-600 leading-relaxed whitespace-pre-wrap">
                        {request.jd_qualifications}
                      </p>
                    </div>
                  )}

                  {!hasStructuredJd && request.job_description && (
                    <div>
                      <p className="font-bold text-slate-900 mb-0.5">Job Description</p>
                      <p className="pl-4 text-slate-600 leading-relaxed whitespace-pre-wrap">
                        {request.job_description}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Card 2: "Your Action" Card */}
          {isApprove ? (
            <div className="bg-[#F0FDF4] border border-[#DCFCE7] rounded-2xl p-4 sm:p-5 flex items-start gap-3.5 shadow-2xs">
              <div className="w-9 h-9 rounded-xl bg-[#DCFCE7] text-[#00A86B] flex items-center justify-center shrink-0 mt-0.5">
                <i className="ri-checkbox-circle-line text-lg" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 mb-0.5">Your Action</h4>
                <p className="text-xs text-slate-600 leading-relaxed">{getActionDescription()}</p>
              </div>
            </div>
          ) : (
            <div className="bg-rose-50/50 border border-rose-100 rounded-2xl p-4 space-y-2 shadow-2xs">
              <div className="flex items-center gap-2 text-xs font-bold text-rose-900">
                <i className="ri-error-warning-line text-rose-600 text-sm" />
                <span>Reason for Rejection *</span>
              </div>
              <textarea
                rows={3}
                required
                placeholder="Explain why this requisition is declined (e.g. budget cap, defer to Q3, etc.)..."
                value={currentReason}
                onChange={(e) => updateReason(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-rose-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all font-medium resize-none"
              />
            </div>
          )}

          {/* Card 3: 4-Column Summary Grid */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-3.5 shadow-2xs">
            {/* 1. Department */}
            <div className="flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#F3E8FF] text-[#9333EA] flex items-center justify-center shrink-0 mt-0.5">
                <i className="ri-building-line text-sm" />
              </div>
              <div className="min-w-0">
                <span className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  Department
                </span>
                <span className="block text-xs font-bold text-slate-800 line-clamp-2 leading-snug mt-0.5">
                  {departmentDisplay || "General"}
                </span>
              </div>
            </div>

            {/* 2. Requested By */}
            <div className="flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#CCFBF1] text-[#0D9488] flex items-center justify-center shrink-0 mt-0.5">
                <i className="ri-user-line text-sm" />
              </div>
              <div className="min-w-0">
                <span className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  Requested By
                </span>
                <span className="block text-xs font-bold text-slate-800 truncate leading-snug mt-0.5">
                  {request.requested_by_name || "Unknown"}
                </span>
                <span className="block text-[10px] text-slate-400 font-normal leading-tight">
                  {formatDateTime(request.created_at)}
                </span>
              </div>
            </div>

            {/* 3. Position */}
            <div className="flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#F3E8FF] text-[#9333EA] flex items-center justify-center shrink-0 mt-0.5">
                <i className="ri-group-line text-sm" />
              </div>
              <div className="min-w-0">
                <span className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  Position
                </span>
                <span className="block text-xs font-bold text-slate-800 truncate leading-snug mt-0.5">
                  {request.title}
                </span>
              </div>
            </div>

            {/* 4. Openings */}
            <div className="flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#E0EDFF] text-[#2563EB] flex items-center justify-center shrink-0 mt-0.5">
                <i className="ri-file-list-3-line text-sm" />
              </div>
              <div className="min-w-0">
                <span className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  Openings
                </span>
                <span className="block text-xs font-bold text-slate-800 leading-snug mt-0.5">
                  {request.headcount}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons Footer */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={onClose}
              className="text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 px-2 py-2 transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => exportHiringRequestPdf(request, { mode: "job_description", buLogo: "" })}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-[#2563EB] hover:text-blue-700 bg-white hover:bg-blue-50/80 border border-[#2563EB] transition-colors shadow-2xs cursor-pointer"
              >
                <i className="ri-file-text-line text-[#2563EB] text-base" />
                <span>View JD</span>
              </button>

              <button
                type="submit"
                disabled={processing}
                className={`inline-flex items-center gap-2 px-5 py-2.5 text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-md disabled:opacity-50 cursor-pointer ${
                  isApprove
                    ? "bg-[#00966D] hover:bg-[#00825E] shadow-[#00966D]/20"
                    : "bg-rose-600 hover:bg-rose-700 shadow-rose-600/20"
                }`}
              >
                {processing ? (
                  <>
                    <i className="ri-loader-4-line animate-spin" /> Processing...
                  </>
                ) : isApprove ? (
                  <>
                    <i className="ri-check-line text-base font-bold" /> Accept &amp; Authorize
                  </>
                ) : (
                  <>
                    <i className="ri-close-line text-base font-bold" /> Confirm Rejection
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
});
