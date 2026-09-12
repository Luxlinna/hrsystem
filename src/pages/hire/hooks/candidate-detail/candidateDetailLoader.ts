import { supabase } from "@/lib/supabase";
import type { Candidate, Interview, Job } from "../../types";

export interface LoadedCandidateData {
  candidate: Candidate | null;
  interviews: Interview[];
  jobs: Job[];
  resolvedCandidateId?: string;
}

/**
 * Resolves whether the provided ID might actually belong to an offer letter,
 * candidate approval (CAF), or interview, and retrieves the true candidate ID.
 */
export async function resolveCandidateIdFallback(cid: string): Promise<string | null> {
  // 1. Check local offer letter store
  try {
    const raw = localStorage.getItem("hrm_offer_letters_store");
    if (raw) {
      const list = JSON.parse(raw);
      const found = list.find((o: any) => o.id === cid);
      if (found?.candidate_id) return found.candidate_id;
    }
  } catch {}

  // 2. Check remote offer_letters table
  try {
    const { data: offRow } = await supabase
      .from("offer_letters")
      .select("candidate_id")
      .eq("id", cid)
      .maybeSingle();
    if (offRow?.candidate_id) return offRow.candidate_id;
  } catch {}

  // 3. Check candidate_approvals (CAF) table
  try {
    const { data: cafRow } = await supabase
      .from("candidate_approvals")
      .select("candidate_id")
      .eq("id", cid)
      .maybeSingle();
    if (cafRow?.candidate_id) return cafRow.candidate_id;
  } catch {}

  // 4. Check interviews table
  try {
    const { data: ivRow } = await supabase
      .from("interviews")
      .select("candidate_id")
      .eq("id", cid)
      .maybeSingle();
    if (ivRow?.candidate_id) return ivRow.candidate_id;
  } catch {}

  return null;
}

export async function fetchCandidateBundle(candidateId: string): Promise<LoadedCandidateData> {
  const [{ data: c }, { data: ivs }, { data: apps }, { data: j }] = await Promise.all([
    supabase
      .from("candidates")
      .select(
        "*, job_postings(id, title, department, branch_id, branches(id, name, manager_name)), assigned_recruiter:employees!assigned_recruiter_id(id, first_name, last_name, email)"
      )
      .eq("id", candidateId)
      .is("deleted_at", null)
      .maybeSingle(),
    supabase
      .from("interviews")
      .select("*, employees(id, first_name, last_name, avatar_url, role, department, branch_id)")
      .eq("candidate_id", candidateId)
      .is("deleted_at", null)
      .order("scheduled_at", { ascending: false }),
    supabase
      .from("candidate_applications")
      .select("*, job_postings(id, title, department, location, branches(name))")
      .eq("candidate_id", candidateId)
      .order("applied_at", { ascending: false }),
    supabase
      .from("job_postings")
      .select("id, title, department, location")
      .eq("status", "active")
      .is("deleted_at", null)
      .order("title"),
  ]);

  let cand = c as unknown as Candidate | null;
  if (cand) {
    cand.applications = (apps as any) || [];
  }

  return {
    candidate: cand,
    interviews: (ivs as unknown as Interview[]) || [],
    jobs: (j as unknown as Job[]) || [],
  };
}
