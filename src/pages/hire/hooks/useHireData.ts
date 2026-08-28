import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import { useBranchScope } from "@/context/BranchContext";
import type { Job, Candidate, Interview, Branch, HiringRequest } from "../types";

export function useHireData() {
  const { isSuperAdmin, effectiveBranchId, userBranchId } = useBranchScope();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [hiringRequests, setHiringRequests] = useState<HiringRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const targetBranch = effectiveBranchId || (!isSuperAdmin ? userBranchId : null);

      let jobQuery = supabase
        .from("job_postings")
        .select("*, branches(id, name)")
        .is("deleted_at", null)
        .order("posted_at", { ascending: false });

      if (targetBranch) {
        jobQuery = jobQuery.eq("branch_id", targetBranch);
      }

      let branchQuery = supabase.from("branches").select("id, name").order("name");
      if (targetBranch) {
        branchQuery = branchQuery.eq("id", targetBranch);
      }

      let reqQuery = supabase
        .from("hiring_requests")
        .select("*, branches(id, name)")
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (targetBranch) {
        reqQuery = reqQuery.eq("branch_id", targetBranch);
      }

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

      const filteredCandidates = targetBranch
        ? ((c as unknown as Candidate[]) || []).filter((cand) => cand.job_posting_id && jobIds.has(cand.job_posting_id))
        : ((c as unknown as Candidate[]) || []);

      const candIds = new Set(filteredCandidates.map((x) => x.id));

      const filteredInterviews = targetBranch
        ? ((i as unknown as Interview[]) || []).filter((iv) => candIds.has(iv.candidate_id))
        : ((i as unknown as Interview[]) || []);

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
  }, [effectiveBranchId, isSuperAdmin, userBranchId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
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
