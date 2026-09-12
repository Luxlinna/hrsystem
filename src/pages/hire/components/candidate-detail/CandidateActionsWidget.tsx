import { memo } from "react";
import { Link } from "react-router-dom";
import type { OfferLetter } from "../../types";
import type { WorkflowModalType } from "../../hooks/useOfferLetters";

interface CandidateActionsWidgetProps {
  currentStage?: string;
  onUpdateStage: (stage: string) => void;
  onDelete: () => void;
  onOpenCandidateApproval?: () => void;
  onOpenSalaryProposal?: () => void;
  activeOffer?: OfferLetter | null;
  onOpenOfferWorkflow?: (type: WorkflowModalType) => void;
  onExportPdf?: (offer: OfferLetter) => void;
}

export const CandidateActionsWidget = memo(function CandidateActionsWidget({
  currentStage,
  onUpdateStage,
  onDelete,
  onOpenCandidateApproval,
  onOpenSalaryProposal,
  activeOffer,
  onOpenOfferWorkflow,
  onExportPdf,
}: CandidateActionsWidgetProps) {
  const isHired = currentStage === "hired";
  const isRejected = currentStage === "rejected";

  return (
    <div className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-2xs space-y-3">
      <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider block mb-2">
        APPLICATION ACTIONS
      </span>

      {/* When already hired, show the green onboarding status & shortcut */}
      {isHired && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-1.5">
          <div className="flex items-center justify-center gap-1.5 text-emerald-800 font-black text-xs">
            <i className="ri-checkbox-circle-fill text-emerald-600 text-base" /> Candidate Hired
          </div>
          <Link
            to="/onboarding"
            className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition-colors block"
          >
            <i className="ri-user-received-2-line" /> View in Onboarding
          </Link>
        </div>
      )}

      {/* Candidate Approval Form action button */}
      {["selected", "candidate_approval"].includes(currentStage || "") && onOpenCandidateApproval && (
        <button
          type="button"
          onClick={onOpenCandidateApproval}
          className="w-full py-2.5 bg-[#253C7D]/10 hover:bg-[#253C7D]/15 text-[#253C7D] border border-[#253C7D]/20 rounded-xl font-extrabold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <i className="ri-file-check-line text-sm text-[#253C7D]" />
          Candidate Approval Form
        </button>
      )}

      {/* Offer Progression Direct Action Buttons */}
      {!activeOffer && currentStage === "salary_negotiation" && onOpenSalaryProposal && (
        <button
          type="button"
          onClick={onOpenSalaryProposal}
          className="w-full py-2.5 bg-violet-50 hover:bg-violet-100 text-violet-800 border border-violet-200 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <i className="ri-mail-send-line text-sm text-violet-600" />
          Create Salary Proposal
        </button>
      )}

      {activeOffer && (
        <div className="space-y-2 pt-1 border-t border-gray-100">
          <div className="flex items-center justify-between text-[10px] text-gray-500 font-bold uppercase">
            <span>Offer Lifecycle</span>
            <span className="font-mono text-[#253C7D]">{activeOffer.offer_number}</span>
          </div>

          {/* Step 2: Generate Offer Letter (Auto-compiled, no retyping) */}
          {(activeOffer.status === "salary_proposal" || activeOffer.status === "salary_approved") && onOpenOfferWorkflow && (
            <button
              type="button"
              onClick={() => onOpenOfferWorkflow("generate_draft")}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
              title="Generate offer letter directly from candidate and requisition data — no retyping"
            >
              <i className="ri-file-text-line text-sm" />
              Generate Offer Letter
            </button>
          )}

          {/* Step 3: HR Review */}
          {(activeOffer.status === "draft_letter" || activeOffer.status === "hr_review") && onOpenOfferWorkflow && (
            <button
              type="button"
              onClick={() => onOpenOfferWorkflow("hr_review")}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            >
              <i className="ri-shield-check-line text-sm" />
              Endorse HR Review
            </button>
          )}

          {/* Step 4: Executive Approval */}
          {activeOffer.status === "management_approval" && onOpenOfferWorkflow && (
            <button
              type="button"
              onClick={() => onOpenOfferWorkflow("management_approval")}
              className="w-full py-2.5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            >
              <i className="ri-award-line text-sm" />
              Management Sign-Off
            </button>
          )}

          {/* Step 5: Issue Offer */}
          {activeOffer.status === "approved" && onOpenOfferWorkflow && (
            <button
              type="button"
              onClick={() => onOpenOfferWorkflow("issue_offer")}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            >
              <i className="ri-mail-send-line text-sm" />
              Issue Official Offer
            </button>
          )}

          {/* Step 6: Candidate Decision */}
          {activeOffer.status === "issued" && onOpenOfferWorkflow && (
            <button
              type="button"
              onClick={() => onOpenOfferWorkflow("decision")}
              className="w-full py-2.5 bg-sky-700 hover:bg-sky-800 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            >
              <i className="ri-question-answer-line text-sm" />
              Record Candidate Decision
            </button>
          )}

          {/* View / Download PDF if offer letter exists */}
          {["approved", "issued", "accepted", "rejected"].includes(activeOffer.status) && onExportPdf && (
            <button
              type="button"
              onClick={() => onExportPdf(activeOffer)}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <i className="ri-file-pdf-line text-sm text-red-600" />
              Download Offer PDF
            </button>
          )}
        </div>
      )}

      {/* Show "Mark as Hired" only if not yet hired */}
      {!isHired && (
        <button
          type="button"
          onClick={() => onUpdateStage("hired")}
          className="w-full py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <i className="ri-check-line text-sm" /> Mark as Hired
        </button>
      )}

      {/* Always keep "Reject Applicant" button (or Reopen if currently rejected) */}
      {isRejected ? (
        <button
          type="button"
          onClick={() => onUpdateStage("screening")}
          className="w-full py-2.5 bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <i className="ri-restart-line text-sm" /> Reopen Application
        </button>
      ) : (
        <button
          type="button"
          onClick={() => onUpdateStage("rejected")}
          className="w-full py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <i className="ri-close-circle-line text-sm" /> Reject Applicant
        </button>
      )}

      {/* Always keep "Move to Recycle Bin" (Delete) */}
      <button
        type="button"
        onClick={onDelete}
        className="w-full pt-2 text-center text-xs text-gray-400 hover:text-rose-600 font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
      >
        <i className="ri-delete-bin-line text-xs" /> Move to Recycle Bin
      </button>
    </div>
  );
});
