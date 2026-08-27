import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import type { Job, Candidate, Interview, Branch } from "../types";

export function useHireData() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [{ data: j }, { data: c }, { data: i }, { data: b }] = await Promise.all([
        supabase
          .from("job_postings")
          .select("*, branches(id, name)")
          .is("deleted_at", null)
          .order("posted_at", { ascending: false }),
        supabase
          .from("candidates")
          .select("*, job_postings(id, title, department, branch_id)")
          .is("deleted_at", null)
          .order("applied_at", { ascending: false }),
        supabase
          .from("interviews")
          .select(
            "*, candidates(id, full_name, job_posting_id, job_postings(title, department)), employees(id, first_name, last_name, avatar_url)"
          )
          .is("deleted_at", null)
          .order("scheduled_at", { ascending: false }),
        supabase.from("branches").select("id, name").order("name"),
      ]);
      setJobs((j as unknown as Job[]) || []);
      setCandidates((c as unknown as Candidate[]) || []);
      setInterviews((i as unknown as Interview[]) || []);
      setBranches((b as unknown as Branch[]) || []);
    } catch (err) {
      toast("Error", "Failed to load recruitment data", "error");
    } finally {
      setLoading(false);
    }
  }, []);

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
    loading,
    loadData,
  };
}
