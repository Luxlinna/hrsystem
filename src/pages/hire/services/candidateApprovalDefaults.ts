import type { Candidate, Interview, CandidateApproval, CandidateApprovalPanel } from "../types";
import {
  parseInterviewPanelFromNotes,
  formatInterviewEndTime,
  extractFeedbackFromInterviews,
} from "../utils/interviewPanelHelper";

export function generateApprovalFormNumber(): string {
  const year = new Date().getFullYear();
  const rand = String(Math.floor(1 + Math.random() * 999)).padStart(3, "0");
  return `CAF-${year}-${rand}`;
}

export function initCandidateApproval(
  candidate: Candidate,
  interviews: Interview[] = [],
  actorName = "HR Operations",
  resolvedSignatories?: {
    ceo?: string;
    hr_manager?: string;
    division_director?: string;
    chairwoman?: string;
  },
  reqDetails?: {
    businessUnit?: string;
    department?: string;
    hiringManager?: string;
    currentSalary?: string;
    expectationSalary?: string;
    noticePeriod?: string;
    positionApplied?: string;
    branchId?: string | null;
  }
): CandidateApproval {
  const now = new Date().toISOString();
  const job = candidate.job_postings;

  const feedbackSynthesis = extractFeedbackFromInterviews(interviews);

  const panels: CandidateApprovalPanel[] =
    interviews.length > 0
      ? interviews.flatMap((iv) => {
          const isCompleted = iv.status === "completed" || Boolean(iv.feedback || iv.score);
          const endTimeFormatted = formatInterviewEndTime(iv.scheduled_at, iv.duration_minutes || 60);
          const signatureStatus = isCompleted ? "Signed" : "Verified";

          const { panelMembers } = parseInterviewPanelFromNotes(iv.notes);

          if (panelMembers.length > 0) {
            return panelMembers.map((m) => ({
              name: m.name,
              date_time: endTimeFormatted,
              position: m.role || "Interviewer",
              signature: signatureStatus,
            }));
          }

          const empName = iv.employees
            ? `${iv.employees.first_name} ${iv.employees.last_name}`.trim()
            : actorName;

          const pos =
            iv.employees?.role ||
            iv.employees?.department ||
            (iv.type === "hr" || (iv.notes || "").toLowerCase().includes("hr")
              ? "HR Recruiter"
              : iv.type === "technical"
              ? "Technical Lead"
              : "Hiring Manager");

          return [
            {
              name: empName,
              date_time: endTimeFormatted,
              position: pos,
              signature: signatureStatus,
            },
          ];
        })
      : reqDetails?.hiringManager
      ? [
          {
            name: reqDetails.hiringManager,
            date_time:
              new Date().toLocaleDateString("en-US", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              }) + " 3:00PM",
            position: "Hiring Manager",
            signature: "Signed",
          },
        ]
      : [];

  const expectationSalaryStr = candidate.expected_salary
    ? `$${candidate.expected_salary.toLocaleString()}`
    : "$1,500";

  return {
    id: `caf_${candidate.id}`,
    candidate_id: candidate.id,
    form_number: generateApprovalFormNumber(),
    branch_id: reqDetails?.branchId || job?.branch_id || null,
    status: "draft",

    // Section I: Candidate & Role Overview
    candidate_name: candidate.full_name,
    gender: "Female",
    position_applied: reqDetails?.positionApplied || job?.title || "Candidate Position",
    business_unit: reqDetails?.businessUnit || job?.branches?.name || "Unique Noble Investment Co. Ltd.",
    department: reqDetails?.department || job?.department || "HR & Operations",
    hiring_manager: reqDetails?.hiringManager || (candidate.assigned_recruiter
      ? `${candidate.assigned_recruiter.first_name} ${candidate.assigned_recruiter.last_name}`
      : "Hiring Manager"),
    current_salary: reqDetails?.currentSalary || "$1,200",
    expectation_salary: reqDetails?.expectationSalary || expectationSalaryStr,
    current_benefit: "Standard Health & Annual Bonus",
    notice_period: reqDetails?.noticePeriod || candidate.notice_period || "1 Month",

    // Section II: Candidate Evaluation Summary
    education_and_skill:
      candidate.education ||
      (candidate.skills && candidate.skills.length > 0
        ? `Skills: ${candidate.skills.join(", ")}`
        : "Bachelor's Degree in relevant discipline with professional certifications."),
    work_experience:
      candidate.work_experience ||
      "Solid 3+ years demonstrated experience with a consistent track record of execution in similar responsibilities.",
    strengths:
      feedbackSynthesis.strengths ||
      "High accountability, rapid learner, strong communication clarity, proactive collaboration, and great alignment with company core values.",
    improvement:
      feedbackSynthesis.improvement ||
      "Can further expand depth in company-specific proprietary tools and enterprise workflow methodologies.",
    overall_assessment:
      feedbackSynthesis.overallAssessment ||
      "Candidate performed exceptionally well across all interview stages. Cultural fit, technical capabilities, and leadership potential are strongly endorsed by all evaluators.",
    interview_panels: panels,

    // Section III: 4 Signatories dynamically mapped to actual role holders
    signatories: {
      ceo: {
        role_key: "ceo",
        title: "CEO (Business Unit)",
        default_name: "CEO (Business Unit)",
        assigned_name: resolvedSignatories?.ceo || "James HI",
        status: "pending",
        comment: "",
        checked_by: "",
        signed_at: null,
      },
      hr_manager: {
        role_key: "hr_manager",
        title: "HR Manager (HR Division)",
        default_name: "HR Manager",
        assigned_name: resolvedSignatories?.hr_manager || "Sokkhoeurn Leng",
        status: "pending",
        comment: "",
        checked_by: "",
        signed_at: null,
      },
      division_director: {
        role_key: "division_director",
        title: "HR Admin Director",
        default_name: "HR Admin Director",
        assigned_name: resolvedSignatories?.division_director || "Phat Seign",
        status: "pending",
        comment: "",
        checked_by: "",
        signed_at: null,
      },
      chairwoman: {
        role_key: "chairwoman",
        title: "Chairwoman",
        default_name: "Chairwoman",
        assigned_name: resolvedSignatories?.chairwoman || "Mrs. Pin Phiroum",
        status: "pending",
        comment: "",
        checked_by: "",
        signed_at: null,
      },
    },

    created_at: now,
    updated_at: now,
    completed_at: null,
  };
}
