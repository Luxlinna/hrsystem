import { useState, useMemo, useCallback, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import type { Job, Candidate, Interview, HireTab, Branch } from "../types";
import { DEFAULT_DEPARTMENTS, PIPELINE_STAGES } from "../constants";

const STAGE_ORDER = ["all", ...PIPELINE_STAGES];
const JOB_STATUS_ORDER = ["all", "active", "closed"];
const INTERVIEW_STATUS_ORDER = ["all", "scheduled", "completed", "cancelled"];

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
      const openApproval = searchParams.get("openApproval") === "true" || searchParams.get("openCaf") === "true" || searchParams.get("approval") === "true";
      const openOffer = searchParams.get("openOffer") === "true" || searchParams.get("offer") === "true";
      const query = openApproval ? "?openApproval=true" : openOffer ? "?openOffer=true" : "";
      navigate(`/hire/candidates/${candidateId}${query}`, { replace: true });
    }
  }, [searchParams, navigate]);

  const urlTab = searchParams.get("tab") as HireTab | null;
  const initialTab: HireTab = urlTab && ["actions", "jobs", "candidates", "interviews", "pipeline", "requests", "offers"].includes(urlTab) ? urlTab : "jobs";
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
  const [filterJobStatus, setJobStatusState] = useState<string>("all");
  const [jobStatusSlideDir, setJobStatusSlideDir] = useState<"right" | "left" | null>(null);
  const [filterDepartment, setFilterDepartment] = useState<string>("all");
  const [filterBranch, setFilterBranch] = useState<string>("all");
  const [filterCandidateStage, setCandidateStageState] = useState<string>("all");
  const [stageSlideDir, setStageSlideDir] = useState<"right" | "left" | null>(null);
  const [filterCandidateJob, setFilterCandidateJob] = useState<string>("all");
  const [filterInterviewStatus, setInterviewStatusState] = useState<string>("all");
  const [interviewStatusSlideDir, setInterviewStatusSlideDir] = useState<"right" | "left" | null>(null);

  const setFilterJobStatus = useCallback((nextStatus: string) => {
    const prevIdx = JOB_STATUS_ORDER.indexOf(filterJobStatus);
    const nextIdx = JOB_STATUS_ORDER.indexOf(nextStatus);
    setJobStatusSlideDir(nextIdx >= prevIdx ? "right" : "left");
    setJobStatusState(nextStatus);
  }, [filterJobStatus]);

  const setFilterCandidateStage = useCallback((nextStage: string) => {
    const prevIdx = STAGE_ORDER.indexOf(filterCandidateStage);
    const nextIdx = STAGE_ORDER.indexOf(nextStage);
    setStageSlideDir(nextIdx >= prevIdx ? "right" : "left");
    setCandidateStageState(nextStage);
  }, [filterCandidateStage]);

  const setFilterInterviewStatus = useCallback((nextStatus: string) => {
    const prevIdx = INTERVIEW_STATUS_ORDER.indexOf(filterInterviewStatus);
    const nextIdx = INTERVIEW_STATUS_ORDER.indexOf(nextStatus);
    setInterviewStatusSlideDir(nextIdx >= prevIdx ? "right" : "left");
    setInterviewStatusState(nextStatus);
  }, [filterInterviewStatus]);

  const departments = useMemo(() => {
    const standardDepts = DEFAULT_DEPARTMENTS.filter((d) => d !== "Other");
    const customDepts = new Set<string>();
    jobs.forEach((j) => { if (j.department && !standardDepts.includes(j.department)) customDepts.add(j.department); });
    candidates.forEach((c) => { if (c.job_postings?.department && !standardDepts.includes(c.job_postings.department)) customDepts.add(c.job_postings.department); });
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
        } else if (j.branch_id && j.branch_id !== filterBranch) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const str = `${j.title || ""} ${j.department || ""} ${j.location || ""} ${j.branches?.name || ""} ${j.description || ""}`.toLowerCase();
        if (!str.includes(q)) return false;
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
        const str = `${c.candidate_code || ""} ${c.full_name || ""} ${c.email || ""} ${c.phone || ""} ${c.location || ""} ${c.job_postings?.title || ""} ${c.source || ""}`.toLowerCase();
        if (!str.includes(q)) return false;
      }
      return true;
    });
  }, [candidates, filterCandidateStage, filterCandidateJob, filterDepartment, searchQuery]);

  const filteredInterviews = useMemo(() => {
    return interviews.filter((i) => {
      if (filterInterviewStatus !== "all" && i.status !== filterInterviewStatus) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const str = `${i.candidates?.full_name || ""} ${i.candidates?.job_postings?.title || ""} ${i.interviewer_name || ""}`.toLowerCase();
        if (!str.includes(q)) return false;
      }
      return true;
    });
  }, [interviews, filterInterviewStatus, searchQuery]);

  const pipelineStageCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    PIPELINE_STAGES.forEach((st) => {
      counts[st] = candidates.filter((c) => (c.stage === "applied" ? "cv_received" : c.stage === "interview" ? "hr_interview" : c.stage) === st).length;
    });
    return counts;
  }, [candidates]);

  const resetFilters = useCallback(() => {
    setSearchQuery("");
    setJobStatusState("all");
    setFilterDepartment("all");
    setFilterBranch("all");
    setCandidateStageState("all");
    setFilterCandidateJob("all");
    setInterviewStatusState("all");
  }, []);

  const hasFilters = Boolean(searchQuery.trim() || filterJobStatus !== "all" || filterDepartment !== "all" || filterBranch !== "all" || filterCandidateStage !== "all" || filterCandidateJob !== "all" || filterInterviewStatus !== "all");

  return {
    tab, setTab, jobViewMode, setJobViewMode, candidateViewMode, setCandidateViewMode,
    searchQuery, setSearchQuery, filterJobStatus, setFilterJobStatus, jobStatusSlideDir,
    filterDepartment, setFilterDepartment, filterBranch, setFilterBranch,
    filterCandidateStage, setFilterCandidateStage, stageSlideDir,
    filterCandidateJob, setFilterCandidateJob,
    filterInterviewStatus, setFilterInterviewStatus, interviewStatusSlideDir,
    resetFilters, hasFilters, departments, filteredJobs, filteredCandidates, filteredInterviews, pipelineStageCounts,
  };
}
