import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { logActivity } from "@/lib/audit";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { uploadFile } from "@/lib/storage";
import { Link } from "react-router-dom";

const STAGE_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; border: string; icon: string; hex: string }
> = {
  applied: {
    label: "Applied",
    bg: "bg-slate-100",
    text: "text-slate-700",
    border: "border-slate-200",
    icon: "ri-file-user-line",
    hex: "#64748B",
  },
  screening: {
    label: "Screening",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    icon: "ri-search-eye-line",
    hex: "#F59E0B",
  },
  interview: {
    label: "Interview",
    bg: "bg-sky-50",
    text: "text-sky-700",
    border: "border-sky-200",
    icon: "ri-video-chat-line",
    hex: "#0284C7",
  },
  offer: {
    label: "Offer",
    bg: "bg-indigo-50",
    text: "text-indigo-700",
    border: "border-indigo-200",
    icon: "ri-mail-send-line",
    hex: "#6366F1",
  },
  hired: {
    label: "Hired",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    icon: "ri-checkbox-circle-fill",
    hex: "#10B981",
  },
  rejected: {
    label: "Rejected",
    bg: "bg-rose-50",
    text: "text-rose-700",
    border: "border-rose-200",
    icon: "ri-close-circle-line",
    hex: "#F43F5E",
  },
};

const PIPELINE_STAGES = ["applied", "screening", "interview", "offer", "hired", "rejected"];

interface Job {
  id: string;
  title: string;
  department: string;
  branch_id: string;
  description: string;
  requirements: string[];
  location: string;
  salary_min: number;
  salary_max: number;
  type: string;
  status: string;
  posted_at: string;
  closing_date: string;
  branches?: { id: string; name: string };
}

interface Candidate {
  id: string;
  job_posting_id: string;
  full_name: string;
  email: string;
  phone: string;
  source: string;
  stage: string;
  rating: number;
  notes: string;
  applied_at: string;
  resume_url: string | null;
  resume_name: string | null;
  job_postings?: { id: string; title: string; department: string };
}

interface Interview {
  id: string;
  candidate_id: string;
  scheduled_at: string;
  duration_minutes: number;
  type: string;
  status: string;
  feedback: string;
  score: number;
  notes: string;
  candidates?: { id: string; full_name: string; job_postings?: { title: string; department?: string } };
  employees?: { id: string; first_name: string; last_name: string; avatar_url?: string };
}

const initials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();

const formatRelative = (ts: string) => {
  if (!ts) return "";
  const diff = Date.now() - new Date(ts).getTime();
  if (diff < 60000) return "just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
  return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const formatScheduleDateTime = (iso: string) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const tom = new Date();
  tom.setDate(tom.getDate() + 1);
  const isTomorrow = d.toDateString() === tom.toDateString();

  const timeStr = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  if (isToday) return `Today at ${timeStr}`;
  if (isTomorrow) return `Tomorrow at ${timeStr}`;
  return `${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })} at ${timeStr}`;
};

