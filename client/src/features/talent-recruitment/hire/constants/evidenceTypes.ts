import type { Candidate, Interview, CandidateDocument } from "../types";

export interface StageEvidenceRule {
  order: number;
  stageKey: string;
  stageName: string;
  responsibleRole: string;
  requiredEvidence: string[];
  formOfEvidence: string;
  allowsUpload: boolean;
  uploadCategoryLabel?: string;
  checkEvidence: (
    candidate: Candidate,
    interviews: Interview[]
  ) => {
    isVerified: boolean;
    summary: string;
    attachedDocs: CandidateDocument[];
    linkedInterview?: Interview | null;
    scheduled?: boolean;
    evaluated?: boolean;
  };
}
