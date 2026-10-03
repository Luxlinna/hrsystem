import type { Candidate } from "../types";

export type InterviewResultRecommendation =
  | "recommend_to_hire"
  | "hold"
  | "do_not_recommend"
  | "available_another"
  | "strong_hire"
  | "advance"
  | "reject";

export interface InterviewerSlot {
  name: string;
  position: string;
  date: string;
  signature?: string | null;
}

export interface InterviewEvaluationExportData {
  candidate: Candidate;
  stageKey?: string;
  stageTitle?: string;
  stageSubtitle?: string;
  stageBadge?: string;
  responsibleRole?: string;
  evaluatorName?: string;
  date?: string;
  overallScore?: number;
  recommendation?: InterviewResultRecommendation;
  competencies?: Record<string, number>;
  strengths?: string;
  concerns?: string;
  notes?: string;
  panelMembers?: Array<{ name: string; role?: string }>;
  interviewType?: string;
  interviewDuration?: number | string;

  // Exact UNI "INTERVIEW RESULTS" fields
  offerDepartment?: string;
  director?: string;
  officerPosition?: string;
  probationSalary?: string;
  afterProbationSalary?: string;
  onBoardDate?: string;
  firstInterviewers?: InterviewerSlot[];
  secondInterviewers?: InterviewerSlot[];
  approvedBy?: {
    employerTitle?: string;
    name?: string;
    role?: string;
    company?: string;
    date?: string;
  };
}
