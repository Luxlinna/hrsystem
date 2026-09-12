import { memo, useMemo } from "react";
import type { Candidate, OfferLetter, OfferStatus } from "../../types";
import type { WorkflowModalType } from "../../hooks/useOfferLetters";

interface CandidateOfferLifecycleCardProps {
  candidate: Candidate;
  offer: OfferLetter | null;
  onOpenCreateProposal: () => void;
  onGenerateDraft: (offer: OfferLetter) => Promise<void>;
  onOpenWorkflowModal: (offer: OfferLetter, type: WorkflowModalType) => void;
  onExportPdf: (offer: OfferLetter) => void;
  onExportWord?: (offer: OfferLetter) => void;
}

interface StepItem {
  id: number;
  key: string;
  name: string;
  subtitle: string;
  icon: string;
  isDone: boolean;
  isCurrent: boolean;
  details?: string | null;
}

export const CandidateOfferLifecycleCard = memo(function CandidateOfferLifecycleCard({
  candidate,
  offer,
  onOpenCreateProposal,
  onGenerateDraft,
  onOpenWorkflowModal,
  onExportPdf,
  onExportWord,
}: CandidateOfferLifecycleCardProps) {
  const isQualificationBased = useMemo(() => {
    if (!offer) return false;
    const text = `${offer.special_terms || ""} ${offer.proposal_notes || ""}`.toLowerCase();
    return text.includes("qualification");
  }, [offer]);

  const totalAllowances = useMemo(() => {
    return (offer?.allowances || []).reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  }, [offer]);

  const totalPackage = (offer?.base_salary || 0) + totalAllowances;

  // Determine active step (1 to 6)
  const currentStepNumber = useMemo(() => {
    if (!offer) return 1;
    switch (offer.status as OfferStatus) {
      case "salary_proposal":
      case "salary_approved":
        return 2; // Next is Generate Offer Letter
      case "draft_letter":
      case "hr_review":
        return 3; // HR Review
      case "management_approval":
        return 4; // Management Approval
      case "approved":
        return 5; // Ready to Issue Offer
      case "issued":
        return 6; // Candidate Accept / Reject
      case "accepted":
      case "rejected":
        return 7; // Completed
      default:
        return 2;
    }
  }, [offer]);

  const steps: StepItem[] = useMemo(() => {
    const hasOffer = Boolean(offer);
    const s = offer?.status;

    return [
      {
        id: 1,
        key: "proposal",
        name: "Salary Proposal",
        subtitle: hasOffer
          ? `$${offer?.base_salary.toLocaleString()}/mo`
          : "Define salary & terms",
        icon: "ri-money-dollar-circle-line",
        isDone: hasOffer,
        isCurrent: !hasOffer,
        details: hasOffer
          ? `Proposed by ${offer?.proposed_by_name || "HR"} on ${
              offer?.proposed_at ? new Date(offer.proposed_at).toLocaleDateString() : "Record"
            }`
          : null,
      },
      {
        id: 2,
        key: "generate",
        name: "HR Division Review",
        subtitle: "Review form & click Generate Offer",
        icon: "ri-file-text-line",
        isDone: ["draft_letter", "hr_review", "management_approval", "approved", "issued", "accepted", "rejected"].includes(
          s || ""
        ),
        isCurrent: hasOffer && (s === "salary_proposal" || s === "salary_approved"),
        details: "Form sent across to HR Division for review to generate offer letter",
      },
      {
        id: 3,
        key: "hr_review",
        name: "HR Review",
        subtitle: "Compliance & clause sign-off",
        icon: "ri-shield-check-line",
        isDone: ["management_approval", "approved", "issued", "accepted", "rejected"].includes(s || ""),
        isCurrent: hasOffer && (s === "draft_letter" || s === "hr_review"),
        details: offer?.hr_reviewed_by ? `Endorsed by ${offer.hr_reviewed_by}` : null,
      },
      {
        id: 4,
        key: "approval",
        name: "Approval",
        subtitle: "Executive authorization",
        icon: "ri-award-line",
        isDone: ["approved", "issued", "accepted", "rejected"].includes(s || ""),
        isCurrent: hasOffer && s === "management_approval",
        details: offer?.management_approved_by ? `Authorized by ${offer.management_approved_by}` : null,
      },
      {
        id: 5,
        key: "issue",
        name: "Issue Offer",
        subtitle: "Official PDF & transmit",
        icon: "ri-mail-send-line",
        isDone: ["issued", "accepted", "rejected"].includes(s || ""),
        isCurrent: hasOffer && s === "approved",
        details: offer?.issued_at
          ? `Issued by ${offer.issued_by || "HR"} (Expires: ${offer.expiry_date || "—"})`
          : null,
      },
      {
        id: 6,
        key: "decision",
        name: "Candidate Accept / Reject",
        subtitle: s === "accepted" ? "Candidate Accepted!" : s === "rejected" ? "Candidate Declined" : "Awaiting response",
        icon: s === "accepted" ? "ri-checkbox-circle-fill text-emerald-600" : s === "rejected" ? "ri-close-circle-fill text-rose-600" : "ri-question-answer-line",
        isDone: s === "accepted" || s === "rejected",
        isCurrent: hasOffer && s === "issued",
        details:
          s === "accepted"
            ? `Accepted on ${offer?.decision_at ? new Date(offer.decision_at).toLocaleDateString() : "Record"}`
            : s === "rejected"
            ? `Declined: ${offer?.rejection_reason || "Candidate decline"}`
            : null,
      },
    ];
  }, [offer]);

  return (
    <div className="bg-white rounded-3xl border border-gray-200/90 shadow-2xs overflow-hidden transition-all">
      {/* Header Banner */}
      <div className="p-5 sm:p-6 bg-gradient-to-r from-[#172B4D] via-[#1E3A6D] to-[#253C7D] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-xs flex items-center justify-center text-2xl text-blue-200 shrink-0 border border-white/10 shadow-inner">
            <i className="ri-award-line" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-extrabold tracking-tight">Offer & Compensation Lifecycle</h3>
              {offer && (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-white/15 border border-white/20 text-white">
                  {offer.offer_number}
                </span>
              )}
              {isQualificationBased && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-slate-950 uppercase tracking-wider">
                  Based on qualification
                </span>
              )}
            </div>
            <p className="text-xs text-blue-100/80 mt-0.5">
              Structured 6-stage recruitment offer progression from initial proposal to confirmed candidate decision.
            </p>
          </div>
        </div>

        {/* Quick Actions in Header */}
        <div className="flex items-center gap-2 shrink-0">
          {offer && ["approved", "issued", "accepted"].includes(offer.status) && (
            <>
              {onExportWord && (
                <button
                  type="button"
                  onClick={() => onExportWord(offer)}
                  className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all flex items-center gap-1.5 border border-white/20 cursor-pointer backdrop-blur-xs"
                  title="Download official employment offer letter Word (.docx)"
                >
                  <i className="ri-file-word-line text-sm text-sky-200" />
                  <span>Offer Word</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => onExportPdf(offer)}
                className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all flex items-center gap-1.5 border border-white/20 cursor-pointer backdrop-blur-xs"
                title="Download or print official employment offer letter PDF"
              >
                <i className="ri-file-pdf-line text-sm text-red-300" />
                <span>Offer PDF</span>
              </button>
            </>
          )}

          {!offer && (
            <button
              type="button"
              onClick={onOpenCreateProposal}
              className="px-4 py-2 rounded-xl bg-white text-[#172B4D] hover:bg-blue-50 text-xs font-extrabold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <i className="ri-add-line text-sm" />
              <span>Create Salary Proposal</span>
            </button>
          )}
        </div>
      </div>

      {/* Salary Summary Strip if Offer Exists */}
      {offer && (
        <div className="px-6 py-3 bg-blue-50/60 border-b border-blue-100/70 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4 flex-wrap text-slate-700">
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Gross Base Salary</span>
              <span className="font-extrabold text-slate-900 text-sm">
                ${offer.base_salary.toLocaleString()} <span className="text-xs text-slate-500 font-normal">/ mo</span>
              </span>
            </div>
            {offer.probation_salary && (
              <div className="border-l border-blue-200/60 pl-4">
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Probation Salary ({offer.probation_months} mo)</span>
                <span className="font-bold text-slate-800">
                  ${offer.probation_salary.toLocaleString()} <span className="text-[11px] text-slate-500 font-normal">/ mo</span>
                </span>
              </div>
            )}
            {totalAllowances > 0 && (
              <div className="border-l border-blue-200/60 pl-4">
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Monthly Allowances</span>
                <span className="font-bold text-slate-800">+${totalAllowances.toLocaleString()}</span>
              </div>
            )}
            <div className="border-l border-blue-200/60 pl-4">
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Target Joining Date</span>
              <span className="font-bold text-slate-900">
                {offer.target_start_date ? new Date(offer.target_start_date).toLocaleDateString() : "To be confirmed"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-blue-900 bg-blue-100/80 px-2.5 py-1 rounded-lg border border-blue-200">
              Total Monthly Remuneration: <strong className="font-black text-slate-950">${totalPackage.toLocaleString()}</strong>
            </span>
          </div>
        </div>
      )}

      {/* 6-Step Visual Timeline Progression */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-3 relative">
          {steps.map((step, idx) => {
            const isLast = idx === steps.length - 1;

            return (
              <div
                key={step.key}
                className={`relative p-3.5 rounded-2xl border transition-all flex flex-col justify-between ${
                  step.isCurrent
                    ? "bg-blue-50/50 border-[#253C7D] ring-2 ring-[#253C7D]/20 shadow-xs"
                    : step.isDone
                    ? "bg-slate-50/70 border-emerald-200/90 text-slate-800"
                    : "bg-gray-50/40 border-gray-200/60 opacity-60 text-gray-500"
                }`}
              >
                <div>
                  {/* Step Header */}
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`w-6 h-6 rounded-full text-xs font-black flex items-center justify-center shrink-0 ${
                        step.isDone
                          ? "bg-emerald-600 text-white"
                          : step.isCurrent
                          ? "bg-[#253C7D] text-white animate-pulse"
                          : "bg-gray-200 text-gray-600"
                      }`}
                    >
                      {step.isDone ? <i className="ri-check-line text-xs" /> : step.id}
                    </span>
                    <i
                      className={`${step.icon} text-base ${
                        step.isDone
                          ? "text-emerald-600"
                          : step.isCurrent
                          ? "text-[#253C7D]"
                          : "text-gray-400"
                      }`}
                    />
                  </div>

                  {/* Title & Subtitle */}
                  <h4 className="text-xs font-black text-slate-900 leading-tight line-clamp-1">{step.name}</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{step.subtitle}</p>

                  {step.details && (
                    <p className="text-[10px] text-slate-600 font-medium mt-1.5 pt-1.5 border-t border-slate-200/60 line-clamp-2">
                      {step.details}
                    </p>
                  )}
                </div>

                {/* Status indicator tag */}
                <div className="mt-3 pt-2">
                  {step.isDone ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md">
                      <i className="ri-checkbox-circle-fill text-[11px]" /> Completed
                    </span>
                  ) : step.isCurrent ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-black text-blue-900 bg-blue-100 px-2 py-0.5 rounded-md uppercase tracking-wider">
                      <i className="ri-play-circle-line text-[11px]" /> In Progress
                    </span>
                  ) : (
                    <span className="inline-flex items-center text-[10px] font-medium text-gray-400">
                      Upcoming
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Callout Bar */}
        <div className="mt-5 p-4 bg-gradient-to-r from-slate-50 via-blue-50/40 to-slate-50 rounded-2xl border border-blue-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-blue-950 uppercase tracking-wider flex items-center gap-1.5">
                <i className="ri-flashlight-line text-amber-500" />
                Current Actionable Step
              </span>
              <span className="text-xs font-semibold text-slate-600">
                (Step {Math.min(currentStepNumber, 6)} of 6)
              </span>
            </div>

            {/* Step 1 guidance */}
            {!offer && (
              <p className="text-xs text-slate-600">
                Candidate is ready for compensation proposal. Submit the salary proposal with base compensation and allowances.
              </p>
            )}

            {/* Step 2 guidance: Zero-retyping letter generation */}
            {offer && (offer.status === "salary_proposal" || offer.status === "salary_approved") && (
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-blue-100 text-blue-900 border border-blue-200">
                    Sent to HR Division
                  </span>
                  <span className="text-xs text-blue-950 font-bold">HR Division Reviewing Form</span>
                </div>
                <p className="text-xs text-blue-900 font-medium leading-relaxed">
                  The form has been sent across to the <strong>HR Division for review</strong>. HR Division reviews the proposed terms and clicks <strong>Generate Offer Letter</strong>. The offer letter is compiled directly from candidate and requisition data already in the system —{" "}
                  <strong className="text-blue-950 font-black underline decoration-blue-300">
                    no retyping of name, role, salary, or start date
                  </strong>
                  .
                </p>
              </div>
            )}

            {/* Step 3 guidance: HR Review */}
            {offer && (offer.status === "draft_letter" || offer.status === "hr_review") && (
              <p className="text-xs text-slate-700 font-medium">
                The offer letter has been generated directly from candidate and requisition records. The HR Manager must now review the letter terms, verify labor policy compliance, and endorse it before executive management approval.
              </p>
            )}

            {/* Step 4 guidance: Management Authorization */}
            {offer && offer.status === "management_approval" && (
              <p className="text-xs text-slate-700 font-medium">
                Endorsed by HR Manager. Awaiting final executive management sign-off to authorize formal offer letter issuance.
              </p>
            )}

            {/* Step 5 guidance: Ready to Issue */}
            {offer && offer.status === "approved" && (
              <p className="text-xs text-slate-700 font-medium">
                Fully authorized! Set the offer validity deadline to issue the formal offer letter PDF and notify the candidate.
              </p>
            )}

            {/* Step 6 guidance: Awaiting Response */}
            {offer && offer.status === "issued" && (
              <p className="text-xs text-slate-700 font-medium">
                Official offer letter has been issued (Expires: {offer.expiry_date || "in 7 days"}). Record the candidate's acceptance or decline.
              </p>
            )}

            {/* Step 7 guidance: Done */}
            {offer && offer.status === "accepted" && (
              <p className="text-xs text-emerald-800 font-bold flex items-center gap-1.5">
                <i className="ri-checkbox-circle-fill text-emerald-600" />
                Candidate accepted the employment offer! Target joining date confirmed: {offer.target_start_date || "Confirmed"}.
              </p>
            )}

            {offer && offer.status === "rejected" && (
              <p className="text-xs text-rose-800 font-bold flex items-center gap-1.5">
                <i className="ri-close-circle-fill text-rose-600" />
                Candidate declined the offer (Reason: {offer.rejection_reason || "Not specified"}).
              </p>
            )}
          </div>

          {/* Action Buttons for current state */}
          <div className="flex items-center gap-2 shrink-0">
            {!offer && (
              <button
                type="button"
                onClick={onOpenCreateProposal}
                className="px-5 py-2.5 bg-[#253C7D] hover:bg-[#1E3064] text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-2"
              >
                <i className="ri-add-line text-sm" />
                Create Salary Proposal
              </button>
            )}

            {offer && (offer.status === "salary_proposal" || offer.status === "salary_approved") && (
              <button
                type="button"
                onClick={() => onOpenWorkflowModal(offer, "generate_draft")}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold shadow-sm transition-colors cursor-pointer flex items-center gap-2 animate-pulse"
                title="Generate offer letter draft directly from candidate and requisition data — zero retyping"
              >
                <i className="ri-file-text-line text-sm" />
                Generate Offer Letter
              </button>
            )}

            {offer && (offer.status === "draft_letter" || offer.status === "hr_review") && (
              <button
                type="button"
                onClick={() => onOpenWorkflowModal(offer, "hr_review")}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-2"
              >
                <i className="ri-shield-check-line text-sm" />
                HR Manager Review Offer Letter
              </button>
            )}

            {offer && offer.status === "management_approval" && (
              <button
                type="button"
                onClick={() => onOpenWorkflowModal(offer, "management_approval")}
                className="px-5 py-2.5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-2"
              >
                <i className="ri-award-line text-sm" />
                Authorize & Approve
              </button>
            )}

            {offer && offer.status === "approved" && (
              <button
                type="button"
                onClick={() => onOpenWorkflowModal(offer, "issue_offer")}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-2"
              >
                <i className="ri-mail-send-line text-sm" />
                Issue Official Offer Letter
              </button>
            )}

            {offer && offer.status === "issued" && (
              <div className="flex items-center gap-2">
                {onExportWord && (
                  <button
                    type="button"
                    onClick={() => onExportWord(offer)}
                    className="px-3.5 py-2 bg-white hover:bg-gray-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5"
                    title="Export official Offer Letter as Word document"
                  >
                    <i className="ri-file-word-line text-sky-700 text-sm" />
                    Word (.docx)
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onExportPdf(offer)}
                  className="px-3.5 py-2 bg-white hover:bg-gray-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <i className="ri-file-pdf-line text-red-600 text-sm" />
                  View PDF
                </button>
                <button
                  type="button"
                  onClick={() => onOpenWorkflowModal(offer, "decision")}
                  className="px-5 py-2.5 bg-sky-700 hover:bg-sky-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer flex items-center gap-2"
                >
                  <i className="ri-question-answer-line text-sm" />
                  Record Candidate Response
                </button>
              </div>
            )}

            {offer && ["accepted", "rejected"].includes(offer.status) && (
              <div className="flex items-center gap-2">
                {onExportWord && (
                  <button
                    type="button"
                    onClick={() => onExportWord(offer)}
                    className="px-4 py-2 bg-white hover:bg-gray-50 text-slate-800 border border-slate-200 rounded-xl text-xs font-bold shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <i className="ri-file-word-line text-sky-700 text-sm" />
                    Download Offer Letter Word
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onExportPdf(offer)}
                  className="px-4 py-2 bg-white hover:bg-gray-50 text-slate-800 border border-slate-200 rounded-xl text-xs font-bold shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <i className="ri-file-pdf-line text-red-600 text-sm" />
                  Download Offer Letter PDF
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});