export default function Hire() {
  const { user } = useAuth();
  const { role, isAdmin } = usePermissions();
  const actorName = (user?.user_metadata?.display_name as string) || user?.email || "Unknown";

  const [tab, setTab] = useState<"jobs" | "candidates" | "interviews" | "pipeline">("jobs");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  // View modes
  const [jobViewMode, setJobViewMode] = useState<"grid" | "list">("grid");
  const [candidateViewMode, setCandidateViewMode] = useState<"cards" | "list">("cards");

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [filterJobStatus, setFilterJobStatus] = useState<string>("all");
  const [filterDepartment, setFilterDepartment] = useState<string>("all");
  const [filterBranch, setFilterBranch] = useState<string>("all");
  const [filterCandidateStage, setFilterCandidateStage] = useState<string>("all");
  const [filterCandidateJob, setFilterCandidateJob] = useState<string>("all");
  const [filterInterviewStatus, setFilterInterviewStatus] = useState<string>("all");

  // Modals
  const [jobModal, setJobModal] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);

  const [candidateModal, setCandidateModal] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [uploadingResume, setUploadingResume] = useState(false);

  const [interviewModal, setInterviewModal] = useState(false);
  const [editingInterview, setEditingInterview] = useState<Interview | null>(null);

  // Feedback Modal
  const [feedbackModal, setFeedbackModal] = useState(false);
  const [feedbackInterview, setFeedbackInterview] = useState<Interview | null>(null);
  const [feedbackScore, setFeedbackScore] = useState(5);
  const [feedbackNotes, setFeedbackNotes] = useState("");
  const [savingFeedback, setSavingFeedback] = useState(false);

  // Job Form State
  const [newJob, setNewJob] = useState({
    title: "",
    department: "",
    branch_id: "",
    description: "",
    location: "",
    salary_min: "",
    salary_max: "",
    type: "full-time",
    closing_date: "",
  });
  const [postingJob, setPostingJob] = useState(false);

  // Candidate Form State
  const [newCandidate, setNewCandidate] = useState({
    full_name: "",
    email: "",
    phone: "",
    job_posting_id: "",
    source: "",
    notes: "",
  });

  // Interview Form State
  const [newInterview, setNewInterview] = useState({
    candidate_id: "",
    scheduled_at: "",
    duration_minutes: "60",
    type: "video",
    notes: "",
  });
  const [schedulingInterview, setSchedulingInterview] = useState(false);

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
          .select("*, job_postings(id, title, department)")
          .is("deleted_at", null)
          .order("applied_at", { ascending: false }),
        supabase
          .from("interviews")
          .select("*, candidates(id, full_name, job_postings(title, department)), employees(id, first_name, last_name, avatar_url)")
          .is("deleted_at", null)
          .order("scheduled_at", { ascending: false }),
        supabase.from("branches").select("id, name").order("name"),
      ]);
      setJobs(j || []);
      setCandidates(c || []);
      setInterviews(i || []);
      setBranches(b || []);
    } catch (err) {
      toast("Error", "Failed to load recruitment data", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Unique departments for filter
  const departments = useMemo(() => {
    const set = new Set<string>();
    jobs.forEach((j) => j.department && set.add(j.department));
    candidates.forEach((c) => c.job_postings?.department && set.add(c.job_postings.department));
    return Array.from(set).sort();
  }, [jobs, candidates]);

  // Job Actions
  const closeJob = async (id: string) => {
    const { error } = await supabase.from("job_postings").update({ status: "closed" }).eq("id", id);
    if (error) { toast("Error", "Failed to close job posting", "error"); return; }
    toast("Job closed", "The job posting has been archived.", "success");
    loadData();
  };

  const reopenJob = async (id: string) => {
    const { error } = await supabase.from("job_postings").update({ status: "active" }).eq("id", id);
    if (error) { toast("Error", "Failed to reopen job posting", "error"); return; }
    toast("Job reopened", "The job posting is now active.", "success");
    loadData();
  };

  const deleteJob = async (id: string, title: string) => {
    if (!confirm(`Move job "${title}" to Recycle Bin? It can be restored anytime.`)) return;
    const { error } = await supabase
      .from("job_postings")
      .update({ deleted_at: new Date().toISOString(), deleted_by: actorName })
      .eq("id", id);
    if (error) { toast("Error", "Failed to delete job posting", "error"); return; }
    toast("Moved to Bin", `Job "${title}" sent to Recycle Bin.`, "success");
    loadData();
  };

  // Candidate Actions
  const updateCandidateStage = async (id: string, stage: string) => {
    const { error } = await supabase.from("candidates").update({ stage }).eq("id", id);
    if (error) { toast("Error", "Failed to update candidate stage", "error"); return; }
    toast("Stage updated", `Candidate moved to ${STAGE_CONFIG[stage]?.label || stage}.`, "success");
    loadData();
  };

  const rateCandidate = async (id: string, rating: number) => {
    const { error } = await supabase.from("candidates").update({ rating }).eq("id", id);
    if (error) { toast("Error", "Failed to save rating", "error"); return; }
    toast("Rating saved", `Candidate rated ${rating}/5.`, "success");
    loadData();
  };

  const deleteCandidate = async (id: string, name: string) => {
    if (!confirm(`Move candidate "${name}" to Recycle Bin?`)) return;
    const { error } = await supabase
      .from("candidates")
      .update({ deleted_at: new Date().toISOString(), deleted_by: actorName })
      .eq("id", id);
    if (error) { toast("Error", "Failed to delete candidate", "error"); return; }
    toast("Candidate Deleted", "Candidate sent to Recycle Bin.", "success");
    loadData();
  };

  const uploadCandidateResume = async (candidateId: string, file: File) => {
    setUploadingResume(true);
    try {
      const resume_url = await uploadFile("resumes", `${Date.now()}_${file.name}`, file);
      await supabase
        .from("candidates")
        .update({ resume_url, resume_name: file.name })
        .eq("id", candidateId);
      toast("Resume uploaded", "Resume attached successfully.", "success");
      loadData();
    } catch (err) {
      toast("Upload failed", err instanceof Error ? err.message : "Could not upload resume", "error");
    } finally {
      setUploadingResume(false);
    }
  };

  // Interview Actions
  const deleteInterview = async (id: string) => {
    if (!confirm("Move this interview to Recycle Bin?")) return;
    const { error } = await supabase
      .from("interviews")
      .update({ deleted_at: new Date().toISOString(), deleted_by: actorName })
      .eq("id", id);
    if (error) { toast("Error", "Failed to delete interview", "error"); return; }
    toast("Interview Deleted", "Interview moved to Recycle Bin.", "success");
    loadData();
  };

  const openFeedbackModal = (interview: Interview) => {
    setFeedbackInterview(interview);
    setFeedbackScore(interview.score || 5);
    setFeedbackNotes(interview.feedback || "");
    setFeedbackModal(true);
  };

  const handleSaveFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackInterview) return;
    setSavingFeedback(true);
    const { error } = await supabase
      .from("interviews")
      .update({
        feedback: feedbackNotes.trim(),
        score: feedbackScore,
        status: "completed",
      })
      .eq("id", feedbackInterview.id);
    setSavingFeedback(false);
    if (error) {
      toast("Error", "Failed to save interview feedback", "error");
      return;
    }
    toast("Feedback saved", "Interview marked as completed with score recorded.", "success");
    setFeedbackModal(false);
    setFeedbackInterview(null);
    loadData();
  };

  // Modals Open/Edit Handlers
  const openCreateJob = () => {
    setEditingJob(null);
    setNewJob({
      title: "",
      department: "",
      branch_id: branches[0]?.id || "",
      description: "",
      location: "On-site",
      salary_min: "",
      salary_max: "",
      type: "full-time",
      closing_date: "",
    });
    setJobModal(true);
  };

  const openEditJob = (job: Job) => {
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
  };

  const openCreateCandidate = (defaultJobId?: string) => {
    setEditingCandidate(null);
    setNewCandidate({
      full_name: "",
      email: "",
      phone: "",
      job_posting_id: defaultJobId || jobs[0]?.id || "",
      source: "LinkedIn",
      notes: "",
    });
    setResumeFile(null);
    setCandidateModal(true);
  };

  const openEditCandidate = (c: Candidate) => {
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
  };

  const openCreateInterview = (defaultCandidateId?: string) => {
    setEditingInterview(null);
    setNewInterview({
      candidate_id: defaultCandidateId || candidates[0]?.id || "",
      scheduled_at: "",
      duration_minutes: "60",
      type: "video",
      notes: "",
    });
    setInterviewModal(true);
  };

  const openEditInterview = (iv: Interview) => {
    setEditingInterview(iv);
    setNewInterview({
      candidate_id: iv.candidate_id,
      scheduled_at: iv.scheduled_at ? new Date(iv.scheduled_at).toISOString().slice(0, 16) : "",
      duration_minutes: String(iv.duration_minutes || 60),
      type: iv.type || "video",
      notes: iv.notes || "",
    });
    setInterviewModal(true);
  };

  // Submit Job
  const handleSaveJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (postingJob) return;
    setPostingJob(true);

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
      setPostingJob(false);
      if (error) { toast("Error", "Failed to update job posting", "error"); return; }
      toast("Job updated", "Changes saved successfully.", "success");
    } else {
      const { error } = await supabase.from("job_postings").insert([{ ...payload, status: "active", requirements: [] }]);
      setPostingJob(false);
      if (error) { toast("Error", "Failed to create job posting", "error"); return; }
      toast("Job posted", "New job posting is live.", "success");
      logActivity({
        module: "hire",
        action: "created",
        entityType: "job_posting",
        actorName,
        actorRole: role?.name || "Admin",
        description: `New job posting: ${payload.title}`,
      });
    }

    setJobModal(false);
    setEditingJob(null);
    loadData();
  };

  // Submit Candidate
  const handleSaveCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadingResume(true);

    let resume_url = editingCandidate?.resume_url || null;
    let resume_name = editingCandidate?.resume_name || null;

    if (resumeFile) {
      try {
        resume_url = await uploadFile("resumes", `${Date.now()}_${resumeFile.name}`, resumeFile);
        resume_name = resumeFile.name;
      } catch (err) {
        toast("Upload failed", err instanceof Error ? err.message : "Could not upload resume", "error");
        setUploadingResume(false);
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
      setUploadingResume(false);
      if (error) { toast("Error", "Failed to update candidate", "error"); return; }
      toast("Candidate updated", "Candidate profile updated.", "success");
    } else {
      const { error } = await supabase.from("candidates").insert([{ ...payload, stage: "applied", rating: 0 }]);
      setUploadingResume(false);
      if (error) { toast("Error", "Failed to add candidate", "error"); return; }
      toast("Candidate added", "New candidate added to applicant tracking.", "success");
    }

    setCandidateModal(false);
    setEditingCandidate(null);
    setResumeFile(null);
    loadData();
  };

  // Submit Interview
  const handleSaveInterview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (schedulingInterview) return;
    setSchedulingInterview(true);

    const payload = {
      candidate_id: newInterview.candidate_id,
      scheduled_at: new Date(newInterview.scheduled_at).toISOString(),
      duration_minutes: Number(newInterview.duration_minutes) || 60,
      type: newInterview.type,
      notes: newInterview.notes.trim(),
    };

    if (editingInterview) {
      const { error } = await supabase.from("interviews").update(payload).eq("id", editingInterview.id);
      setSchedulingInterview(false);
      if (error) { toast("Error", "Failed to update interview", "error"); return; }
      toast("Interview updated", "Schedule updated.", "success");
    } else {
      const { error } = await supabase.from("interviews").insert([{ ...payload, status: "scheduled" }]);
      setSchedulingInterview(false);
      if (error) { toast("Error", "Failed to schedule interview", "error"); return; }
      toast("Interview scheduled", "Interview added to calendar.", "success");
    }

    setInterviewModal(false);
    setEditingInterview(null);
    loadData();
  };

  // Filtered Collections
  const filteredJobs = useMemo(() => {
    return jobs.filter((j) => {
      if (filterJobStatus !== "all" && j.status !== filterJobStatus) return false;
      if (filterDepartment !== "all" && j.department !== filterDepartment) return false;
      if (filterBranch !== "all" && j.branch_id !== filterBranch) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = j.title.toLowerCase().includes(q);
        const matchDept = j.department.toLowerCase().includes(q);
        const matchLoc = (j.location || "").toLowerCase().includes(q);
        const matchBranch = (j.branches?.name || "").toLowerCase().includes(q);
        if (!matchTitle && !matchDept && !matchLoc && !matchBranch) return false;
      }
      return true;
    });
  }, [jobs, filterJobStatus, filterDepartment, filterBranch, searchQuery]);

  const filteredCandidates = useMemo(() => {
    return candidates.filter((c) => {
      if (filterCandidateStage !== "all" && c.stage !== filterCandidateStage) return false;
      if (filterCandidateJob !== "all" && c.job_posting_id !== filterCandidateJob) return false;
      if (filterDepartment !== "all" && c.job_postings?.department !== filterDepartment) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = c.full_name.toLowerCase().includes(q);
        const matchEmail = c.email.toLowerCase().includes(q);
        const matchPhone = (c.phone || "").toLowerCase().includes(q);
        const matchJob = (c.job_postings?.title || "").toLowerCase().includes(q);
        const matchSource = (c.source || "").toLowerCase().includes(q);
        if (!matchName && !matchEmail && !matchPhone && !matchJob && !matchSource) return false;
      }
      return true;
    });
  }, [candidates, filterCandidateStage, filterCandidateJob, filterDepartment, searchQuery]);

  const filteredInterviews = useMemo(() => {
    return interviews.filter((iv) => {
      if (filterInterviewStatus !== "all" && iv.status !== filterInterviewStatus) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchCand = (iv.candidates?.full_name || "").toLowerCase().includes(q);
        const matchJob = (iv.candidates?.job_postings?.title || "").toLowerCase().includes(q);
        const matchInterviewer = `${iv.employees?.first_name || ""} ${iv.employees?.last_name || ""}`.toLowerCase().includes(q);
        if (!matchCand && !matchJob && !matchInterviewer) return false;
      }
      return true;
    });
  }, [interviews, filterInterviewStatus, searchQuery]);

  // Selected Job Meta (if filtered)
  const selectedJob = useMemo(() => {
    return filterCandidateJob !== "all" ? jobs.find((j) => j.id === filterCandidateJob) : null;
  }, [jobs, filterCandidateJob]);

  // Context-aware Candidate Collection (for KPI calculations & charts)
  const scopedCandidates = useMemo(() => {
    return candidates.filter((c) => {
      if (filterCandidateJob !== "all" && c.job_posting_id !== filterCandidateJob) return false;
      if (filterDepartment !== "all" && c.job_postings?.department !== filterDepartment) return false;
      if (filterBranch !== "all" && c.job_postings?.branch_id !== filterBranch) return false;
      return true;
    });
  }, [candidates, filterCandidateJob, filterDepartment, filterBranch]);

  // Executive Metrics (Dynamic based on selected job / scope)
  const activeJobsCount = jobs.filter((j) => {
    if (filterDepartment !== "all" && j.department !== filterDepartment) return false;
    if (filterBranch !== "all" && j.branch_id !== filterBranch) return false;
    return j.status === "active";
  }).length;

  const totalCandidatesCount = scopedCandidates.length;
  const inInterviewCount = scopedCandidates.filter((c) => c.stage === "interview").length;
  const offersPendingCount = scopedCandidates.filter((c) => c.stage === "offer").length;
  const hiredCount = scopedCandidates.filter((c) => c.stage === "hired").length;
  const scheduledInterviewsCount = interviews.filter((iv) => {
    if (filterCandidateJob !== "all" && iv.candidates?.job_posting_id !== filterCandidateJob) return false;
    return iv.status === "scheduled";
  }).length;

  const pipelineChartData = useMemo(() => {
    return PIPELINE_STAGES.map((s) => ({
      stage: STAGE_CONFIG[s]?.label || s,
      count: scopedCandidates.filter((c) => c.stage === s).length,
      fill: STAGE_CONFIG[s]?.hex || "#64748B",
    }));
  }, [scopedCandidates]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8F9FB]">
        <div className="w-9 h-9 border-3 border-[#253C7D] border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-semibold text-gray-500">Loading recruitment workspace...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FB] p-5 sm:p-7 lg:p-8 font-sans">
      {/* Top Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
            <span>Talent Acquisition</span>
            <i className="ri-arrow-right-s-line text-xs" />
            <span className="text-[#253C7D] font-bold">Recruitment Hub</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2.5">
            Recruitment & Hiring
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#253C7D]/10 text-[#253C7D]">
              ATS Enterprise
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Post job openings, track candidate evaluation stages, schedule interview rounds, and manage offers.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => openCreateCandidate(filterCandidateJob !== "all" ? filterCandidateJob : undefined)}
            className="inline-flex items-center gap-1.5 bg-white border border-gray-200/90 text-gray-700 hover:bg-gray-50 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-2xs hover:shadow-xs cursor-pointer"
          >
            <i className="ri-user-add-line text-sm text-[#253C7D]" />
            Add Candidate
          </button>

          <button
            onClick={() => openCreateInterview()}
            className="inline-flex items-center gap-1.5 bg-white border border-gray-200/90 text-gray-700 hover:bg-gray-50 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-2xs hover:shadow-xs cursor-pointer"
          >
            <i className="ri-calendar-event-line text-sm text-sky-600" />
            Schedule Round
          </button>

          <button
            onClick={() => openCreateJob()}
            className="inline-flex items-center gap-2 bg-[#253C7D] hover:bg-[#1E3064] text-white px-4 py-2.5 rounded-xl text-xs sm:text-[13px] font-semibold transition-all shadow-sm hover:shadow-md cursor-pointer active:scale-98"
          >
            <i className="ri-add-line text-base font-bold" />
            Post New Job
          </button>
        </div>
      </div>

      {/* Executive KPI Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5 mb-6">
        {/* Active Jobs */}
        <div
          onClick={() => { setTab("jobs"); setFilterJobStatus("active"); setFilterCandidateJob("all"); }}
          className={`bg-white border rounded-2xl p-4 transition-all cursor-pointer shadow-2xs hover:shadow-xs relative overflow-hidden group ${
            tab === "jobs" && filterJobStatus === "active" ? "border-[#253C7D] ring-2 ring-[#253C7D]/10" : "border-gray-200/80"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Active Jobs</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-[#253C7D] flex items-center justify-center">
              <i className="ri-briefcase-line text-sm font-bold" />
            </div>
          </div>
          <p className="text-2xl font-black text-gray-900 mt-2">{activeJobsCount}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">{jobs.length} total postings</p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#253C7D]" />
        </div>

        {/* Total Candidates */}
        <div
          onClick={() => { setTab("candidates"); setFilterCandidateStage("all"); }}
          className={`bg-white border rounded-2xl p-4 transition-all cursor-pointer shadow-2xs hover:shadow-xs relative overflow-hidden group ${
            tab === "candidates" && filterCandidateStage === "all" ? "border-emerald-600 ring-2 ring-emerald-600/10" : "border-gray-200/80"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Total Applicants</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <i className="ri-user-search-line text-sm" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-700 mt-2">{totalCandidatesCount}</p>
          <p className="text-[11px] text-gray-400 mt-0.5 truncate">
            {selectedJob ? `For ${selectedJob.title}` : "Across all open roles"}
          </p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500" />
        </div>

        {/* In Interview */}
        <div
          onClick={() => { setTab("candidates"); setFilterCandidateStage("interview"); }}
          className={`bg-white border rounded-2xl p-4 transition-all cursor-pointer shadow-2xs hover:shadow-xs relative overflow-hidden group ${
            tab === "candidates" && filterCandidateStage === "interview" ? "border-sky-600 ring-2 ring-sky-600/10" : "border-gray-200/80"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-sky-600 uppercase tracking-wider">In Interview</span>
            <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
              <i className="ri-video-chat-line text-sm" />
            </div>
          </div>
          <p className="text-2xl font-black text-sky-700 mt-2">{inInterviewCount}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">{scheduledInterviewsCount} sessions booked</p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-sky-500" />
        </div>

        {/* Offers Pending */}
        <div
          onClick={() => { setTab("candidates"); setFilterCandidateStage("offer"); }}
          className={`bg-white border rounded-2xl p-4 transition-all cursor-pointer shadow-2xs hover:shadow-xs relative overflow-hidden group ${
            tab === "candidates" && filterCandidateStage === "offer" ? "border-amber-600 ring-2 ring-amber-600/10" : "border-gray-200/80"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">Offers Stage</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <i className="ri-mail-send-line text-sm" />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-700 mt-2">{offersPendingCount}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Decision pending</p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-500" />
        </div>

        {/* Hired */}
        <div
          onClick={() => { setTab("candidates"); setFilterCandidateStage("hired"); }}
          className={`bg-white border rounded-2xl p-4 transition-all cursor-pointer shadow-2xs hover:shadow-xs relative overflow-hidden group col-span-2 md:col-span-1 ${
            tab === "candidates" && filterCandidateStage === "hired" ? "border-[#253C7D] ring-2 ring-[#253C7D]/10" : "border-gray-200/80"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#253C7D] uppercase tracking-wider">Hired Onboard</span>
            <div className="w-7 h-7 rounded-lg bg-[#253C7D]/10 text-[#253C7D] flex items-center justify-center">
              <i className="ri-medal-line text-sm" />
            </div>
          </div>
          <p className="text-2xl font-black text-[#253C7D] mt-2">{hiredCount}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">
            {totalCandidatesCount > 0 ? `${Math.round((hiredCount / totalCandidatesCount) * 100)}% conversion` : "0% conversion"}
          </p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#253C7D]" />
        </div>
      </div>

      {/* Main Control Bar: Navigation Tabs, Global Search, and Filters */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-3.5 shadow-2xs mb-6 flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
        {/* Left: Section Tabs */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200/60">
            <button
              onClick={() => setTab("jobs")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                tab === "jobs" ? "bg-white text-[#253C7D] shadow-xs" : "text-gray-500 hover:text-gray-800"
              }`}
            >
              <i className="ri-briefcase-line text-sm" />
              <span>Job Openings</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold leading-none ${
                tab === "jobs" ? "bg-[#253C7D]/10 text-[#253C7D]" : "bg-gray-200 text-gray-600"
              }`}>
                {jobs.length}
              </span>
            </button>

            <button
              onClick={() => setTab("candidates")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                tab === "candidates" ? "bg-white text-[#253C7D] shadow-xs" : "text-gray-500 hover:text-gray-800"
              }`}
            >
              <i className="ri-user-line text-sm" />
              <span>Candidates</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold leading-none ${
                tab === "candidates" ? "bg-[#253C7D]/10 text-[#253C7D]" : "bg-gray-200 text-gray-600"
              }`}>
                {candidates.length}
              </span>
            </button>

            <button
              onClick={() => setTab("interviews")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                tab === "interviews" ? "bg-white text-[#253C7D] shadow-xs" : "text-gray-500 hover:text-gray-800"
              }`}
            >
              <i className="ri-calendar-check-line text-sm" />
              <span>Interviews</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold leading-none ${
                tab === "interviews" ? "bg-[#253C7D]/10 text-[#253C7D]" : "bg-gray-200 text-gray-600"
              }`}>
                {interviews.length}
              </span>
            </button>

            <button
              onClick={() => setTab("pipeline")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                tab === "pipeline" ? "bg-white text-[#253C7D] shadow-xs" : "text-gray-500 hover:text-gray-800"
              }`}
            >
              <i className="ri-flow-chart text-sm" />
              <span>Pipeline Visualizer</span>
            </button>
          </div>
        </div>

        {/* Right: Search Box, Dropdown Filters, and View Toggles */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Live Search */}
          <div className="relative w-full sm:w-60">
            <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search positions, candidates..."
              className="w-full pl-8 pr-7 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:bg-white focus:outline-none focus:border-[#253C7D] focus:ring-1 focus:ring-[#253C7D]/20 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <i className="ri-close-circle-fill text-xs" />
              </button>
            )}
          </div>

          {/* Department Filter */}
          {departments.length > 0 && (
            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 focus:outline-none focus:border-[#253C7D] cursor-pointer max-w-[140px] truncate"
            >
              <option value="all">All Departments</option>
              {departments.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          )}

          {/* Branch Filter */}
          {branches.length > 0 && (
            <select
              value={filterBranch}
              onChange={(e) => setFilterBranch(e.target.value)}
              className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 focus:outline-none focus:border-[#253C7D] cursor-pointer max-w-[130px] truncate"
            >
              <option value="all">All Branches</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          )}

          {/* Tab Specific Filters */}
          {tab === "jobs" && (
            <>
              <select
                value={filterJobStatus}
                onChange={(e) => setFilterJobStatus(e.target.value)}
                className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 focus:outline-none focus:border-[#253C7D] cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active Only</option>
                <option value="closed">Closed / Archived</option>
              </select>

              <div className="flex items-center bg-gray-100 p-0.5 rounded-lg border border-gray-200/60">
                <button
                  onClick={() => setJobViewMode("grid")}
                  title="Grid Cards"
                  className={`p-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                    jobViewMode === "grid" ? "bg-white text-[#253C7D] shadow-xs" : "text-gray-500 hover:text-gray-800"
                  }`}
                >
                  <i className="ri-layout-grid-fill" />
                </button>
                <button
                  onClick={() => setJobViewMode("list")}
                  title="Table View"
                  className={`p-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                    jobViewMode === "list" ? "bg-white text-[#253C7D] shadow-xs" : "text-gray-500 hover:text-gray-800"
                  }`}
                >
                  <i className="ri-table-line" />
                </button>
              </div>
            </>
          )}

          {tab === "candidates" && (
            <>
              {/* Job Position Filter */}
              <select
                value={filterCandidateJob}
                onChange={(e) => setFilterCandidateJob(e.target.value)}
                className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 focus:outline-none focus:border-[#253C7D] cursor-pointer max-w-[150px] sm:max-w-[180px] truncate font-medium"
              >
                <option value="all">All Job Positions</option>
                {jobs.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.title}
                  </option>
                ))}
              </select>

              <select
                value={filterCandidateStage}
                onChange={(e) => setFilterCandidateStage(e.target.value)}
                className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 focus:outline-none focus:border-[#253C7D] cursor-pointer font-medium"
              >
                <option value="all">All Stages</option>
                {PIPELINE_STAGES.map((s) => (
                  <option key={s} value={s}>{STAGE_CONFIG[s]?.label || s}</option>
                ))}
              </select>

              <div className="flex items-center bg-gray-100 p-0.5 rounded-lg border border-gray-200/60">
                <button
                  onClick={() => setCandidateViewMode("cards")}
                  title="Card View"
                  className={`p-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                    candidateViewMode === "cards" ? "bg-white text-[#253C7D] shadow-xs" : "text-gray-500 hover:text-gray-800"
                  }`}
                >
                  <i className="ri-layout-grid-fill" />
                </button>
                <button
                  onClick={() => setCandidateViewMode("list")}
                  title="List View"
                  className={`p-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                    candidateViewMode === "list" ? "bg-white text-[#253C7D] shadow-xs" : "text-gray-500 hover:text-gray-800"
                  }`}
                >
                  <i className="ri-table-line" />
                </button>
              </div>
            </>
          )}

          {tab === "interviews" && (
            <select
              value={filterInterviewStatus}
              onChange={(e) => setFilterInterviewStatus(e.target.value)}
              className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 focus:outline-none focus:border-[#253C7D] cursor-pointer"
            >
              <option value="all">All Interviews</option>
              <option value="scheduled">Scheduled</option>
              <option value="completed">Completed</option>
            </select>
          )}

          {/* Reset Filters */}
          {(searchQuery || filterJobStatus !== "all" || filterDepartment !== "all" || filterBranch !== "all" || filterCandidateStage !== "all" || filterCandidateJob !== "all" || filterInterviewStatus !== "all") && (
            <button
              onClick={() => {
                setSearchQuery("");
                setFilterJobStatus("all");
                setFilterDepartment("all");
                setFilterBranch("all");
                setFilterCandidateStage("all");
                setFilterCandidateJob("all");
                setFilterInterviewStatus("all");
              }}
              title="Reset all filters"
              className="px-2 py-1.5 text-xs text-gray-400 hover:text-rose-600 transition-colors cursor-pointer"
            >
              <i className="ri-refresh-line text-sm" />
            </button>
          )}
        </div>
      </div>

      {/* 1. JOB OPENINGS TAB */}
      {tab === "jobs" && (
        <div>
          {jobViewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredJobs.map((j) => {
                const jobCandidates = candidates.filter((c) => c.job_posting_id === j.id);
                const isActive = j.status === "active";

                return (
                  <div
                    key={j.id}
                    className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group hover:border-[#253C7D]/30"
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                            {j.department}
                          </span>
                          {j.branches?.name && (
                            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-gray-50 text-gray-600 border border-gray-200/60">
                              <i className="ri-building-line text-[10px] mr-1 text-gray-400" />
                              {j.branches.name}
                            </span>
                          )}
                        </div>

                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                            isActive
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {isActive ? "● Active" : "Closed"}
                        </span>
                      </div>

                      {/* Job Title & Location */}
                      <h3 className="text-base font-bold text-gray-900 leading-snug group-hover:text-[#253C7D] transition-colors">
                        {j.title}
                      </h3>

                      <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500 flex-wrap">
                        {j.location && (
                          <span className="flex items-center gap-1">
                            <i className="ri-map-pin-line text-gray-400" />
                            {j.location}
                          </span>
                        )}
                        <span className="flex items-center gap-1 capitalize font-medium text-gray-600">
                          <i className="ri-time-line text-gray-400" />
                          {j.type.replace("-", " ")}
                        </span>
                        {(j.salary_min > 0 || j.salary_max > 0) && (
                          <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                            <i className="ri-money-dollar-circle-line" />
                            ${j.salary_min?.toLocaleString()} - ${j.salary_max?.toLocaleString()}
                          </span>
                        )}
                      </div>

                      {j.description && (
                        <p className="text-xs text-gray-500 mt-2.5 line-clamp-2 leading-relaxed">
                          {j.description}
                        </p>
                      )}
                    </div>

                    {/* Footer Info & Actions */}
                    <div className="mt-4 pt-3.5 border-t border-gray-100 flex items-center justify-between gap-2">
                      <button
                        onClick={() => {
                          setTab("candidates");
                          setFilterCandidateJob(j.id);
                        }}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#253C7D] hover:underline cursor-pointer"
                      >
                        <i className="ri-group-line text-sm" />
                        <span>{jobCandidates.length} Candidates</span>
                      </button>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => openCreateCandidate(j.id)}
                          title="Add candidate directly to this role"
                          className="w-7 h-7 rounded-lg bg-gray-50 text-gray-600 hover:bg-[#253C7D]/10 hover:text-[#253C7D] flex items-center justify-center transition-colors cursor-pointer"
                        >
                          <i className="ri-user-add-line text-xs font-bold" />
                        </button>

                        <button
                          onClick={() => openEditJob(j)}
                          title="Edit Job Posting"
                          className="w-7 h-7 rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100 flex items-center justify-center transition-colors cursor-pointer"
                        >
                          <i className="ri-edit-line text-xs" />
                        </button>

                        <button
                          onClick={() => deleteJob(j.id, j.title)}
                          title="Move to Recycle Bin"
                          className="w-7 h-7 rounded-lg bg-gray-50 text-rose-500 hover:bg-rose-50 flex items-center justify-center transition-colors cursor-pointer"
                        >
                          <i className="ri-delete-bin-line text-xs" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {filteredJobs.length === 0 && (
                <div className="col-span-full bg-white rounded-2xl border border-gray-200/80 p-12 text-center text-gray-400">
                  <i className="ri-briefcase-line text-4xl mb-2 text-gray-300" />
                  <p className="text-sm font-semibold text-gray-600">No job openings found</p>
                  <p className="text-xs text-gray-400 mt-0.5">Try adjusting your filters or post a new vacancy.</p>
                  <button
                    onClick={openCreateJob}
                    className="mt-3 px-3.5 py-1.5 bg-[#253C7D] text-white rounded-xl text-xs font-bold cursor-pointer"
                  >
                    + Post First Job
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-200/80 shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/70 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                      <th className="px-5 py-3">Job Position</th>
                      <th className="px-5 py-3">Department</th>
                      <th className="px-5 py-3">Branch Location</th>
                      <th className="px-5 py-3">Salary Range</th>
                      <th className="px-5 py-3 text-center">Applicants</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredJobs.map((j) => {
                      const count = candidates.filter((c) => c.job_posting_id === j.id).length;
                      const isActive = j.status === "active";

                      return (
                        <tr key={j.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-5 py-3.5">
                            <p className="font-bold text-gray-900 text-sm">{j.title}</p>
                            <p className="text-[11px] text-gray-400 mt-0.5">{j.location || "On-site"} · {j.type}</p>
                          </td>
                          <td className="px-5 py-3.5 whitespace-nowrap">
                            <span className="font-semibold text-gray-700 bg-slate-100 px-2.5 py-0.5 rounded-full text-[11px]">
                              {j.department}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 whitespace-nowrap text-gray-600 font-medium">
                            {j.branches?.name || "—"}
                          </td>
                          <td className="px-5 py-3.5 whitespace-nowrap text-emerald-700 font-bold">
                            {j.salary_min || j.salary_max ? `$${j.salary_min?.toLocaleString()} - $${j.salary_max?.toLocaleString()}` : "—"}
                          </td>
                          <td className="px-5 py-3.5 text-center whitespace-nowrap">
                            <button
                              onClick={() => {
                                setTab("candidates");
                                setFilterCandidateJob(j.id);
                              }}
                              className="inline-flex items-center gap-1 font-bold text-[#253C7D] hover:underline cursor-pointer bg-blue-50 px-2 py-0.5 rounded-md"
                            >
                              <i className="ri-user-line text-xs" />
                              {count}
                            </button>
                          </td>
                          <td className="px-5 py-3.5 whitespace-nowrap">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                isActive
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : "bg-gray-100 text-gray-600"
                              }`}
                            >
                              {isActive ? "Active" : "Closed"}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => openEditJob(j)}
                                className="px-2.5 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg border border-gray-200 cursor-pointer"
                              >
                                Edit
                              </button>
                              {isActive ? (
                                <button
                                  onClick={() => closeJob(j.id)}
                                  className="px-2.5 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg border border-gray-200 cursor-pointer"
                                >
                                  Close
                                </button>
                              ) : (
                                <button
                                  onClick={() => reopenJob(j.id)}
                                  className="px-2.5 py-1 text-xs font-semibold text-white bg-[#253C7D] hover:bg-[#1E3064] rounded-lg cursor-pointer"
                                >
                                  Reopen
                                </button>
                              )}
                              <button
                                onClick={() => deleteJob(j.id, j.title)}
                                className="px-2 py-1 text-xs text-rose-500 hover:bg-rose-50 rounded-lg border border-rose-200 cursor-pointer"
                              >
                                <i className="ri-delete-bin-line" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. CANDIDATES & APPLICANTS TAB */}
      {tab === "candidates" && (
        <div>
          {/* Active Job Scope Filter Banner */}
          {filterCandidateJob !== "all" && selectedJob && (
            <div className="flex items-center justify-between gap-3 mb-4 p-3 bg-blue-50/80 border border-blue-200/80 rounded-2xl text-xs text-[#253C7D] animate-in fade-in duration-150">
              <div className="flex items-center gap-2">
                <i className="ri-filter-3-line text-sm" />
                <span>
                  Showing candidates for position: <strong className="font-bold">{selectedJob.title}</strong> ({scopedCandidates.length} applicants)
                </span>
              </div>
              <button
                type="button"
                onClick={() => setFilterCandidateJob("all")}
                className="px-2.5 py-1 bg-white hover:bg-blue-100/50 text-[#253C7D] font-bold rounded-lg border border-blue-200 transition-colors cursor-pointer text-[11px]"
              >
                Clear Job Filter
              </button>
            </div>
          )}

          {candidateViewMode === "cards" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredCandidates.map((c) => {
                const stageMeta = STAGE_CONFIG[c.stage] || STAGE_CONFIG.applied;

                return (
                  <div
                    key={c.id}
                    className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group hover:border-[#253C7D]/30"
                  >
                    <div>
                      {/* Top Header Row */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-[#253C7D]/10 text-[#253C7D] font-black text-sm flex items-center justify-center shrink-0">
                            {initials(c.full_name)}
                          </div>
                          <div className="min-w-0">
                            <Link
                              to={`/hire/candidate/${c.id}`}
                              className="text-sm font-bold text-gray-900 group-hover:text-[#253C7D] hover:underline truncate block"
                            >
                              {c.full_name}
                            </Link>
                            <p className="text-xs font-semibold text-gray-500 truncate mt-0.5">
                              {c.job_postings?.title || "General Application"}
                            </p>
                          </div>
                        </div>

                        {/* Interactive Stage Selector */}
                        <select
                          value={c.stage}
                          onChange={(e) => updateCandidateStage(c.id, e.target.value)}
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg border focus:outline-none cursor-pointer ${stageMeta.bg} ${stageMeta.text} ${stageMeta.border}`}
                        >
                          {PIPELINE_STAGES.map((s) => (
                            <option key={s} value={s}>{STAGE_CONFIG[s]?.label || s}</option>
                          ))}
                        </select>
                      </div>

                      {/* Contact & Meta Row */}
                      <div className="mt-3.5 space-y-1.5 text-xs text-gray-600">
                        <div className="flex items-center gap-2">
                          <i className="ri-mail-line text-gray-400 text-xs" />
                          <a href={`mailto:${c.email}`} className="hover:text-[#253C7D] hover:underline truncate">
                            {c.email}
                          </a>
                        </div>
                        {c.phone && (
                          <div className="flex items-center gap-2">
                            <i className="ri-phone-line text-gray-400 text-xs" />
                            <span>{c.phone}</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between text-[11px] text-gray-400 pt-1">
                          <span className="flex items-center gap-1">
                            <i className="ri-share-forward-line text-xs" />
                            Source: <strong className="text-gray-600">{c.source || "Website"}</strong>
                          </span>
                          <span>Applied {formatRelative(c.applied_at)}</span>
                        </div>
                      </div>

                      {/* Star Rating Bar */}
                      <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between">
                        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Evaluation</span>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => rateCandidate(c.id, star)}
                              className={`text-sm transition-transform hover:scale-125 cursor-pointer ${
                                star <= (c.rating || 0) ? "text-amber-400" : "text-gray-200 hover:text-amber-300"
                              }`}
                            >
                              <i className={star <= (c.rating || 0) ? "ri-star-fill" : "ri-star-line"} />
                            </button>
                          ))}
                          <span className="text-xs font-bold text-gray-700 ml-1">
                            {c.rating ? `${c.rating}/5` : "Unrated"}
                          </span>
                        </div>
                      </div>

                      {/* Resume / Document Link */}
                      <div className="mt-2.5">
                        {c.resume_url ? (
                          <a
                            href={c.resume_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#253C7D] hover:underline bg-[#253C7D]/5 px-2.5 py-1 rounded-lg w-full truncate"
                          >
                            <i className="ri-file-pdf-line text-rose-500 text-sm" />
                            <span className="truncate">{c.resume_name || "View Resume File"}</span>
                          </a>
                        ) : (
                          <div className="relative">
                            <input
                              id={`card-resume-upload-${c.id}`}
                              type="file"
                              accept=".pdf,.doc,.docx"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) uploadCandidateResume(c.id, file);
                                e.currentTarget.value = "";
                              }}
                            />
                            <label
                              htmlFor={`card-resume-upload-${c.id}`}
                              className="w-full flex items-center justify-center gap-1.5 py-1 text-xs font-semibold text-gray-500 border border-dashed border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                            >
                              <i className="ri-upload-cloud-2-line text-gray-400" />
                              Upload Resume
                            </label>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bottom Action Strip */}
                    <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                      <Link
                        to={`/hire/candidate/${c.id}`}
                        className="text-xs font-bold text-[#253C7D] hover:underline flex items-center gap-1"
                      >
                        Profile <i className="ri-arrow-right-s-line" />
                      </Link>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => openCreateInterview(c.id)}
                          className="px-2.5 py-1 text-xs font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <i className="ri-calendar-line text-xs" />
                          Interview
                        </button>
                        <button
                          onClick={() => openEditCandidate(c)}
                          className="w-7 h-7 rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100 flex items-center justify-center transition-colors cursor-pointer"
                          title="Edit Details"
                        >
                          <i className="ri-edit-line text-xs" />
                        </button>
                        <button
                          onClick={() => deleteCandidate(c.id, c.full_name)}
                          className="w-7 h-7 rounded-lg bg-gray-50 text-rose-500 hover:bg-rose-50 flex items-center justify-center transition-colors cursor-pointer"
                          title="Move to Recycle Bin"
                        >
                          <i className="ri-delete-bin-line text-xs" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {filteredCandidates.length === 0 && (
                <div className="col-span-full bg-white rounded-2xl border border-gray-200/80 p-12 text-center text-gray-400">
                  <i className="ri-user-search-line text-4xl mb-2 text-gray-300" />
                  <p className="text-sm font-semibold text-gray-600">No applicants found</p>
                  <p className="text-xs text-gray-400 mt-0.5">Try changing stage filters or search keywords.</p>
                  <button
                    onClick={() => openCreateCandidate()}
                    className="mt-3 px-3.5 py-1.5 bg-[#253C7D] text-white rounded-xl text-xs font-bold cursor-pointer"
                  >
                    + Add Candidate
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-200/80 shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-gray-200/80 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                      <th className="px-5 py-3.5">Candidate Name</th>
                      <th className="px-5 py-3.5">Applied Position</th>
                      <th className="px-5 py-3.5">Contact Details</th>
                      <th className="px-5 py-3.5">Rating</th>
                      <th className="px-5 py-3.5">Stage Status</th>
                      <th className="px-5 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredCandidates.map((c) => {
                      const stageMeta = STAGE_CONFIG[c.stage] || STAGE_CONFIG.applied;

                      return (
                        <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-5 py-3.5 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-[#253C7D]/10 text-[#253C7D] font-bold text-xs flex items-center justify-center shrink-0">
                                {initials(c.full_name)}
                              </div>
                              <div>
                                <Link
                                  to={`/hire/candidate/${c.id}`}
                                  className="font-bold text-gray-900 hover:text-[#253C7D] hover:underline"
                                >
                                  {c.full_name}
                                </Link>
                                <p className="text-[10px] text-gray-400">Source: {c.source || "Website"}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3.5 whitespace-nowrap">
                            <span className="font-semibold text-gray-800">
                              {c.job_postings?.title || "General"}
                            </span>
                            {c.job_postings?.department && (
                              <p className="text-[10px] text-gray-400">{c.job_postings.department}</p>
                            )}
                          </td>
                          <td className="px-5 py-3.5 whitespace-nowrap text-gray-600">
                            <p className="font-medium">{c.email}</p>
                            <p className="text-[10px] text-gray-400">{c.phone || "—"}</p>
                          </td>
                          <td className="px-5 py-3.5 whitespace-nowrap">
                            <div className="flex items-center gap-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  key={star}
                                  onClick={() => rateCandidate(c.id, star)}
                                  className={`text-xs cursor-pointer ${star <= (c.rating || 0) ? "text-amber-400" : "text-gray-200"}`}
                                >
                                  <i className="ri-star-fill" />
                                </button>
                              ))}
                            </div>
                          </td>
                          <td className="px-5 py-3.5 whitespace-nowrap">
                            <select
                              value={c.stage}
                              onChange={(e) => updateCandidateStage(c.id, e.target.value)}
                              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg border focus:outline-none cursor-pointer ${stageMeta.bg} ${stageMeta.text} ${stageMeta.border}`}
                            >
                              {PIPELINE_STAGES.map((s) => (
                                <option key={s} value={s}>{STAGE_CONFIG[s]?.label || s}</option>
                              ))}
                            </select>
                          </td>
                          <td className="px-5 py-3.5 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              <Link
                                to={`/hire/candidate/${c.id}`}
                                className="px-2.5 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg border border-gray-200"
                              >
                                View
                              </Link>
                              <button
                                onClick={() => openCreateInterview(c.id)}
                                className="px-2.5 py-1 text-xs font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 rounded-lg"
                              >
                                Interview
                              </button>
                              <button
                                onClick={() => openEditCandidate(c)}
                                className="px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded-lg border border-gray-200"
                              >
                                <i className="ri-edit-line" />
                              </button>
                              <button
                                onClick={() => deleteCandidate(c.id, c.full_name)}
                                className="px-2 py-1 text-xs text-rose-500 hover:bg-rose-50 rounded-lg border border-rose-200"
                              >
                                <i className="ri-delete-bin-line" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. INTERVIEWS & ROUNDS TAB */}
      {tab === "interviews" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredInterviews.map((iv) => {
              const isCompleted = iv.status === "completed";

              return (
                <div
                  key={iv.id}
                  className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  <div>
                    {/* Top Row */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200/60 capitalize flex items-center gap-1">
                        <i className={iv.type === "video" ? "ri-video-chat-line" : iv.type === "phone" ? "ri-phone-line" : "ri-building-line"} />
                        {iv.type} Interview
                      </span>

                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                          isCompleted
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-sky-50 text-sky-700 border border-sky-200"
                        }`}
                      >
                        {isCompleted ? "Completed" : "Scheduled"}
                      </span>
                    </div>

                    {/* Candidate & Position */}
                    <h3 className="text-base font-bold text-gray-900">
                      {iv.candidates?.full_name || "Candidate"}
                    </h3>
                    <p className="text-xs font-semibold text-gray-500 mt-0.5">
                      Applying for: {iv.candidates?.job_postings?.title || "Open Role"}
                    </p>

                    {/* Scheduled Time & Details */}
                    <div className="mt-3.5 p-3 rounded-xl bg-slate-50 border border-gray-100 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400 font-semibold">Scheduled Date:</span>
                        <span className="font-bold text-gray-900">{formatScheduleDateTime(iv.scheduled_at)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400 font-semibold">Duration:</span>
                        <span className="font-semibold text-gray-700">{iv.duration_minutes} minutes</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400 font-semibold">Interviewer:</span>
                        <span className="font-semibold text-gray-700">
                          {iv.employees ? `${iv.employees.first_name} ${iv.employees.last_name}` : "Assigned Team"}
                        </span>
                      </div>
                    </div>

                    {/* Feedback / Notes Preview */}
                    {iv.feedback && (
                      <div className="mt-3 p-3 rounded-xl bg-emerald-50/50 border border-emerald-100 text-xs">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-emerald-800">Feedback Recorded</span>
                          <span className="font-black text-amber-600">{iv.score}/5 Stars</span>
                        </div>
                        <p className="text-gray-600 italic line-clamp-2">"{iv.feedback}"</p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="mt-4 pt-3.5 border-t border-gray-100 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      {!isCompleted ? (
                        <button
                          onClick={() => openFeedbackModal(iv)}
                          className="px-3 py-1.5 bg-[#253C7D] hover:bg-[#1E3064] text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                        >
                          <i className="ri-checkbox-circle-line" />
                          Record Feedback
                        </button>
                      ) : (
                        <button
                          onClick={() => openFeedbackModal(iv)}
                          className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1"
                        >
                          <i className="ri-edit-line" />
                          Update Feedback
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => openEditInterview(iv)}
                        className="w-8 h-8 rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100 flex items-center justify-center transition-colors cursor-pointer"
                        title="Edit Schedule"
                      >
                        <i className="ri-edit-line text-xs" />
                      </button>
                      <button
                        onClick={() => deleteInterview(iv.id)}
                        className="w-8 h-8 rounded-lg bg-gray-50 text-rose-500 hover:bg-rose-50 flex items-center justify-center transition-colors cursor-pointer"
                        title="Move to Recycle Bin"
                      >
                        <i className="ri-delete-bin-line text-xs" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredInterviews.length === 0 && (
              <div className="col-span-full bg-white rounded-2xl border border-gray-200/80 p-12 text-center text-gray-400">
                <i className="ri-calendar-line text-4xl mb-2 text-gray-300" />
                <p className="text-sm font-semibold text-gray-600">No interviews scheduled</p>
                <p className="text-xs text-gray-400 mt-0.5">Book an evaluation round with any candidate.</p>
                <button
                  onClick={() => openCreateInterview()}
                  className="mt-3 px-3.5 py-1.5 bg-[#253C7D] text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  + Schedule Interview
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. PIPELINE VISUALIZER TAB */}
      {tab === "pipeline" && (
        <div className="space-y-6">
          {/* Funnel Progress Stepper */}
          <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-2xs">
            <h3 className="text-sm font-bold text-gray-900 mb-4">Hiring Funnel Progression</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {PIPELINE_STAGES.map((s, idx) => {
                const count = candidates.filter((c) => c.stage === s).length;
                const meta = STAGE_CONFIG[s];

                return (
                  <div
                    key={s}
                    onClick={() => {
                      setTab("candidates");
                      setFilterCandidateStage(s);
                    }}
                    className={`rounded-2xl p-4 border transition-all cursor-pointer relative overflow-hidden group hover:shadow-xs ${meta.bg} ${meta.border}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-500">
                        Step {idx + 1}
                      </span>
                      <i className={`${meta.icon} ${meta.text} text-sm font-bold`} />
                    </div>
                    <p className={`text-2xl font-black ${meta.text}`}>{count}</p>
                    <p className="text-xs font-bold text-gray-800 mt-0.5">{meta.label}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      {totalCandidatesCount > 0 ? `${Math.round((count / totalCandidatesCount) * 100)}% of total` : "0%"}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bar Chart Visualization */}
          <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-2xs">
            <h3 className="text-sm font-bold text-gray-900 mb-1">Stage Distribution Analytics</h3>
            <p className="text-xs text-gray-500 mb-6">Real-time candidate count across all hiring pipeline stages.</p>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pipelineChartData} barGap={8}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="stage" tick={{ fontSize: 12, fill: "#64748B", fontWeight: 600 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    cursor={{ fill: "#f8fafc" }}
                    contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.08)", fontSize: "12px", fontWeight: "bold" }}
                  />
                  <Bar dataKey="count" radius={[8, 8, 0, 0]} maxBarSize={54}>
                    {pipelineChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DIALOG MODALS                                                             */}
      {/* ========================================================================= */}

      {/* 1. JOB MODAL (POST / EDIT) */}
      {jobModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/40 backdrop-blur-xs overflow-y-auto no-scrollbar"
          onClick={() => !postingJob && setJobModal(false)}
        >
          <div
            className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-gray-100/80 overflow-hidden max-h-[92vh] flex flex-col animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 bg-white flex items-center justify-between gap-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#253C7D]/10 text-[#253C7D] flex items-center justify-center font-bold text-sm">
                  <i className={editingJob ? "ri-edit-line" : "ri-briefcase-line"} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">
                    {editingJob ? "Edit Job Posting" : "Post New Job Opening"}
                  </h3>
                  <p className="text-[11px] text-gray-400 mt-0.5">Fill in vacancy information and requirements</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setJobModal(false)}
                className="w-8 h-8 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 flex items-center justify-center transition-colors cursor-pointer"
              >
                <i className="ri-close-line text-lg" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveJob} className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4 no-scrollbar">
              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                  Job Position Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newJob.title}
                  onChange={(e) => setNewJob({ ...newJob, title: e.target.value })}
                  placeholder="e.g. Senior Frontend Developer"
                  className="w-full px-3.5 py-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D] focus:ring-2 focus:ring-[#253C7D]/10 transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                    Department <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newJob.department}
                    onChange={(e) => setNewJob({ ...newJob, department: e.target.value })}
                    placeholder="e.g. Engineering, Sales"
                    className="w-full px-3.5 py-2 bg-gray-50/70 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                    Branch / Location
                  </label>
                  <select
                    value={newJob.branch_id}
                    onChange={(e) => setNewJob({ ...newJob, branch_id: e.target.value })}
                    className="w-full px-3.5 py-2 bg-gray-50/70 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D]"
                  >
                    <option value="">No Branch Specified</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                  Job Description
                </label>
                <textarea
                  value={newJob.description}
                  onChange={(e) => setNewJob({ ...newJob, description: e.target.value })}
                  rows={3}
                  placeholder="Outline key responsibilities, role expectations, and prerequisites..."
                  className="w-full px-3.5 py-2 bg-gray-50/70 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D] leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                    Salary Min ($)
                  </label>
                  <input
                    type="number"
                    value={newJob.salary_min}
                    onChange={(e) => setNewJob({ ...newJob, salary_min: e.target.value })}
                    placeholder="e.g. 1500"
                    className="w-full px-3.5 py-2 bg-gray-50/70 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                    Salary Max ($)
                  </label>
                  <input
                    type="number"
                    value={newJob.salary_max}
                    onChange={(e) => setNewJob({ ...newJob, salary_max: e.target.value })}
                    placeholder="e.g. 2500"
                    className="w-full px-3.5 py-2 bg-gray-50/70 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                    Employment Type
                  </label>
                  <select
                    value={newJob.type}
                    onChange={(e) => setNewJob({ ...newJob, type: e.target.value })}
                    className="w-full px-3.5 py-2 bg-gray-50/70 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D]"
                  >
                    <option value="full-time">Full-Time</option>
                    <option value="part-time">Part-Time</option>
                    <option value="contract">Contract</option>
                    <option value="internship">Internship</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                    Closing Date
                  </label>
                  <input
                    type="date"
                    value={newJob.closing_date}
                    onChange={(e) => setNewJob({ ...newJob, closing_date: e.target.value })}
                    className="w-full px-3.5 py-2 bg-gray-50/70 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D]"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setJobModal(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={postingJob}
                  className="px-5 py-2 bg-[#253C7D] hover:bg-[#1E3064] text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer disabled:opacity-60"
                >
                  {postingJob ? "Saving..." : editingJob ? "Save Changes" : "Post Job"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. CANDIDATE MODAL (ADD / EDIT) */}
      {candidateModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/40 backdrop-blur-xs overflow-y-auto no-scrollbar"
          onClick={() => !uploadingResume && setCandidateModal(false)}
        >
          <div
            className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-gray-100/80 overflow-hidden max-h-[92vh] flex flex-col animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-gray-100 bg-white flex items-center justify-between gap-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-sm">
                  <i className={editingCandidate ? "ri-edit-line" : "ri-user-add-line"} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">
                    {editingCandidate ? "Edit Candidate Profile" : "Add New Candidate"}
                  </h3>
                  <p className="text-[11px] text-gray-400 mt-0.5">Applicant tracking & contact info</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setCandidateModal(false)}
                className="w-8 h-8 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 flex items-center justify-center transition-colors cursor-pointer"
              >
                <i className="ri-close-line text-lg" />
              </button>
            </div>

            <form onSubmit={handleSaveCandidate} className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4 no-scrollbar">
              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newCandidate.full_name}
                  onChange={(e) => setNewCandidate({ ...newCandidate, full_name: e.target.value })}
                  placeholder="e.g. Sophy Seng"
                  className="w-full px-3.5 py-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={newCandidate.email}
                    onChange={(e) => setNewCandidate({ ...newCandidate, email: e.target.value })}
                    placeholder="candidate@gmail.com"
                    className="w-full px-3.5 py-2 bg-gray-50/70 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={newCandidate.phone}
                    onChange={(e) => setNewCandidate({ ...newCandidate, phone: e.target.value })}
                    placeholder="+855 12 345 678"
                    className="w-full px-3.5 py-2 bg-gray-50/70 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                    Applied Position <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={newCandidate.job_posting_id}
                    onChange={(e) => setNewCandidate({ ...newCandidate, job_posting_id: e.target.value })}
                    className="w-full px-3.5 py-2 bg-gray-50/70 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D]"
                  >
                    <option value="">Select Job Opening</option>
                    {jobs.map((j) => (
                      <option key={j.id} value={j.id}>{j.title} ({j.department})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                    Application Source
                  </label>
                  <input
                    type="text"
                    value={newCandidate.source}
                    onChange={(e) => setNewCandidate({ ...newCandidate, source: e.target.value })}
                    placeholder="e.g. LinkedIn, Referral, Telegram"
                    className="w-full px-3.5 py-2 bg-gray-50/70 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                  Internal Notes & Highlights
                </label>
                <textarea
                  value={newCandidate.notes}
                  onChange={(e) => setNewCandidate({ ...newCandidate, notes: e.target.value })}
                  rows={2}
                  placeholder="Candidate strengths, experience notes, or compensation expectations..."
                  className="w-full px-3.5 py-2 bg-gray-50/70 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D]"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                  Resume / CV Attachment
                </label>
                <div className="relative">
                  <input
                    type="file"
                    id="modal-candidate-resume"
                    accept=".pdf,.doc,.docx"
                    className="hidden"
                    onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                  />
                  <label
                    htmlFor="modal-candidate-resume"
                    className="flex items-center gap-2 w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <i className="ri-upload-cloud-2-line text-gray-400 text-base" />
                    <span className="text-gray-600 truncate">
                      {resumeFile ? resumeFile.name : editingCandidate?.resume_name || "Upload PDF or DOCX file"}
                    </span>
                  </label>
                  {resumeFile && (
                    <button
                      type="button"
                      onClick={() => setResumeFile(null)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-rose-500 cursor-pointer"
                    >
                      <i className="ri-close-line text-base" />
                    </button>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setCandidateModal(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploadingResume}
                  className="px-5 py-2 bg-[#253C7D] hover:bg-[#1E3064] text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer disabled:opacity-60"
                >
                  {uploadingResume ? "Saving..." : editingCandidate ? "Save Changes" : "Add Candidate"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. INTERVIEW MODAL (SCHEDULE / EDIT) */}
      {interviewModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/40 backdrop-blur-xs overflow-y-auto no-scrollbar"
          onClick={() => !schedulingInterview && setInterviewModal(false)}
        >
          <div
            className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-gray-100/80 overflow-hidden max-h-[92vh] flex flex-col animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-gray-100 bg-white flex items-center justify-between gap-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center font-bold text-sm">
                  <i className="ri-calendar-event-line" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">
                    {editingInterview ? "Edit Interview Session" : "Schedule Interview Round"}
                  </h3>
                  <p className="text-[11px] text-gray-400 mt-0.5">Select candidate, time, and session format</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setInterviewModal(false)}
                className="w-8 h-8 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 flex items-center justify-center transition-colors cursor-pointer"
              >
                <i className="ri-close-line text-lg" />
              </button>
            </div>

            <form onSubmit={handleSaveInterview} className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4 no-scrollbar">
              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                  Select Candidate <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={newInterview.candidate_id}
                  onChange={(e) => setNewInterview({ ...newInterview, candidate_id: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D]"
                >
                  <option value="">Choose candidate...</option>
                  {candidates.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.full_name} — {c.job_postings?.title || "Role"}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                    Date & Time <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={newInterview.scheduled_at}
                    onChange={(e) => setNewInterview({ ...newInterview, scheduled_at: e.target.value })}
                    className="w-full px-3.5 py-2 bg-gray-50/70 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                    Duration
                  </label>
                  <select
                    value={newInterview.duration_minutes}
                    onChange={(e) => setNewInterview({ ...newInterview, duration_minutes: e.target.value })}
                    className="w-full px-3.5 py-2 bg-gray-50/70 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D]"
                  >
                    <option value="30">30 minutes</option>
                    <option value="45">45 minutes</option>
                    <option value="60">1 hour (60 min)</option>
                    <option value="90">1.5 hours</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                  Interview Format
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: "video", label: "Video Call", icon: "ri-video-chat-line" },
                    { key: "in-person", label: "In Person", icon: "ri-building-line" },
                    { key: "phone", label: "Phone Call", icon: "ri-phone-line" },
                  ].map((fmt) => (
                    <button
                      key={fmt.key}
                      type="button"
                      onClick={() => setNewInterview({ ...newInterview, type: fmt.key })}
                      className={`py-2 px-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        newInterview.type === fmt.key
                          ? "bg-[#253C7D] text-white border-[#253C7D] shadow-xs"
                          : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      <i className={fmt.icon} />
                      {fmt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                  Agenda / Meeting Link
                </label>
                <textarea
                  value={newInterview.notes}
                  onChange={(e) => setNewInterview({ ...newInterview, notes: e.target.value })}
                  rows={2}
                  placeholder="Google Meet / Zoom link, interview questions, or topics to cover..."
                  className="w-full px-3.5 py-2 bg-gray-50/70 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D]"
                />
              </div>

              <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setInterviewModal(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={schedulingInterview}
                  className="px-5 py-2 bg-[#253C7D] hover:bg-[#1E3064] text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer disabled:opacity-60"
                >
                  {schedulingInterview ? "Scheduling..." : editingInterview ? "Save Changes" : "Confirm Schedule"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. FEEDBACK MODAL (RECORD EVALUATION) */}
      {feedbackModal && feedbackInterview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/40 backdrop-blur-xs overflow-y-auto no-scrollbar"
          onClick={() => !savingFeedback && setFeedbackModal(false)}
        >
          <div
            className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-gray-100/80 overflow-hidden flex flex-col animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-gray-100 bg-white flex items-center justify-between gap-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-sm">
                  <i className="ri-checkbox-circle-line" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Record Interview Feedback</h3>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    {feedbackInterview.candidates?.full_name}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setFeedbackModal(false)}
                className="w-8 h-8 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 flex items-center justify-center transition-colors cursor-pointer"
              >
                <i className="ri-close-line text-lg" />
              </button>
            </div>

            <form onSubmit={handleSaveFeedback} className="p-5 sm:p-6 space-y-4">
              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-2">
                  Performance Score (1 - 5 Stars)
                </label>
                <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-2xl border border-gray-200/60 justify-center">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setFeedbackScore(s)}
                      className={`text-2xl transition-transform hover:scale-125 cursor-pointer ${
                        s <= feedbackScore ? "text-amber-400" : "text-gray-300"
                      }`}
                    >
                      <i className="ri-star-fill" />
                    </button>
                  ))}
                  <span className="text-sm font-black text-gray-800 ml-2">{feedbackScore} / 5</span>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                  Interview Notes & Evaluation Remarks
                </label>
                <textarea
                  required
                  rows={4}
                  value={feedbackNotes}
                  onChange={(e) => setFeedbackNotes(e.target.value)}
                  placeholder="Summarize candidate communication, technical competency, role fit, and next step recommendation..."
                  className="w-full px-3.5 py-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D]"
                />
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setFeedbackModal(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingFeedback}
                  className="px-5 py-2 bg-[#253C7D] hover:bg-[#1E3064] text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer disabled:opacity-60"
                >
                  {savingFeedback ? "Saving..." : "Save & Complete"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}