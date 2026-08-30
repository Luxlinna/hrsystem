import { useState, useCallback } from "react";
import type { Job, Candidate, Interview, NewJobFormState, NewCandidateFormState, NewInterviewFormState, Branch } from "../types";
import { INITIAL_JOB_FORM, INITIAL_CANDIDATE_FORM, INITIAL_INTERVIEW_FORM } from "../constants";

interface UseHireModalsProps {
  branches: Branch[];
  jobs: Job[];
  candidates: Candidate[];
  selectedBranchId?: string;
  effectiveBranchId?: string;
  userBranchId?: string;
  targetBranch?: string | null;
}

export function useHireModals({
  branches,
  jobs,
  candidates,
  selectedBranchId,
  effectiveBranchId,
  userBranchId,
  targetBranch,
}: UseHireModalsProps) {
  const [jobModal, setJobModal] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [newJob, setNewJob] = useState<NewJobFormState>(INITIAL_JOB_FORM);

  const [candidateModal, setCandidateModal] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null);
  const [newCandidate, setNewCandidate] = useState<NewCandidateFormState>(INITIAL_CANDIDATE_FORM);
  const [resumeFile, setResumeFile] = useState<File | null>(null);

  const [interviewModal, setInterviewModal] = useState(false);
  const [editingInterview, setEditingInterview] = useState<Interview | null>(null);
  const [newInterview, setNewInterview] = useState<NewInterviewFormState>(INITIAL_INTERVIEW_FORM);

  const [onboardingModal, setOnboardingModal] = useState(false);
  const [onboardingCandidate, setOnboardingCandidate] = useState<Candidate | null>(null);
  const [onboardingBranchId, setOnboardingBranchId] = useState("");
  const [onboardingJoinDate, setOnboardingJoinDate] = useState("");

  const [feedbackModal, setFeedbackModal] = useState(false);
  const [feedbackInterview, setFeedbackInterview] = useState<Interview | null>(null);
  const [feedbackScore, setFeedbackScore] = useState(5);
  const [feedbackNotes, setFeedbackNotes] = useState("");

  const openCreateJob = useCallback(() => {
    const target = selectedBranchId || effectiveBranchId || userBranchId || targetBranch || branches[0]?.id || "";
    setEditingJob(null);
    const selectedObj = branches.find((b) => b.id === target);
    setNewJob({
      ...INITIAL_JOB_FORM,
      branch_id: target,
      location: selectedObj ? selectedObj.name : "",
    });
    setJobModal(true);
  }, [branches, selectedBranchId, effectiveBranchId, userBranchId, targetBranch]);

  const openEditJob = useCallback((job: Job) => {
    setEditingJob(job);
    const matchedSite = branches.find(
      (b) => b.is_site && b.branch_id === job.branch_id && (b.name || "").toLowerCase() === (job.location || "").toLowerCase()
    );
    setNewJob({
      title: job.title,
      department: job.department,
      branch_id: matchedSite ? matchedSite.id : (job.branch_id || ""),
      description: job.description || "",
      location: job.location || "",
      salary_min: String(job.salary_min || ""),
      salary_max: String(job.salary_max || ""),
      type: job.type || "full-time",
      closing_date: job.closing_date || "",
    });
    setJobModal(true);
  }, [branches]);

  const openCreateCandidate = useCallback((defaultJobId?: string) => {
    setEditingCandidate(null);
    setNewCandidate({
      ...INITIAL_CANDIDATE_FORM,
      job_posting_id: defaultJobId || jobs[0]?.id || "",
    });
    setResumeFile(null);
    setCandidateModal(true);
  }, [jobs]);

  const openEditCandidate = useCallback((c: Candidate) => {
    setEditingCandidate(c);
    setNewCandidate({
      full_name: c.full_name,
      email: c.email,
      phone: c.phone || "",
      job_posting_id: c.job_posting_id,
      source: c.source || "Website",
      notes: c.notes || "",
    });
    setResumeFile(null);
    setCandidateModal(true);
  }, []);

  const openCreateInterview = useCallback((defaultCandidateId?: string) => {
    setEditingInterview(null);
    setNewInterview({
      ...INITIAL_INTERVIEW_FORM,
      candidate_id: defaultCandidateId || candidates[0]?.id || "",
    });
    setInterviewModal(true);
  }, [candidates]);

  const openEditInterview = useCallback((iv: Interview) => {
    setEditingInterview(iv);
    setNewInterview({
      candidate_id: iv.candidate_id,
      scheduled_at: iv.scheduled_at ? new Date(iv.scheduled_at).toISOString().slice(0, 16) : "",
      duration_minutes: String(iv.duration_minutes || 60),
      type: iv.type || "video",
      notes: iv.notes || "",
    });
    setInterviewModal(true);
  }, []);

  const openMoveToOnboarding = useCallback((c: Candidate) => {
    setOnboardingCandidate(c);
    const job = jobs.find((j) => j.id === c.job_posting_id);
    const matchedSite = branches.find(
      (b) => b.is_site && b.branch_id === job?.branch_id && (b.name || "").toLowerCase() === (job?.location || "").toLowerCase()
    );
    setOnboardingBranchId(matchedSite ? matchedSite.id : (job?.branch_id || branches[0]?.id || ""));
    setOnboardingJoinDate(new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0]);
    setOnboardingModal(true);
  }, [jobs, branches]);

  const openFeedbackModal = useCallback((iv: Interview) => {
    setFeedbackInterview(iv);
    setFeedbackScore(iv.score ?? 5);
    setFeedbackNotes(iv.feedback || "");
    setFeedbackModal(true);
  }, []);

  return {
    jobModal, setJobModal,
    editingJob, setEditingJob,
    newJob, setNewJob,
    candidateModal, setCandidateModal,
    editingCandidate, setEditingCandidate,
    newCandidate, setNewCandidate,
    resumeFile, setResumeFile,
    interviewModal, setInterviewModal,
    editingInterview, setEditingInterview,
    newInterview, setNewInterview,
    onboardingModal, setOnboardingModal,
    onboardingCandidate, setOnboardingCandidate,
    onboardingBranchId, setOnboardingBranchId,
    onboardingJoinDate, setOnboardingJoinDate,
    feedbackModal, setFeedbackModal,
    feedbackInterview, setFeedbackInterview,
    feedbackScore, setFeedbackScore,
    feedbackNotes, setFeedbackNotes,
    openCreateJob, openEditJob,
    openCreateCandidate, openEditCandidate,
    openCreateInterview, openEditInterview,
    openMoveToOnboarding, openFeedbackModal,
  };
}
