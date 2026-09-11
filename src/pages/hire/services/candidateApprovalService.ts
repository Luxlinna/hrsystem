import { supabase } from "@/lib/supabase";
import type { Candidate, Interview, CandidateApproval, CandidateApprovalPanel } from "../types";

const LOCAL_STORAGE_KEY = "hrm_candidate_approvals_store";

function getLocalApprovals(): CandidateApproval[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setLocalApprovals(list: CandidateApproval[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
  } catch {
    // Ignore quota errors
  }
}

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

  // Extract panels from scheduled / completed interviews
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
            date_time: new Date().toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" }) + " 3:00PM",
            position: "CEO",
            signature: "Signed",
          },
          {
            name: "Mr. Sun Reasey",
            date_time: new Date().toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" }) + " 3:00PM",
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

export async function fetchCandidateApproval(
  candidateId: string,
  candidate?: Candidate,
  interviews?: Interview[],
  actorName = "HR Operations"
): Promise<CandidateApproval> {
  // 1. Try fetching from Supabase
  try {
    const { data, error } = await supabase
      .from("candidate_approvals")
      .select("*")
      .eq("candidate_id", candidateId)
      .maybeSingle();

    if (!error && data) {
      // Sync to local
      const local = getLocalApprovals();
      const idx = local.findIndex((a) => a.id === data.id || a.candidate_id === candidateId);
      if (idx >= 0) {
        local[idx] = data as CandidateApproval;
      } else {
        local.unshift(data as CandidateApproval);
      }
      setLocalApprovals(local);
      return data as CandidateApproval;
    }
  } catch {
    // Local fallback
  }

  // 2. Check local store
  const local = getLocalApprovals();
  const found = local.find((a) => a.candidate_id === candidateId);
  if (found) {
    return found;
  }

  // 3. Initialize fresh if candidate provided
  if (candidate) {
    const fresh = initCandidateApproval(candidate, interviews, actorName);
    local.unshift(fresh);
    setLocalApprovals(local);
    return fresh;
  }

  throw new Error("Candidate record required to initialize approval");
}

export async function saveCandidateApproval(
  approval: CandidateApproval
): Promise<CandidateApproval> {
  const now = new Date().toISOString();

  // Check if all 4 approved
  const sigs = approval.signatories;
  const allApproved =
    sigs.ceo.status === "approved" &&
    sigs.hr_manager.status === "approved" &&
    sigs.division_director.status === "approved" &&
    sigs.chairwoman.status === "approved";

  const updated: CandidateApproval = {
    ...approval,
    status: allApproved ? "approved" : approval.status === "draft" ? "in_review" : approval.status,
    updated_at: now,
    completed_at: allApproved ? approval.completed_at || now : null,
  };

  // 1. Save local
  const local = getLocalApprovals();
  const idx = local.findIndex((a) => a.id === updated.id || a.candidate_id === updated.candidate_id);
  if (idx >= 0) {
    local[idx] = updated;
  } else {
    local.unshift(updated);
  }
  setLocalApprovals(local);

  // 2. Save remote Supabase
  try {
    await supabase.from("candidate_approvals").upsert({
      id: updated.id,
      candidate_id: updated.candidate_id,
      form_number: updated.form_number,
      branch_id: updated.branch_id,
      status: updated.status,
      candidate_name: updated.candidate_name,
      gender: updated.gender,
      position_applied: updated.position_applied,
      business_unit: updated.business_unit,
      department: updated.department,
      hiring_manager: updated.hiring_manager,
      current_salary: updated.current_salary,
      expectation_salary: updated.expectation_salary,
      current_benefit: updated.current_benefit,
      notice_period: updated.notice_period,
      education_and_skill: updated.education_and_skill,
      work_experience: updated.work_experience,
      strengths: updated.strengths,
      improvement: updated.improvement,
      overall_assessment: updated.overall_assessment,
      interview_panels: updated.interview_panels,
      signatories: updated.signatories,
      created_at: updated.created_at,
      updated_at: updated.updated_at,
      completed_at: updated.completed_at,
    });
  } catch (err) {
    console.warn("Could not sync candidate_approvals to Supabase, persisted locally:", err);
  }

  return updated;
}

export function isCandidateApprovalCompleted(approval: CandidateApproval | null): boolean {
  if (!approval) return false;
  if (approval.status === "approved") return true;

  // Alternatively, check if all 4 signatories signed off
  const s = approval.signatories;
  return Boolean(
    s &&
    s.ceo?.status === "approved" &&
    s.hr_manager?.status === "approved" &&
    s.division_director?.status === "approved" &&
    s.chairwoman?.status === "approved"
  );
}
