import type { OfferLetter } from "../../../types";
import type { WorkflowModalType } from "../../../hooks/useOfferLetters";

export interface StepMeta {
  title: string;
  subtitle: string;
  icon: string;
  actionBtn: string;
  color: string;
}

export function getWorkflowStepMeta(
  modalType: WorkflowModalType,
  offer: OfferLetter,
  decision: "accepted" | "rejected"
): StepMeta {
  const titles: Record<string, StepMeta> = {
    bu_ceo_approval: {
      title: "BU CEO / Division Director Approval",
      subtitle: `Stage 1: Sign-off by CEO of ${offer.business_unit || "Business Unit"}`,
      icon: "ri-user-star-line",
      actionBtn: "Approve as BU CEO & Forward to HR Division",
      color: "from-blue-700 to-indigo-800",
    },
    hr_manager_approval: {
      title: "HR Manager Review & Verification",
      subtitle: "Stage 2: HR Division verification of remuneration, policy & terms",
      icon: "ri-shield-check-line",
      actionBtn: "Endorse as HR Manager & Forward to Director",
      color: "from-indigo-800 via-blue-900 to-[#253C7D]",
    },
    hr_director_approval: {
      title: "HR Admin Director Authorization",
      subtitle: "Stage 3: Executive sign-off by HR Admin Director in HR Division",
      icon: "ri-shield-user-line",
      actionBtn: "Authorize as HR Admin Director & Forward to Chairwoman",
      color: "from-slate-800 via-indigo-950 to-blue-900",
    },
    chairwoman_approval: {
      title: "Chairwoman Supreme Authorization",
      subtitle: "Stage 4: Supreme corporate executive sign-off by Chairwoman",
      icon: "ri-vip-crown-line",
      actionBtn: "Grant Supreme Authorization (Chairwoman)",
      color: "from-amber-600 via-amber-700 to-slate-900",
    },
    salary_approval: {
      title: "Salary Package Sign-Off",
      subtitle: "Step 1: BU Head / Finance / HR Director Review",
      icon: "ri-money-dollar-circle-line",
      actionBtn: "Approve Proposed Salary",
      color: "from-blue-700 to-indigo-800",
    },
    generate_draft: {
      title: "HR Division Review & Generate Offer Letter",
      subtitle: "Step 2: Form sent to HR Division. Review terms & click Generate Offer Letter",
      icon: "ri-file-text-line",
      actionBtn: "Generate Offer Letter",
      color: "from-blue-700 to-indigo-800",
    },
    hr_review: {
      title: "HR Manager Offer Letter Review",
      subtitle: "Step 3: Review compiled letter, verify compliance, & endorse for executive approval",
      icon: "ri-shield-check-line",
      actionBtn: "Endorse as HR Manager & Forward to Management",
      color: "from-indigo-800 via-blue-900 to-[#253C7D]",
    },
    management_approval: {
      title: "Final Management Authorization",
      subtitle: "Step 4: Executive sign-off to authorize offer issuance",
      icon: "ri-award-line",
      actionBtn: "Authorize & Approve Offer",
      color: "from-purple-700 to-slate-900",
    },
    issue_offer: {
      title: "Issue Official Offer Letter",
      subtitle: "Step 5: Transmit official document & update pipeline to Offer",
      icon: "ri-mail-send-line",
      actionBtn: "Issue Official Offer & Generate PDF",
      color: "from-emerald-700 to-teal-900",
    },
    decision: {
      title: "Record Candidate Response",
      subtitle: "Step 6: Candidate acceptance or rejection outcome",
      icon: "ri-question-answer-line",
      actionBtn: decision === "accepted" ? "Confirm Candidate Accepted" : "Confirm Candidate Declined",
      color: decision === "accepted" ? "from-emerald-700 to-teal-800" : "from-rose-700 to-red-900",
    },
  };

  return titles[modalType] || titles.salary_approval;
}
