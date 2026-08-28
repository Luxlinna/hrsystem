import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import { useBranchScope } from "@/context/BranchContext";
import type { Job, Candidate, Interview, Branch, HiringRequest } from "../types";

export function useHireData() {
  const { isSuperAdmin, effectiveBranchId, userBranchId, userBranchName } = useBranchScope();

  // Partner Privacy Rule: Super Admin or any user CANNOT access other partner branches' recruitment pipeline.
  // Access is strictly confined to the user's home branch (userBranchId).
  const isPartnerBranchBlocked = Boolean(
    !userBranchId || (effectiveBranchId && effectiveBranchId !== userBranchId)
  );
  const targetBranch = isPartnerBranchBlocked ? null : userBranchId;

  const [jobs, setJobs] = useState<Job[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [hiringRequests, setHiringRequests] = useState<HiringRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (isPartnerBranchBlocked || !targetBranch) {
      setJobs([]);
      setCandidates([]);
      setInterviews([]);
      setBranches([]);
      setHiringRequests([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const jobQuery = supabase
        .from("job_postings")
        .select("*, branches(id, name)")
        .is("deleted_at", null)
        .eq("branch_id", targetBranch)
        .order("posted_at", { ascending: false });

      const branchQuery = supabase.from("branches").select("id, name").eq("id", targetBranch).order("name");

      const reqQuery = supabase
        .from("hiring_requests")
        .select("*, branches(id, name)")
        .is("deleted_at", null)
        .eq("branch_id", targetBranch)
        .order("created_at", { ascending: false });

      const [{ data: j }, { data: c }, { data: i }, { data: b }, { data: hr }] = await Promise.all([
        jobQuery,
        supabase
          .from("candidates")
          .select("*, job_postings(id, title, department, branch_id)")
          .is("deleted_at", null)
          .order("applied_at", { ascending: false }),
        supabase
          .from("interviews")
          .select(
            "*, candidates(id, full_name, job_posting_id, job_postings(title, department, branch_id)), employees(id, first_name, last_name, avatar_url, branch_id)"
          )
          .is("deleted_at", null)
          .order("scheduled_at", { ascending: false }),
        branchQuery,
        reqQuery,
      ]);

      const rawJobs = (j as unknown as Job[]) || [];
      const jobIds = new Set(rawJobs.map((x) => x.id));

      const filteredCandidates = ((c as unknown as Candidate[]) || []).filter(
        (cand) => cand.job_posting_id && jobIds.has(cand.job_posting_id)
      );

      const candIds = new Set(filteredCandidates.map((x) => x.id));

      const filteredInterviews = ((i as unknown as Interview[]) || []).filter(
        (iv) => candIds.has(iv.candidate_id)
      );

      setJobs(rawJobs);
      setCandidates(filteredCandidates);
      setInterviews(filteredInterviews);
      setBranches((b as unknown as Branch[]) || []);
      setHiringRequests((hr as unknown as HiringRequest[]) || []);
    } catch (err) {
      console.error("Error loading hire data:", err);
      toast("Error", "Failed to load recruitment data", "error");
    } finally {
      setLoading(false);
    }
  }, [isPartnerBranchBlocked, targetBranch]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    isPartnerBranchBlocked,
    userBranchId,
    userBranchName,
    targetBranch,
    jobs,
    setJobs,
    candidates,
    setCandidates,
    interviews,
    setInterviews,
    branches,
    hiringRequests,
    setHiringRequests,
    loading,
    loadData,
  };
}
