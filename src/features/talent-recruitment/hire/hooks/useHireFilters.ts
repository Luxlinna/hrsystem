import { useState, useMemo, useCallback, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import type { Job, Candidate, Interview, HireTab, Branch } from "../types";
import { DEFAULT_DEPARTMENTS, PIPELINE_STAGES } from "../constants";

export function useHireFilters(
  jobs: Job[],
  candidates: Candidate[],
  interviews: Interview[],
  branches: Branch[] = []
) {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const candidateId = searchParams.get("candidateId");
    if (candidateId) {
      const openApproval =
        searchParams.get("openApproval") === "true" ||
        searchParams.get("openCaf") === "true" ||
        searchParams.get("approval") === "true";
      const openOffer =
        searchParams.get("openOffer") === "true" ||
        searchParams.get("offer") === "true";
      const query = openApproval ? "?openApproval=true" : openOffer ? "?openOffer=true" : "";
      navigate(`/hire/candidates/${candidateId}${query}`, { replace: true });
    }
  }, [searchParams, navigate]);

  const urlTab = searchParams.get("tab") as HireTab | null;
  const initialTab: HireTab = (urlTab && ["actions", "jobs", "candidates", "interviews", "pipeline", "requests", "offers"].includes(urlTab))
    ? urlTab
    : "jobs";

  const [tab, setTabState] = useState<HireTab>(initialTab);

  useEffect(() => {
    if (urlTab && ["actions", "jobs", "candidates", "interviews", "pipeline", "requests", "offers"].includes(urlTab)) {
      setTabState(urlTab);
    }
  }, [urlTab]);

  const setTab = useCallback((newTab: HireTab) => {
    setTabState(newTab);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("tab", newTab);
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  const [jobViewMode, setJobViewMode] = useState<"grid" | "list">("grid");
  const [candidateViewMode, setCandidateViewMode] = useState<"cards" | "list">("cards");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterJobStatus, setFilterJobStatus] = useState<string>("all");
  const [filterDepartment, setFilterDepartment] = useState<string>("all");
  const [filterBranch, setFilterBranch] = useState<string>("all");
  const [filterCandidateStage, setFilterCandidateStage] = useState<string>("all");
  const [filterCandidateJob, setFilterCandidateJob] = useState<string>("all");
  const [filterInterviewStatus, setFilterInterviewStatus] = useState<string>("all");

  const departments = useMemo(() => {
    const standardDepts = DEFAULT_DEPARTMENTS.filter((d) => d !== "Other");
    const customDepts = new Set<string>();
    jobs.forEach((j) => {
      if (j.department && !standardDepts.includes(j.department)) {
        customDepts.add(j.department);
      }
    });
    candidates.forEach((c) => {
      const dept = c.job_postings?.department;
      if (dept && !standardDepts.includes(dept)) {
        customDepts.add(dept);
      }
    });
    return [...standardDepts, ...Array.from(customDepts).sort()];
  }, [jobs, candidates]);

  const filteredJobs = useMemo(() => {
    return jobs.filter((j) => {
      if (filterJobStatus !== "all" && j.status !== filterJobStatus) return false;
      if (filterDepartment !== "all" && j.department !== filterDepartment) return false;
      if (filterBranch !== "all") {
        if (filterBranch.startsWith("site:")) {
          const site = branches.find((b) => b.id === filterBranch);
          if (site) {
            const loc = (j.location || "").toLowerCase().trim();
            const sName = (site.name || "").toLowerCase().trim();
            if (loc !== sName && !loc.includes(sName)) return false;
          }
        } else {
          if (j.branch_id && j.branch_id !== filterBranch) return false;
        }
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = (j.title || "").toLowerCase().includes(q);
        const matchDept = (j.department || "").toLowerCase().includes(q);
        const matchLoc = (j.location || "").toLowerCase().includes(q);
        const matchBranch = (j.branches?.name || "").toLowerCase().includes(q);
        const matchDesc = (j.description || "").toLowerCase().includes(q);
        if (!matchTitle && !matchDept && !matchLoc && !matchBranch && !matchDesc) return false;
      }
      return true;
    });
  }, [jobs, filterJobStatus, filterDepartment, filterBranch, searchQuery, branches]);

  const filteredCandidates = useMemo(() => {
    return candidates.filter((c) => {
      const normStage = c.stage === "applied" ? "cv_received" : c.stage === "interview" ? "hr_interview" : c.stage;
      if (filterCandidateStage !== "all" && normStage !== filterCandidateStage && c.stage !== filterCandidateStage) return false;
      if (filterCandidateJob !== "all" && c.job_posting_id !== filterCandidateJob) return false;
      if (filterDepartment !== "all" && c.job_postings?.department !== filterDepartment) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchCode = (c.candidate_code || "").toLowerCase().includes(q);
        const matchName = c.full_name.toLowerCase().includes(q);
        const matchEmail = c.email.toLowerCase().includes(q);
        const matchPhone = (c.phone || "").toLowerCase().includes(q);
        const matchLoc = (c.location || "").toLowerCase().includes(q);
        const matchJob = (c.job_postings?.title || "").toLowerCase().includes(q);
        const matchSource = (c.source || "").toLowerCase().includes(q);
        const matchRecruiter = `${c.assigned_recruiter?.first_name || ""} ${c.assigned_recruiter?.last_name || ""}`.toLowerCase().includes(q);
        const matchSkills = (c.skills || []).some((s) => s.toLowerCase().includes(q));
        if (!matchCode && !matchName && !matchEmail && !matchPhone && !matchLoc && !matchJob && !matchSource && !matchRecruiter && !matchSkills) return false;
      }
      return true;
    });
  }, [candidates, filterCandidateStage, filterCandidateJob, filterDepartment, searchQuery]);

  const filteredInterviews = useMemo(() => {
    return interviews.filter((i) => {
      if (filterInterviewStatus !== "all" && i.status !== filterInterviewStatus) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchCand = (i.candidates?.full_name || "").toLowerCase().includes(q);
        const matchJob = (i.candidates?.job_postings?.title || "").toLowerCase().includes(q);
        const matchInterviewer = `${i.employees?.first_name || ""} ${i.employees?.last_name || ""}`
          .toLowerCase()
          .includes(q);
        if (!matchCand && !matchJob && !matchInterviewer) return false;
      }
      return true;
    });
  }, [interviews, filterInterviewStatus, searchQuery]);

  const pipelineStageCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    PIPELINE_STAGES.forEach((st) => {
      counts[st] = candidates.filter((c) => {
        const norm = c.stage === "applied" ? "cv_received" : c.stage === "interview" ? "hr_interview" : c.stage;
        return norm === st;
      }).length;
    });
    return counts;
  }, [candidates]);

  const resetFilters = useCallback(() => {
    setSearchQuery("");
    setFilterJobStatus("all");
    setFilterDepartment("all");
    setFilterBranch("all");
    setFilterCandidateStage("all");
    setFilterCandidateJob("all");
    setFilterInterviewStatus("all");
  }, []);

  const hasFilters = Boolean(
    searchQuery.trim() ||
      filterJobStatus !== "all" ||
      filterDepartment !== "all" ||
      filterBranch !== "all" ||
      filterCandidateStage !== "all" ||
      filterCandidateJob !== "all" ||
      filterInterviewStatus !== "all"
  );

  return {
    tab,
    setTab,
    jobViewMode,
    setJobViewMode,
    candidateViewMode,
    setCandidateViewMode,
    searchQuery,
    setSearchQuery,
    filterJobStatus,
    setFilterJobStatus,
    filterDepartment,
    setFilterDepartment,
    filterBranch,
    setFilterBranch,
    filterCandidateStage,
    setFilterCandidateStage,
    filterCandidateJob,
    setFilterCandidateJob,
    filterInterviewStatus,
    setFilterInterviewStatus,
    resetFilters,
    hasFilters,
    departments,
    filteredJobs,
    filteredCandidates,
    filteredInterviews,
    pipelineStageCounts,
  };
}
