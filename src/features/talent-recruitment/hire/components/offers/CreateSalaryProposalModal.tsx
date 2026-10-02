import type { Candidate, HiringRequest, OfferAllowanceItem, OfferLetter } from "../../types";
import { useSalaryProposalState } from "./proposal/useSalaryProposalState";
import { ProposalDuplicateAlert } from "./proposal/ProposalDuplicateAlert";
import { ProposalCandidateSection } from "./proposal/ProposalCandidateSection";
import { ProposalCompensationSection } from "./proposal/ProposalCompensationSection";
import { ProposalAllowancesSection } from "./proposal/ProposalAllowancesSection";
import { ProposalNotesSection } from "./proposal/ProposalNotesSection";

export interface CreateSalaryProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidate?: Candidate | null;
  candidates: Candidate[];
  hiringRequests: HiringRequest[];
  existingOffers?: OfferLetter[];
  onSubmit: (payload: {
    candidate: Candidate;
    requisition?: HiringRequest | null;
    base_salary: number;
    probation_salary?: number | null;
    probation_months: number;
    target_start_date: string;
    allowances: OfferAllowanceItem[];
    benefits_summary: string;
    special_terms?: string;
    proposal_notes?: string;
  }) => Promise<any>;
}

export function CreateSalaryProposalModal(props: CreateSalaryProposalModalProps) {
  const { isOpen, onClose, candidate, candidates, hiringRequests } = props;
  const state = useSalaryProposalState(props);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-[#172B4D] to-[#253C7D] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-xl">
              <i className="ri-money-dollar-circle-line" />
            </div>
            <div>
              <h2 className="text-base font-extrabold tracking-tight">Create Salary Proposal</h2>
              <p className="text-xs text-blue-100/80">Step 1 of Offer Lifecycle &middot; Auto-bound with zero retyping</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
          >
            <i className="ri-close-line text-lg" />
          </button>
        </div>

        <form onSubmit={state.handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Duplicate Proposal Guard Alert */}
          <ProposalDuplicateAlert
            activeCandidate={state.activeCandidate}
            candidateExistingOffer={state.candidateExistingOffer}
          />

          {/* Candidate & Position Auto-Populated Card */}
          <ProposalCandidateSection
            candidate={candidate}
            activeCandidate={state.activeCandidate}
            eligibleCandidates={state.eligibleCandidates}
            selectedCandidateId={state.selectedCandidateId}
            setSelectedCandidateId={state.setSelectedCandidateId}
            matchedReq={state.matchedReq}
            hiringRequests={hiringRequests}
            selectedReqId={state.selectedReqId}
            setSelectedReqId={state.setSelectedReqId}
          />

          {/* Core Compensation Package */}
          <ProposalCompensationSection
            baseSalary={state.baseSalary}
            setBaseSalary={state.setBaseSalary}
            isBasedOnQualification={state.isBasedOnQualification}
            setIsBasedOnQualification={state.setIsBasedOnQualification}
            probationSalary={state.probationSalary}
            setProbationSalary={state.setProbationSalary}
            probationMonths={state.probationMonths}
            setProbationMonths={state.setProbationMonths}
            targetStartDate={state.targetStartDate}
            setTargetStartDate={state.setTargetStartDate}
          />

          {/* Guaranteed Monthly Allowances */}
          <ProposalAllowancesSection
            allowances={state.allowances}
            handleAddAllowance={state.handleAddAllowance}
            handleRemoveAllowance={state.handleRemoveAllowance}
            handleUpdateAllowance={state.handleUpdateAllowance}
            isBasedOnQualification={state.isBasedOnQualification}
            totalPackage={state.totalPackage}
          />

          {/* Benefits Summary, Notes & Next Step Notice */}
          <ProposalNotesSection
            benefitsSummary={state.benefitsSummary}
            setBenefitsSummary={state.setBenefitsSummary}
            proposalNotes={state.proposalNotes}
            setProposalNotes={state.setProposalNotes}
          />

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                state.submitting ||
                Boolean(state.candidateExistingOffer) ||
                !state.activeCandidate ||
                (state.eligibleCandidates.length === 0 && !candidate)
              }
              className="px-5 py-2.5 text-xs font-extrabold text-white bg-[#253C7D] hover:bg-[#1e3066] rounded-xl shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {state.submitting ? <i className="ri-loader-4-line animate-spin" /> : <i className="ri-send-plane-2-line" />}
              Send Form to HR Division for Review
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
