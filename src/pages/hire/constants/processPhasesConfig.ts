import type { StageConfigItem } from "../types";
import { STAGE_CONFIG, STAGE_TIMELINE_ORDER } from "../constants";

export interface RecruitmentPhase {
  id: string;
  name: string;
  subtitle: string;
  icon: string;
  stages: string[];
}

export const RECRUITMENT_PHASES: RecruitmentPhase[] = [
  {
    id: "sourcing",
    name: "Sourcing & Screening",
    subtitle: "CV Intake & Qualification",
    icon: "ri-user-search-line",
    stages: ["cv_received", "screening", "shortlisted"],
  },
  {
    id: "interviews",
    name: "Interview & Evaluation",
    subtitle: "Panel Reviews & Selection",
    icon: "ri-team-line",
    stages: ["hr_interview", "hiring_manager_interview", "final_interview", "selected"],
  },
  {
    id: "approval_offer",
    name: "Approval & Offer",
    subtitle: "CAF & Compensation Package",
    icon: "ri-file-shield-line",
    stages: ["candidate_approval", "salary_negotiation", "offer"],
  },
  {
    id: "onboarding_contract",
    name: "Contract & Onboarding",
    subtitle: "Documents & Formal Placement",
    icon: "ri-verified-badge-line",
    stages: ["accepted", "documents", "contract", "hired"],
  },
];

export interface StageGuidance {
  description: string;
  nextPrompt: string;
  actionType?: "schedule_interview" | "open_caf" | "create_proposal" | "upload_docs" | "generate_contract" | "generic";
}

export const STAGE_GUIDANCE_MAP: Record<string, StageGuidance> = {
  cv_received: {
    description: "Applicant profile and resume registered in recruitment system.",
    nextPrompt: "Review CV qualifications and advance to Initial Screening.",
    actionType: "generic",
  },
  screening: {
    description: "Recruiter actively screening background, skills, and base salary expectations.",
    nextPrompt: "Screening complete: Shortlist candidate for formal panel interviews.",
    actionType: "generic",
  },
  shortlisted: {
    description: "Candidate approved by recruitment team for interviews.",
    nextPrompt: "Schedule HR Initial Screening Interview.",
    actionType: "schedule_interview",
  },
  hr_interview: {
    description: "HR culture-fit, motivation, and fundamental competency evaluation.",
    nextPrompt: "Complete HR evaluation and advance to Hiring Manager Interview.",
    actionType: "schedule_interview",
  },
  hiring_manager_interview: {
    description: "In-depth technical and functional assessment with hiring manager.",
    nextPrompt: "Submit technical assessment score and advance to Final Interview.",
    actionType: "schedule_interview",
  },
  final_interview: {
    description: "Executive or departmental leadership interview.",
    nextPrompt: "Final score submitted: Advance candidate to Selected stage.",
    actionType: "schedule_interview",
  },
  selected: {
    description: "Candidate successfully passed all interviews and chosen for hiring.",
    nextPrompt: "Initiate Candidate Approval Form (CAF) for executive sign-off.",
    actionType: "open_caf",
  },
  candidate_approval: {
    description: "Internal approvals (BU CEO, HR Director, Chairwoman) in progress.",
    nextPrompt: "Once CAF is approved, proceed to Salary Negotiation.",
    actionType: "open_caf",
  },
  salary_negotiation: {
    description: "Aligning compensation, benefits package, and start date.",
    nextPrompt: "Draft Salary Proposal and generate official Offer Letter.",
    actionType: "create_proposal",
  },
  offer: {
    description: "Official Offer Letter issued and awaiting candidate decision.",
    nextPrompt: "Await signed acceptance from candidate.",
    actionType: "generic",
  },
  accepted: {
    description: "Candidate accepted the offer! Pre-boarding portal unlocked.",
    nextPrompt: "Collect and verify all required employee pre-boarding documents.",
    actionType: "upload_docs",
  },
  documents: {
    description: "Verifying candidate identification, diplomas, and medical records.",
    nextPrompt: "All documents verified: Generate official Employment Contract.",
    actionType: "generate_contract",
  },
  contract: {
    description: "7-stage contract governance, review, dual signatures, and AWS S3 archive.",
    nextPrompt: "Finalize signed contract and transition candidate to Hired status.",
    actionType: "generate_contract",
  },
  hired: {
    description: "Candidate officially hired! Record synced to Employee Directory & Onboarding.",
    nextPrompt: "Placement complete. Candidate is active in Onboarding.",
    actionType: "generic",
  },
  rejected: {
    description: "Application discontinued or candidate declined offer.",
    nextPrompt: "Candidate marked as rejected.",
    actionType: "generic",
  },
};

export function getPhaseForStage(stage: string): RecruitmentPhase | undefined {
  const norm = stage === "applied" ? "cv_received" : stage === "interview" ? "hr_interview" : stage;
  return RECRUITMENT_PHASES.find((p) => p.stages.includes(norm));
}

export function getPhaseIndex(phaseId: string): number {
  return RECRUITMENT_PHASES.findIndex((p) => p.id === phaseId);
}
