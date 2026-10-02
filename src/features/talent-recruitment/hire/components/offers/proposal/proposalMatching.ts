import type { Candidate, HiringRequest, OfferLetter } from "../../../types";

export function getEligibleCandidates(
  candidate: Candidate | null | undefined,
  candidates: Candidate[],
  existingOffers: OfferLetter[]
): Candidate[] {
  if (candidate) return [candidate];
  return candidates.filter((c) => {
    if (existingOffers.some((o) => o.candidate_id === c.id && o.status !== "rejected")) {
      return false;
    }
    if (["offer", "accepted", "rejected"].includes(c.stage)) {
      return false;
    }
    return true;
  });
}

export function getActiveCandidate(
  candidate: Candidate | null | undefined,
  candidates: Candidate[],
  selectedCandidateId: string,
  eligibleCandidates: Candidate[]
): Candidate | null {
  if (candidate) return candidate;
  return candidates.find((c) => c.id === selectedCandidateId) || eligibleCandidates[0] || null;
}

export function getMatchingRequisition(
  activeCandidate: Candidate | null,
  hiringRequests: HiringRequest[],
  selectedReqId: string
): HiringRequest | null {
  if (selectedReqId) {
    return hiringRequests.find((r) => r.id === selectedReqId) || null;
  }
  if (!activeCandidate) return null;
  return (
    hiringRequests.find(
      (r) =>
        (activeCandidate.job_posting_id && r.job_posting_id === activeCandidate.job_posting_id) ||
        r.title.toLowerCase() === (activeCandidate.job_postings?.title || "").toLowerCase()
    ) || null
  );
}
