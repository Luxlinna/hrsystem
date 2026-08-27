import type { StageConfigItem, NewJobFormState, NewCandidateFormState, NewInterviewFormState } from "./types";

export const STAGE_CONFIG: Record<string, StageConfigItem> = {
  applied: {
    label: "Applied",
    bg: "bg-slate-100",
    text: "text-slate-700",
    border: "border-slate-200",
    icon: "ri-file-user-line",
    hex: "#64748B",
  },
  screening: {
    label: "Screening",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    icon: "ri-search-eye-line",
    hex: "#F59E0B",
  },
  interview: {
    label: "Interview",
    bg: "bg-sky-50",
    text: "text-sky-700",
    border: "border-sky-200",
    icon: "ri-video-chat-line",
    hex: "#0284C7",
  },
  offer: {
    label: "Offer",
    bg: "bg-indigo-50",
    text: "text-indigo-700",
    border: "border-indigo-200",
    icon: "ri-mail-send-line",
    hex: "#6366F1",
  },
  hired: {
    label: "Hired",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    icon: "ri-checkbox-circle-fill",
    hex: "#10B981",
  },
  rejected: {
    label: "Rejected",
    bg: "bg-rose-50",
    text: "text-rose-700",
    border: "border-rose-200",
    icon: "ri-close-circle-line",
    hex: "#F43F5E",
  },
};

export const PIPELINE_STAGES = ["applied", "screening", "interview", "offer", "hired", "rejected"];
export const STAGE_TIMELINE_ORDER = ["applied", "screening", "interview", "offer", "hired"];

export const INITIAL_JOB_FORM: NewJobFormState = {
  title: "",
  department: "",
  branch_id: "",
  description: "",
  location: "On-site",
  salary_min: "",
  salary_max: "",
  type: "full-time",
  closing_date: "",
};

export const INITIAL_CANDIDATE_FORM: NewCandidateFormState = {
  full_name: "",
  email: "",
  phone: "",
  job_posting_id: "",
  source: "LinkedIn",
  notes: "",
};

export const INITIAL_INTERVIEW_FORM: NewInterviewFormState = {
  candidate_id: "",
  scheduled_at: "",
  duration_minutes: "60",
  type: "video",
  notes: "",
};
