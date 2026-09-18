import type { RecruitmentActionRole } from "../types";

export const ROLE_INFO: Record<
  RecruitmentActionRole,
  { label: string; icon: string; description: string; scopeBadge: string }
> = {
  hiring_manager: {
    label: "Hiring Manager",
    icon: "ri-user-star-line",
    description: "Initial screening of department applicants, conducting technical/manager interviews, and department requisition follow-ups.",
    scopeBadge: "Department / Vacancy Scope",
  },
  manager: {
    label: "Manager",
    icon: "ri-briefcase-line",
    description: "Reviews CVs for departmental vacancies, provides panel interview feedback, and signs off Stage 1 headcount requisitions.",
    scopeBadge: "Departmental Unit Scope",
  },
  hr_manager: {
    label: "HR Manager",
    icon: "ri-team-line",
    description: "Enterprise candidate screening across HR Division, HR interview rounds, and Stage 2 Requisition compliance reviews.",
    scopeBadge: "HR Operations Scope",
  },
  hr_director: {
    label: "HR Director",
    icon: "ri-shield-star-line",
    description: "Senior candidate evaluations, salary negotiations sign-off, and Stage 3 HR administrative requisition authorizations.",
    scopeBadge: "HR Executive Scope",
  },
  ceo_director: {
    label: "CEO / Division Director",
    icon: "ri-government-line",
    description: "Final interview evaluations, executive division headcount decisions, and senior talent acquisitions.",
    scopeBadge: "Division Executive Scope",
  },
  chairwoman: {
    label: "Chairwoman",
    icon: "ri-vip-crown-line",
    description: "Final Stage 4 Executive Authorization to activate job openings and key strategic leadership talent approvals.",
    scopeBadge: "Supreme Governance Scope",
  },
};

export function detectRecruitmentRole(
  actorRole: string,
  myEmployeeRole?: string | null
): RecruitmentActionRole {
  const combined = `${actorRole || ""} ${myEmployeeRole || ""}`.toLowerCase();
  if (/chair|board/i.test(combined)) return "chairwoman";
  if (/ceo|president|division\s*director/i.test(combined)) return "ceo_director";
  if (/hr\s*director|head\s*of\s*hr/i.test(combined)) return "hr_director";
  if (/hr\s*manager|recruiter|talent|hr\s*specialist|hr\s*officer/i.test(combined)) return "hr_manager";
  if (/hiring\s*manager/i.test(combined)) return "hiring_manager";
  if (/manager|supervisor|lead|head/i.test(combined)) return "manager";
  return "hr_manager";
}
