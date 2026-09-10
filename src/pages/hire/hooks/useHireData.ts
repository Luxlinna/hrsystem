import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import { useBranchScope } from "@/context/BranchContext";
import { usePermissions } from "@/hooks/usePermissions";
import type { SearchableEmployee } from "@/components/EmployeeSearchSelect";
import type { Job, Candidate, Interview, Branch, HiringRequest } from "../types";

export function useHireData() {
  const {
    isSuperAdmin,
    isBranchAdmin,
    effectiveBranchId,
    userBranchId,
    userBranchName,
    effectiveBranchName,
    targetBranch,
    isPartnerBranchBlocked,
    visibleBranches,
    isHrDivision,
    loading: branchLoading,
  } = useBranchScope();
  const { role, loading: permLoading } = usePermissions();

  const hasEnterpriseRecruitmentPermission = Boolean(
    isSuperAdmin ||
    role?.hiring_requests_hr_admin_approve ||
    role?.hiring_requests_hr_review ||
    role?.hiring_requests_chairman_approve ||
    isHrDivision
  );

  const isHrDivisionBranch = Boolean(
    /hr\s*division/i.test(effectiveBranchName || "") ||
    /hr\s*division/i.test(userBranchName || "")
  );

  const isAllBranches = !effectiveBranchId || effectiveBranchId === "all";
  const canViewCrossBranch = Boolean(
    hasEnterpriseRecruitmentPermission && (isAllBranches || !effectiveBranchId || effectiveBranchId === userBranchId || isHrDivisionBranch)
  );

  const canHrReview = Boolean(isSuperAdmin || role?.hiring_requests_hr_review);
  const canHrAdminApprove = Boolean(isSuperAdmin || role?.hiring_requests_hr_admin_approve);

  const [jobs, setJobs] = useState<Job[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [allCandidates, setAllCandidates] = useState<Candidate[]>([]);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [hiringRequests, setHiringRequests] = useState<HiringRequest[]>([]);
  const [employees, setEmployees] = useState<SearchableEmployee[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (branchLoading || permLoading) return;
    if (isPartnerBranchBlocked || (!hasEnterpriseRecruitmentPermission && !targetBranch && !userBranchId)) {
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
      let jobQuery = supabase
        .from("job_postings")
        .select("*, branches(id, name)")
        .is("deleted_at", null)
        .order("posted_at", { ascending: false });

      const isCrossBranchHR = canViewCrossBranch;
      const shouldScopeToBranch = !isCrossBranchHR && Boolean(targetBranch && !isHrDivisionBranch);

      if (shouldScopeToBranch && targetBranch) {
        jobQuery = jobQuery.eq("branch_id", targetBranch);
      }

      const branchQuery = supabase.from("branches").select("id, name").is("deleted_at", null).order("name");

      let reqQuery = supabase
        .from("hiring_requests")
        .select("*, branches(id, name)")
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (shouldScopeToBranch && targetBranch) {
        reqQuery = reqQuery.eq("branch_id", targetBranch);
      }

      let employeeQuery = supabase
        .from("employees")
        .select("id, first_name, last_name, department, role, avatar_url, branch_id")
        .is("deleted_at", null)
        .order("first_name");

      if (shouldScopeToBranch && targetBranch) {
        employeeQuery = employeeQuery.eq("branch_id", targetBranch);
      }

      const [{ data: j }, { data: c }, { data: i }, { data: b }, { data: hr }, { data: empData }] = await Promise.all([
        jobQuery,
        supabase
          .from("candidates")
          .select("*, job_postings(id, title, department, branch_id), assigned_recruiter:employees!assigned_recruiter_id(id, first_name, last_name, email)")
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
        employeeQuery,
      ]);

      const rawJobs = (j as unknown as Job[]) || [];
      const jobIds = new Set(rawJobs.map((x) => x.id));

      const rawCandidates = (c as unknown as Candidate[]) || [];
      const filteredCandidates = rawCandidates.filter(
        (cand) => cand.job_posting_id && jobIds.has(cand.job_posting_id)
      );

      const candIds = new Set(filteredCandidates.map((x) => x.id));

      const filteredInterviews = ((i as unknown as Interview[]) || []).filter(
        (iv) => candIds.has(iv.candidate_id)
      );

      setJobs(rawJobs);
      setCandidates(filteredCandidates);
      setAllCandidates(rawCandidates);
      setInterviews(filteredInterviews);

      const allBranches = visibleBranches && visibleBranches.length > 0
        ? (visibleBranches as Branch[])
        : ((b as unknown as Branch[]) || []);

      const currentBranchId = targetBranch || effectiveBranchId;
      const scopedList = currentBranchId
        ? allBranches.filter((br) => br.id === currentBranchId || br.branch_id === currentBranchId)
        : allBranches;

      setBranches(!canViewCrossBranch && scopedList.length > 0 ? scopedList : allBranches);
      setHiringRequests((hr as unknown as HiringRequest[]) || []);
      setEmployees((empData as unknown as SearchableEmployee[]) || []);
    } catch (err) {
      console.error("Error loading hire data:", err);
      toast("Error", "Failed to load recruitment data", "error");
    } finally {
      setLoading(false);
    }
  }, [
    branchLoading, permLoading, isPartnerBranchBlocked, targetBranch, effectiveBranchId,
    userBranchId, visibleBranches, canViewCrossBranch, hasEnterpriseRecruitmentPermission,
    isHrDivisionBranch
  ]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    isPartnerBranchBlocked,
    userBranchId,
    userBranchName,
    targetBranch,
    isHrDivisionScope: canViewCrossBranch,
    canViewCrossBranch,
    jobs,
    setJobs,
    candidates,
    setCandidates,
    allCandidates,
    interviews,
    setInterviews,
    branches,
    hiringRequests,
    setHiringRequests,
    employees,
    loading,
    loadData,
  };
}
