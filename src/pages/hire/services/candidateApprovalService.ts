import { supabase } from "@/lib/supabase";
import type { Candidate, Interview, CandidateApproval } from "../types";
import {
  generateApprovalFormNumber,
  initCandidateApproval,
} from "./candidateApprovalDefaults";

export { generateApprovalFormNumber, initCandidateApproval };

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

  const s = approval.signatories;
  return Boolean(
    s &&
    s.ceo?.status === "approved" &&
    s.hr_manager?.status === "approved" &&
    s.division_director?.status === "approved" &&
    s.chairwoman?.status === "approved"
  );
}
