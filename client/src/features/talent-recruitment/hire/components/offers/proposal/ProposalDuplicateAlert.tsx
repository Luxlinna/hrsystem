import { memo } from "react";
import type { Candidate, OfferLetter } from "../../../types";

interface ProposalDuplicateAlertProps {
  activeCandidate: Candidate | null;
  candidateExistingOffer: OfferLetter | null;
}

export const ProposalDuplicateAlert = memo(function ProposalDuplicateAlert({
  activeCandidate,
  candidateExistingOffer,
}: ProposalDuplicateAlertProps) {
  if (!candidateExistingOffer) return null;

  return (
    <div className="p-3.5 rounded-xl border border-amber-300 bg-amber-50 text-amber-950 text-xs flex items-start gap-2.5 shadow-2xs">
      <i className="ri-error-warning-fill text-amber-600 text-base shrink-0 mt-0.5" />
      <div>
        <p className="font-extrabold text-amber-900">
          Candidate Already Has an Active Salary Proposal / Offer
        </p>
        <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
          <strong>{activeCandidate?.full_name}</strong> already has an active proposal on record (
          <strong>Offer #{candidateExistingOffer.offer_number}</strong> &middot; Status:{" "}
          <strong>{candidateExistingOffer.status.replace(/_/g, " ").toUpperCase()}</strong>).
          Candidates at the proposal stage cannot be added again. Please review or advance the existing offer record instead.
        </p>
      </div>
    </div>
  );
});
