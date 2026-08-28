import { useState, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { useBranchScope } from "@/context/BranchContext";
import { useMyEmployee } from "@/hooks/useMyEmployee";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import { logActivity } from "@/lib/audit";
import { notify } from "@/lib/notify";
import { uploadFileToR2 } from "@/lib/r2-storage";
import type { Job, Candidate, Interview, NewJobFormState, NewCandidateFormState, NewInterviewFormState } from "../types";
import { INITIAL_JOB_FORM, INITIAL_CANDIDATE_FORM, INITIAL_INTERVIEW_FORM } from "../constants";
import { useHireData } from "./useHireData";
import { useHireFilters } from "./useHireFilters";
import { useHireMutations } from "./useHireMutations";
import { useHiringRequests } from "./useHiringRequests";

export function useHire() {
  const { user } = useAuth();
  const { role, isAdmin } = usePermissions();
  const { isSuperAdmin, isBranchAdmin, effectiveBranchId, userBranchId } = useBranchScope();
  const { employee: myEmployee } = useMyEmployee();

  const actorName = (user?.user_metadata?.display_name as string) || user?.email || "Unknown";
  const actorRole = role?.name || "Admin";

  const roleNameLower = (role?.name || "").toLowerCase();
  const canRequest = /manager/i.test(roleNameLower) || isBranchAdmin || isAdmin;
  const canApprove = /ceo/i.test(roleNameLower) || (isAdmin && !isBranchAdmin) || isSuperAdmin;
  const isChairman = /chair/i.test(roleNameLower);

  // Data & Filters
  const data = useHireData();
  const filters = useHireFilters(data.jobs, data.candidates, data.interviews);
  const mutations = useHireMutations({ actorName, actorRole, loadData: data.loadData });
  const requests = useHiringRequests({
    actorName,
    actorRole,
    actorEmail: user?.email,
    myEmployeeId: myEmployee?.id,
    loadData: data.loadData,
  });

  // Modal States
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

  // Modal Openers
  const openCreateJob = useCallback(() => {
    const targetBranch = (!isSuperAdmin && userBranchId) ? userBranchId : (effectiveBranchId || data.branches[0]?.id || "");
    setEditingJob(null);
    setNewJob({
      ...INITIAL_JOB_FORM,
      branch_id: targetBranch,
    });
    setJobModal(true);
  }, [data.branches, isSuperAdmin, userBranchId, effectiveBranchId]);

  const openEditJob = useCallback((job: Job) => {
    setEditingJob(job);
    setNewJob({
      title: job.title,
      department: job.department,
      branch_id: job.branch_id || "",
      description: job.description || "",
      location: job.location || "",
      salary_min: String(job.salary_min || ""),
      salary_max: String(job.salary_max || ""),
      type: job.type || "full-time",
      closing_date: job.closing_date || "",
    });
    setJobModal(true);
  }, []);

  const openCreateCandidate = useCallback((defaultJobId?: string) => {
    setEditingCandidate(null);
    setNewCandidate({
      ...INITIAL_CANDIDATE_FORM,
      job_posting_id: defaultJobId || data.jobs[0]?.id || "",
    });
    setResumeFile(null);
    setCandidateModal(true);
  }, [data.jobs]);

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
      candidate_id: defaultCandidateId || data.candidates[0]?.id || "",
    });
    setInterviewModal(true);
  }, [data.candidates]);

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
    const job = data.jobs.find((j) => j.id === c.job_posting_id);
    setOnboardingBranchId(job?.branch_id || data.branches[0]?.id || "");
    setOnboardingJoinDate(new Date().toISOString().split("T")[0]);
    setOnboardingModal(true);
  }, [data.jobs, data.branches]);

  const openFeedbackModal = useCallback((interview: Interview) => {
    setFeedbackInterview(interview);
    setFeedbackScore(interview.score || 5);
    setFeedbackNotes(interview.feedback || "");
    setFeedbackModal(true);
  }, []);

  // Form Submissions
  const handleSaveJob = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (mutations.postingJob) return;
    mutations.setPostingJob(true);

    const payload = {
      title: newJob.title.trim(),
      department: newJob.department.trim(),
      branch_id: newJob.branch_id || null,
      description: newJob.description.trim(),
      location: newJob.location.trim(),
      salary_min: Number(newJob.salary_min) || 0,
      salary_max: Number(newJob.salary_max) || 0,
      type: newJob.type,
      closing_date: newJob.closing_date || null,
    };

    if (editingJob) {
      const { error } = await supabase.from("job_postings").update(payload).eq("id", editingJob.id);
      mutations.setPostingJob(false);
      if (error) { toast("Error", "Failed to update job posting", "error"); return; }
      toast("Job updated", "Changes saved successfully.", "success");
    } else {
      const { error } = await supabase.from("job_postings").insert([{ ...payload, status: "active", requirements: [] }]);
      mutations.setPostingJob(false);
      if (error) { toast("Error", "Failed to create job posting", "error"); return; }
      toast("Job posted", "New job posting is live.", "success");
      logActivity({
        module: "hire",
        action: "created",
        entityType: "job_posting",
        actorName,
        actorRole,
        description: `New job posting: ${payload.title}`,
      });
      notify({
        source: "hire",
        type: "info",
        title: "New Job Posting",
        message: `A new job posting "${payload.title}" has been created in ${payload.department}.`,
      });
    }

    setJobModal(false);
    setEditingJob(null);
    data.loadData();
  }, [newJob, editingJob, mutations, actorName, actorRole, data]);

  const handleSaveCandidate = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    mutations.setUploadingResume(true);

    let resume_url = editingCandidate?.resume_url || null;
    let resume_name = editingCandidate?.resume_name || null;

    if (resumeFile) {
      try {
        resume_url = await uploadFileToR2(resumeFile, "candidates/resumes");
        resume_name = resumeFile.name;
      } catch (err) {
        toast("Upload failed", err instanceof Error ? err.message : "Could not upload resume", "error");
        mutations.setUploadingResume(false);
        return;
      }
    }

    const payload = {
      full_name: newCandidate.full_name.trim(),
      email: newCandidate.email.trim(),
      phone: newCandidate.phone.trim(),
      job_posting_id: newCandidate.job_posting_id,
      source: newCandidate.source.trim(),
      notes: newCandidate.notes.trim(),
      resume_url,
      resume_name,
    };

    if (editingCandidate) {
      const { error } = await supabase.from("candidates").update(payload).eq("id", editingCandidate.id);
      mutations.setUploadingResume(false);
      if (error) { toast("Error", "Failed to update candidate", "error"); return; }
      toast("Candidate updated", "Candidate profile updated.", "success");
    } else {
      const { error } = await supabase.from("candidates").insert([{ ...payload, stage: "applied", rating: null }]);
      mutations.setUploadingResume(false);
      if (error) { toast("Error", "Failed to add candidate", "error"); return; }
      toast("Candidate added", "New candidate added to applicant tracking.", "success");
      notify({
        source: "hire",
        type: "info",
        title: "New Candidate Applied",
        message: `${payload.full_name} has applied and been added to the recruitment pipeline.`,
      });
    }

    setCandidateModal(false);
    setEditingCandidate(null);
    setResumeFile(null);
    data.loadData();
  }, [newCandidate, editingCandidate, resumeFile, mutations, data]);

  const handleSaveInterview = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (mutations.schedulingInterview) return;
    mutations.setSchedulingInterview(true);

    const payload = {
      candidate_id: newInterview.candidate_id,
      scheduled_at: new Date(newInterview.scheduled_at).toISOString(),
      duration_minutes: Number(newInterview.duration_minutes) || 60,
      type: newInterview.type,
      notes: newInterview.notes.trim(),
    };

    if (editingInterview) {
      const { error } = await supabase.from("interviews").update(payload).eq("id", editingInterview.id);
      mutations.setSchedulingInterview(false);
      if (error) { toast("Error", "Failed to update interview", "error"); return; }
      toast("Interview updated", "Schedule updated.", "success");
    } else {
      const { error } = await supabase.from("interviews").insert([{ ...payload, status: "scheduled" }]);
      mutations.setSchedulingInterview(false);
      if (error) { toast("Error", "Failed to schedule interview", "error"); return; }
      toast("Interview scheduled", "Interview added to calendar.", "success");
      const candName = data.candidates.find((c) => c.id === payload.candidate_id)?.full_name || "a candidate";
      notify({
        source: "hire",
        type: "info",
        title: "Interview Scheduled",
        message: `An interview has been scheduled for ${candName} on ${new Date(newInterview.scheduled_at).toLocaleDateString()}.`,
      });
    }

    setInterviewModal(false);
    setEditingInterview(null);
    data.loadData();
  }, [newInterview, editingInterview, mutations, data]);

  return {
    actorName,
    actorRole,
    isAdmin,
    canRequest,
    canApprove,
    isChairman,
    isSuperAdmin,
    ...data,
    ...filters,
    ...mutations,
    ...requests,
    jobModal,
    setJobModal,
    editingJob,
    newJob,
    setNewJob,
    candidateModal,
    setCandidateModal,
    editingCandidate,
    newCandidate,
    setNewCandidate,
    resumeFile,
    setResumeFile,
    interviewModal,
    setInterviewModal,
    editingInterview,
    newInterview,
    setNewInterview,
    onboardingModal,
    setOnboardingModal,
    onboardingCandidate,
    onboardingBranchId,
    setOnboardingBranchId,
    onboardingJoinDate,
    setOnboardingJoinDate,
    feedbackModal,
    setFeedbackModal,
    feedbackInterview,
    feedbackScore,
    setFeedbackScore,
    feedbackNotes,
    setFeedbackNotes,
    openCreateJob,
    openEditJob,
    openCreateCandidate,
    openEditCandidate,
    openCreateInterview,
    openEditInterview,
    openMoveToOnboarding,
    openFeedbackModal,
    handleSaveJob,
    handleSaveCandidate,
    handleSaveInterview,
  };
}
