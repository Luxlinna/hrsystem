import type { Candidate, Interview, CandidateApproval, CandidateApprovalPanel } from "../types";

export function generateApprovalFormNumber(): string {
  const year = new Date().getFullYear();
  const rand = String(Math.floor(1 + Math.random() * 999)).padStart(3, "0");
  return `CAF-${year}-${rand}`;
}

export function initCandidateApproval(
  candidate: Candidate,
  interviews: Interview[] = [],
  actorName = "HR Operations"
): CandidateApproval {
  const now = new Date().toISOString();
  const job = candidate.job_postings;

  const panels: CandidateApprovalPanel[] =
    interviews.length > 0
      ? interviews.map((iv) => {
          const empName = iv.employees
            ? `${iv.employees.first_name} ${iv.employees.last_name}`
            : actorName;
          const dt = iv.scheduled_at
            ? new Date(iv.scheduled_at).toLocaleString("en-US", {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })
            : "Completed";
          const pos =
            iv.type === "hr" || (iv.notes || "").toLowerCase().includes("hr")
              ? "HR Recruiter"
              : iv.type === "technical"
              ? "Technical Lead"
              : "Executive Interviewer";
          return {
            name: empName,
            date_time: dt,
            position: pos,
            signature: "Verified",
          };
        })
      : [
          {
            name: "Ms. Meas Chhengseang",
            date_time:
              new Date().toLocaleDateString("en-US", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              }) + " 3:00PM",
            position: "CEO",
            signature: "Signed",
          },
          {
            name: "Mr. Sun Reasey",
            date_time:
              new Date().toLocaleDateString("en-US", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              }) + " 3:00PM",
            position: "HR Recruiter",
            signature: "Signed",
          },
        ];

  const expectationSalaryStr = candidate.expected_salary
    ? `$${candidate.expected_salary.toLocaleString()}`
    : "$1,500";

  return {
    id: `caf-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    candidate_id: candidate.id,
    form_number: generateApprovalFormNumber(),
    branch_id: job?.branch_id || null,
    status: "draft",

    // Section I: Candidate & Role Overview
    candidate_name: candidate.full_name,
    gender: "Female",
    position_applied: job?.title || "Candidate Position",
    business_unit: job?.branches?.name || "Unique Noble Investment Co. Ltd.",
    department: job?.department || "HR & Operations",
    hiring_manager: candidate.assigned_recruiter
      ? `${candidate.assigned_recruiter.first_name} ${candidate.assigned_recruiter.last_name}`
      : "Hiring Manager",
    current_salary: "$1,200",
    expectation_salary: expectationSalaryStr,
    current_benefit: "Standard Health & Annual Bonus",
    notice_period: candidate.notice_period || "1 Month",

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
      "High accountability, rapid learner, strong communication clarity, proactive collaboration, and great alignment with company core values.",
    improvement:
      "Can further expand depth in company-specific proprietary tools and enterprise workflow methodologies.",
    overall_assessment:
      "Candidate performed exceptionally well across all interview stages. Cultural fit, technical capabilities, and leadership potential are strongly endorsed by all evaluators.",
    interview_panels: panels,

    // Section III: 4 Signatories matching template
    signatories: {
      ceo: {
        role_key: "ceo",
        title: "CEO / Division Director",
        default_name: "CEO / Division Director",
        assigned_name: "Ms. Meas Chhengseang",
        status: "pending",
        comment: "",
        checked_by: "",
        signed_at: null,
      },
      hr_manager: {
        role_key: "hr_manager",
        title: "HR and Admin Manager",
        default_name: "Ms. Chea TiengChanvathna",
        assigned_name: "Ms. Chea TiengChanvathna",
        status: "pending",
        comment: "",
        checked_by: "",
        signed_at: null,
      },
      division_director: {
        role_key: "division_director",
        title: "HR&Admin Division Director",
        default_name: "Mr. Chey Tola",
        assigned_name: "Mr. Chey Tola",
        status: "pending",
        comment: "",
        checked_by: "",
        signed_at: null,
      },
      chairwoman: {
        role_key: "chairwoman",
        title: "Chairwoman",
        default_name: "Mrs. Pin Phiroum",
        assigned_name: "Mrs. Pin Phiroum",
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
