import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { logActivity } from "@/lib/audit";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { uploadFile } from "@/lib/storage";
import { Link } from "react-router-dom";

const stageLabels: Record<string, string> = {
  applied: "Applied",
  screening: "Screening",
  interview: "Interview",
  offer: "Offer",
  hired: "Hired",
  rejected: "Rejected",
};

const stageColors: Record<string, string> = {
  applied: "bg-gray-100 text-gray-600",
  screening: "bg-amber-50 text-amber-700",
  interview: "bg-blue-50 text-blue-700",
  offer: "bg-emerald-50 text-emerald-700",
  hired: "bg-[#253C7D] text-white",
  rejected: "bg-red-50 text-red-600",
};

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
  branches?: { name: string };
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
  job_postings?: { title: string; department: string };
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
  candidates?: { full_name: string; job_postings?: { title: string } };
  employees?: { first_name: string; last_name: string };
}

export default function Hire() {
  const { user } = useAuth();
  const { role } = usePermissions();
  const actorName = (user?.user_metadata?.display_name as string) || user?.email || "Unknown";
  const [tab, setTab] = useState("jobs");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [jobModal, setJobModal] = useState(false);
  const [candidateModal, setCandidateModal] = useState(false);
  const [interviewModal, setInterviewModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterStage, setFilterStage] = useState("all");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [{ data: j }, { data: c }, { data: i }, { data: b }] = await Promise.all([
      supabase.from("job_postings").select("*, branches(name)").is("deleted_at", null).order("posted_at", { ascending: false }),
      supabase.from("candidates").select("*, job_postings(title, department)").is("deleted_at", null).order("applied_at", { ascending: false }),
      supabase.from("interviews").select("*, candidates(full_name, job_postings(title)), employees(first_name, last_name)").is("deleted_at", null).order("scheduled_at", { ascending: false }),
      supabase.from("branches").select("id, name"),
    ]);
    setJobs(j || []);
    setCandidates(c || []);
    setInterviews(i || []);
    setBranches(b || []);
    setLoading(false);
  };

  const closeJob = async (id: string) => {
    const { error } = await supabase.from("job_postings").update({ status: "closed" }).eq("id", id);
    if (error) { toast("Error", "Failed to close job posting", "error"); return; }
    toast("Job closed", "The job posting has been closed successfully.", "success");
    loadData();
  };

  const reopenJob = async (id: string) => {
    const { error } = await supabase.from("job_postings").update({ status: "active" }).eq("id", id);
    if (error) { toast("Error", "Failed to reopen job posting", "error"); return; }
    toast("Job reopened", "The job posting is now active.", "success");
    loadData();
  };

  const updateCandidateStage = async (id: string, stage: string) => {
    const { error } = await supabase.from("candidates").update({ stage }).eq("id", id);
    if (error) { toast("Error", "Failed to update candidate stage", "error"); return; }
    toast("Stage updated", `Candidate moved to ${stageLabels[stage]}.`, "success");
    loadData();
  };

  const rateCandidate = async (id: string, rating: number) => {
    const { error } = await supabase.from("candidates").update({ rating }).eq("id", id);
    if (error) { toast("Error", "Failed to save rating", "error"); return; }
    toast("Rating saved", `Candidate rated ${rating}/5.`, "success");
    loadData();
  };

  const submitInterviewFeedback = async (id: string, feedback: string, score: number) => {
    const { error } = await supabase.from("interviews").update({ feedback, score, status: "completed" }).eq("id", id);
    if (error) { toast("Error", "Failed to save interview feedback", "error"); return; }
    toast("Feedback saved", "Interview feedback recorded.", "success");
    loadData();
  };

  // Delete functions (soft delete — items go to the Recycle Bin)
  const deleteJob = async (id: string, title: string) => {
    if (!confirm(`Delete job posting "${title}"? It will be moved to the Recycle Bin and can be restored later.`)) return;
    const { error } = await supabase
      .from("job_postings")
      .update({ deleted_at: new Date().toISOString(), deleted_by: actorName })
      .eq("id", id);
    if (error) { toast("Error", "Failed to delete job posting", "error"); return; }
    toast("Deleted", "Job posting moved to Recycle Bin.", "success");
    loadData();
  };

  const deleteCandidate = async (id: string, name: string) => {
    if (!confirm(`Delete candidate "${name}"? It will be moved to the Recycle Bin and can be restored later.`)) return;
    const { error } = await supabase
      .from("candidates")
      .update({ deleted_at: new Date().toISOString(), deleted_by: actorName })
      .eq("id", id);
    if (error) { toast("Error", "Failed to delete candidate", "error"); return; }
    toast("Deleted", "Candidate moved to Recycle Bin.", "success");
    loadData();
  };

  const deleteInterview = async (id: string) => {
    if (!confirm("Delete this interview? It will be moved to the Recycle Bin and can be restored later.")) return;
    const { error } = await supabase
      .from("interviews")
      .update({ deleted_at: new Date().toISOString(), deleted_by: actorName })
      .eq("id", id);
    if (error) { toast("Error", "Failed to delete interview", "error"); return; }
    toast("Deleted", "Interview moved to Recycle Bin.", "success");
    loadData();
  };

  // Edit state
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null);
  const [editingInterview, setEditingInterview] = useState<Interview | null>(null);

  const openEditJob = (job: Job) => {
    setEditingJob(job);
    setNewJob({
      title: job.title,
      department: job.department,
      branch_id: job.branch_id,
      description: job.description,
      location: job.location,
      salary_min: String(job.salary_min || ""),
      salary_max: String(job.salary_max || ""),
      type: job.type,
      closing_date: job.closing_date || "",
    });
    setJobModal(true);
  };

  const openEditCandidate = (candidate: Candidate) => {
    setEditingCandidate(candidate);
    setNewCandidate({
      full_name: candidate.full_name,
      email: candidate.email,
      phone: candidate.phone,
      job_posting_id: candidate.job_posting_id,
      source: candidate.source,
      notes: candidate.notes || "",
    });
    setCandidateModal(true);
  };

  const openEditInterview = (interview: Interview) => {
    setEditingInterview(interview);
    setNewInterview({
      candidate_id: interview.candidate_id,
      scheduled_at: interview.scheduled_at ? new Date(interview.scheduled_at).toISOString().slice(0, 16) : "",
      duration_minutes: String(interview.duration_minutes || 60),
      type: interview.type,
      notes: interview.notes || "",
    });
    setInterviewModal(true);
  };

  const updateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingJob) return;
    const { error } = await supabase.from("job_postings").update({
      title: newJob.title,
      department: newJob.department,
      branch_id: newJob.branch_id,
      description: newJob.description,
      location: newJob.location,
      salary_min: Number(newJob.salary_min) || 0,
      salary_max: Number(newJob.salary_max) || 0,
      type: newJob.type,
      closing_date: newJob.closing_date,
    }).eq("id", editingJob.id);
    if (error) { toast("Error", "Failed to update job posting", "error"); return; }
    toast("Updated", "Job posting updated.", "success");
    setJobModal(false);
    setEditingJob(null);
    setNewJob({ title: "", department: "", branch_id: "", description: "", location: "", salary_min: "", salary_max: "", type: "full-time", closing_date: "" });
    loadData();
  };

  const updateCandidateInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCandidate) return;
    const { error } = await supabase.from("candidates").update({
      full_name: newCandidate.full_name,
      email: newCandidate.email,
      phone: newCandidate.phone,
      job_posting_id: newCandidate.job_posting_id,
      source: newCandidate.source,
      notes: newCandidate.notes,
    }).eq("id", editingCandidate.id);
    if (error) { toast("Error", "Failed to update candidate", "error"); return; }
    toast("Updated", "Candidate info updated.", "success");
    setCandidateModal(false);
    setEditingCandidate(null);
    setNewCandidate({ full_name: "", email: "", phone: "", job_posting_id: "", source: "", notes: "" });
    loadData();
  };

  const updateInterviewInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInterview) return;
    const { error } = await supabase.from("interviews").update({
      candidate_id: newInterview.candidate_id,
      scheduled_at: new Date(newInterview.scheduled_at).toISOString(),
      duration_minutes: Number(newInterview.duration_minutes),
      type: newInterview.type,
      notes: newInterview.notes,
    }).eq("id", editingInterview.id);
    if (error) { toast("Error", "Failed to update interview", "error"); return; }
    toast("Updated", "Interview updated.", "success");
    setInterviewModal(false);
    setEditingInterview(null);
    setNewInterview({ candidate_id: "", scheduled_at: "", duration_minutes: "60", type: "video", notes: "" });
    loadData();
  };

  // Job posting form
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

  const createJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (postingJob) return;
    setPostingJob(true);
    const { error } = await supabase.from("job_postings").insert([{
      title: newJob.title,
      department: newJob.department,
      branch_id: newJob.branch_id,
      description: newJob.description,
      location: newJob.location,
      salary_min: Number(newJob.salary_min) || 0,
      salary_max: Number(newJob.salary_max) || 0,
      type: newJob.type,
      closing_date: newJob.closing_date,
      requirements: [],
      status: "active",
    }]);
    setPostingJob(false);
    if (error) { toast("Error", "Failed to create job posting", "error"); return; }
    setJobModal(false);
    setNewJob({ title: "", department: "", branch_id: "", description: "", location: "", salary_min: "", salary_max: "", type: "full-time", closing_date: "" });
    toast("Job posted", "New job posting is now live.", "success");
    logActivity({ module: "hire", action: "created", entityType: "job_posting", actorName, actorRole: role?.name || "Unknown", description: `New job posting created for ${newJob.title}` });
    loadData();
  };

  // Candidate form
  const [newCandidate, setNewCandidate] = useState({
    full_name: "",
    email: "",
    phone: "",
    job_posting_id: "",
    source: "",
    notes: "",
  });
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [uploadingResume, setUploadingResume] = useState(false);

  const addCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadingResume(true);
    let resume_url = null;
    let resume_name = null;
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
    const { error } = await supabase.from("candidates").insert([{
      full_name: newCandidate.full_name,
      email: newCandidate.email,
      phone: newCandidate.phone,
      job_posting_id: newCandidate.job_posting_id,
      source: newCandidate.source,
      notes: newCandidate.notes,
      stage: "applied",
      resume_url,
      resume_name,
    }]);
    setUploadingResume(false);
    if (error) { toast("Error", "Failed to add candidate", "error"); return; }
    setCandidateModal(false);
    setNewCandidate({ full_name: "", email: "", phone: "", job_posting_id: "", source: "", notes: "" });
    setResumeFile(null);
    toast("Candidate added", "New candidate added to the pipeline.", "success");
    loadData();
  };

  const uploadCandidateResume = async (candidateId: string, file: File) => {
    setUploadingResume(true);
    try {
      const resume_url = await uploadFile("resumes", `${Date.now()}_${file.name}`, file);
      await supabase.from("candidates").update({ resume_url, resume_name: file.name }).eq("id", candidateId);
      setUploadingResume(false);
      toast("Resume uploaded", "Candidate resume saved to Firebase Storage.", "success");
      loadData();
    } catch (err) {
      setUploadingResume(false);
      toast("Upload failed", err instanceof Error ? err.message : "Could not upload resume", "error");
    }
  };

  // Interview form
  const [newInterview, setNewInterview] = useState({
    candidate_id: "",
    scheduled_at: "",
    duration_minutes: "60",
    type: "video",
    notes: "",
  });

  const [schedulingInterview, setSchedulingInterview] = useState(false);

  const scheduleInterview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (schedulingInterview) return;
    setSchedulingInterview(true);
    const { error } = await supabase.from("interviews").insert([{
      candidate_id: newInterview.candidate_id,
      scheduled_at: new Date(newInterview.scheduled_at).toISOString(),
      duration_minutes: Number(newInterview.duration_minutes),
      type: newInterview.type,
      notes: newInterview.notes,
      status: "scheduled",
    }]);
    setSchedulingInterview(false);
    if (error) { toast("Error", "Failed to schedule interview", "error"); return; }
    setInterviewModal(false);
    setNewInterview({ candidate_id: "", scheduled_at: "", duration_minutes: "60", type: "video", notes: "" });
    toast("Interview scheduled", "Interview added to the calendar.", "success");
    loadData();
  };

  // Stats
  const activeJobs = jobs.filter((j) => j.status === "active").length;
  const totalCandidates = candidates.length;
  const pipelineStages = ["applied", "screening", "interview", "offer", "hired", "rejected"];
  const pipelineData = pipelineStages.map((s) => ({
    stage: stageLabels[s],
    count: candidates.filter((c) => c.stage === s).length,
    fill: ["#74C8EC", "#FBBF24", "#60A5FA", "#34D399", "#253C7D", "#F87171"][pipelineStages.indexOf(s)],
  }));

  const filteredJobs = filterStatus === "all" ? jobs : jobs.filter((j) => j.status === filterStatus);
  const filteredCandidates = filterStage === "all" ? candidates : candidates.filter((c) => c.stage === filterStage);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-10 h-10 border-2 border-[#253C7D] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-10 min-h-screen bg-white">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#1A1A1A]">Recruitment & Hiring</h1>
          <p className="text-[13px] text-gray-500 mt-1">Post jobs, track applicants, and manage the entire hiring pipeline</p>
        </div>
        <button
          onClick={() => setJobModal(true)}
          className="inline-flex items-center gap-2 bg-[#253C7D] text-white px-5 py-2.5 rounded-lg text-[13px] font-semibold hover:bg-[#1F336A] transition-colors whitespace-nowrap"
        >
          <i className="ri-add-line" />
          Post New Job
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Active Jobs", value: activeJobs, icon: "ri-briefcase-line", color: "text-[#253C7D]" },
          { label: "Total Candidates", value: totalCandidates, icon: "ri-user-line", color: "text-emerald-600" },
          { label: "In Interview", value: candidates.filter((c) => c.stage === "interview").length, icon: "ri-video-chat-line", color: "text-blue-600" },
          { label: "Offers Pending", value: candidates.filter((c) => c.stage === "offer").length, icon: "ri-mail-send-line", color: "text-amber-600" },
        ].map((s) => (
          <div key={s.label} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <i className={`${s.icon} ${s.color} text-lg mb-2 block`} />
            <p className="text-xl font-bold text-gray-900">{s.value}</p>
            <p className="text-[11px] text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {["jobs", "candidates", "interviews", "pipeline"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-full text-[12px] font-medium capitalize transition-colors whitespace-nowrap ${
              tab === t ? "bg-[#253C7D] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {t === "pipeline" ? "Hiring Pipeline" : t}
          </button>
        ))}
      </div>

      {/* Jobs Tab */}
      {tab === "jobs" && (
        <div>
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="text-[12px] text-gray-500 font-medium">Filter:</span>
            {["all", "active", "interviewing", "closed"].map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`text-[11px] font-medium px-3 py-1 rounded-full transition-colors ${
                  filterStatus === s ? "bg-[#253C7D] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
          <div className="border border-gray-100 rounded-xl overflow-hidden">
            <div className="grid grid-cols-12 bg-gray-50 px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
              <span className="col-span-3">Position</span>
              <span className="col-span-2">Department</span>
              <span className="col-span-2">Branch</span>
              <span className="col-span-2">Salary Range</span>
              <span className="col-span-1">Status</span>
              <span className="col-span-2 text-right">Actions</span>
            </div>
            {filteredJobs.map((j) => (
              <div key={j.id} className="grid grid-cols-12 px-5 py-4 border-t border-gray-50 items-center hover:bg-gray-50/50 transition-colors">
                <div className="col-span-3">
                  <p className="text-[13px] font-semibold text-gray-900">{j.title}</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">{j.location}</p>
                </div>
                <span className="col-span-2 text-[13px] text-gray-600">{j.department}</span>
                <span className="col-span-2 text-[13px] text-gray-500">{j.branches?.name || "-"}</span>
                <span className="col-span-2 text-[13px] text-gray-600">${j.salary_min?.toLocaleString()} - ${j.salary_max?.toLocaleString()}</span>
                <span className="col-span-1">
                  <span className={`inline-flex text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${
                    j.status === "active" ? "bg-green-50 text-green-700" : j.status === "interviewing" ? "bg-blue-50 text-blue-700" : "bg-gray-50 text-gray-600"
                  }`}>
                    {j.status}
                  </span>
                </span>
                <div className="col-span-2 flex justify-end gap-1.5">
                  <button
                    onClick={() => openEditJob(j)}
                    className="text-[11px] font-medium px-2.5 py-1 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteJob(j.id, j.title)}
                    className="text-[11px] font-medium px-2.5 py-1 rounded-lg border border-red-200 text-red-500 hover:bg-red-50"
                  >
                    Delete
                  </button>
                  {j.status !== "closed" ? (
                    <button
                      onClick={() => closeJob(j.id)}
                      className="text-[11px] font-medium px-2.5 py-1 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100"
                    >
                      Close
                    </button>
                  ) : (
                    <button
                      onClick={() => reopenJob(j.id)}
                      className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-[#253C7D] text-white hover:bg-[#1F336A]"
                    >
                      Reopen
                    </button>
                  )}
                </div>
              </div>
            ))}
            {filteredJobs.length === 0 && (
              <div className="px-5 py-8 text-center text-[13px] text-gray-400">No jobs found matching the filter.</div>
            )}
          </div>
        </div>
      )}

      {/* Candidates Tab */}
      {tab === "candidates" && (
        <div>
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="text-[12px] text-gray-500 font-medium">Filter stage:</span>
            {["all", "applied", "screening", "interview", "offer"].map((s) => (
              <button
                key={s}
                onClick={() => setFilterStage(s)}
                className={`text-[11px] font-medium px-3 py-1 rounded-full transition-colors ${
                  filterStage === s ? "bg-[#253C7D] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {s === "all" ? "All" : stageLabels[s]}
              </button>
            ))}
            <button
              onClick={() => setCandidateModal(true)}
              className="ml-auto text-[11px] font-medium px-3 py-1.5 rounded-lg bg-[#253C7D] text-white hover:bg-[#1F336A]"
            >
              + Add Candidate
            </button>
          </div>
          <div className="space-y-3">
            {filteredCandidates.map((c) => (
              <Link
                key={c.id}
                to={`/hire/candidate/${c.id}`}
                className="border border-gray-100 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-[#253C7D]/30 hover:bg-[#253C7D]/[0.02] transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#253C7D]/10 flex items-center justify-center text-[#253C7D] font-bold">
                    {c.full_name.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <div>
                  <p className="text-[14px] font-semibold text-gray-900">{c.full_name}</p>
                    <p className="text-[12px] text-gray-500">{c.job_postings?.title || "-"} &middot; {c.source}</p>
                    {c.resume_url && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-[#253C7D] mt-0.5">
                        <i className="ri-file-pdf-line" />
                        {c.resume_name || "Resume"}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-wrap" onClick={(e) => e.preventDefault()}>
                  {/* Resume upload button for candidates without one */}
                  {!c.resume_url && (
                    <>
                      <input
                        id={`resume-upload-${c.id}`}
                        type="file"
                        accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                        className="hidden"
                        onChange={(e) => {
                          e.stopPropagation();
                          const file = e.target.files?.[0];
                          if (file) uploadCandidateResume(c.id, file);
                          e.currentTarget.value = "";
                        }}
                      />
                      <label
                        htmlFor={`resume-upload-${c.id}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <i className="ri-upload-cloud-2-line" />
                        Upload Resume
                      </label>
                    </>
                  )}
                  <div className="flex items-center gap-1" onClick={(e) => e.preventDefault()}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          rateCandidate(c.id, star);
                        }}
                        className={`w-5 h-5 flex items-center justify-center transition-colors ${star <= (c.rating || 0) ? "text-amber-400" : "text-gray-300"}`}
                      >
                        <i className="ri-star-fill text-sm" />
                      </button>
                    ))}
                    <span className="text-[12px] font-semibold text-gray-700 ml-1">{c.rating || "-"}</span>
                  </div>
                  <select
                    value={c.stage}
                    onChange={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      updateCandidateStage(c.id, e.target.value);
                    }}
                    className={`text-[11px] font-semibold px-2.5 py-1.5 rounded-lg border-none outline-none cursor-pointer ${stageColors[c.stage] || "bg-gray-100 text-gray-600"}`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {pipelineStages.map((s) => (
                      <option key={s} value={s}>{stageLabels[s]}</option>
                    ))}
                  </select>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setNewInterview({ ...newInterview, candidate_id: c.id });
                      setInterviewModal(true);
                    }}
                    className="px-3 py-1.5 bg-[#253C7D] text-white text-[11px] font-semibold rounded-lg hover:bg-[#1F336A]"
                  >
                    Schedule
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      openEditCandidate(c);
                    }}
                    className="text-[11px] font-medium px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100"
                  >
                    Edit
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      deleteCandidate(c.id, c.full_name);
                    }}
                    className="text-[11px] font-medium px-2.5 py-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              </Link>
            ))}
            {filteredCandidates.length === 0 && (
              <div className="text-center py-10 text-[13px] text-gray-400">No candidates found in this stage.</div>
            )}
          </div>
        </div>
      )}

      {/* Interviews Tab */}
      {tab === "interviews" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-[12px] text-gray-500 font-medium">{interviews.length} scheduled interviews</span>
            <button
              onClick={() => setInterviewModal(true)}
              className="text-[11px] font-medium px-3 py-1.5 rounded-lg bg-[#253C7D] text-white hover:bg-[#1F336A]"
            >
              + Schedule Interview
            </button>
          </div>
          <div className="border border-gray-100 rounded-xl overflow-hidden">
            <div className="grid grid-cols-12 bg-gray-50 px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
              <span className="col-span-3">Candidate</span>
              <span className="col-span-2">Position</span>
              <span className="col-span-2">Date & Time</span>
              <span className="col-span-1">Duration</span>
              <span className="col-span-1">Type</span>
              <span className="col-span-1">Status</span>
              <span className="col-span-2 text-right">Actions</span>
            </div>
            {interviews.map((iv) => (
              <div key={iv.id} className="grid grid-cols-12 px-5 py-4 border-t border-gray-50 items-center">
                <div className="col-span-3">
                  <p className="text-[13px] font-semibold text-gray-900">{iv.candidates?.full_name || "-"}</p>
                  <p className="text-[11px] text-gray-500">{iv.employees ? `${iv.employees.first_name} ${iv.employees.last_name}` : "TBD"}</p>
                </div>
                <span className="col-span-2 text-[13px] text-gray-600">{iv.candidates?.job_postings?.title || "-"}</span>
                <span className="col-span-2 text-[13px] text-gray-600">
                  {iv.scheduled_at ? new Date(iv.scheduled_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "-"}
                </span>
                <span className="col-span-1 text-[13px] text-gray-500">{iv.duration_minutes}m</span>
                <span className="col-span-1 text-[12px] text-gray-500 capitalize">{iv.type}</span>
                <span className="col-span-1">
                  <span className={`inline-flex text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    iv.status === "scheduled" ? "bg-blue-50 text-blue-700" : iv.status === "completed" ? "bg-green-50 text-green-700" : "bg-gray-50 text-gray-600"
                  }`}>
                    {iv.status}
                  </span>
                </span>
                <div className="col-span-2 flex justify-end gap-1.5">
                  <button
                    onClick={() => openEditInterview(iv)}
                    className="text-[11px] font-medium px-2.5 py-1 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteInterview(iv.id)}
                    className="text-[11px] font-medium px-2.5 py-1 rounded-lg border border-red-200 text-red-500 hover:bg-red-50"
                  >
                    Delete
                  </button>
                  {iv.status === "scheduled" && (
                    <button
                      onClick={() => {
                        const feedback = prompt("Enter interview feedback:") || "";
                        const score = Number(prompt("Score (1-5):")) || 0;
                        if (feedback) submitInterviewFeedback(iv.id, feedback, score);
                      }}
                      className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-[#253C7D] text-white hover:bg-[#1F336A]"
                    >
                      Complete
                    </button>
                  )}
                  {iv.status === "completed" && iv.score && (
                    <span className="text-[11px] font-semibold text-amber-600">{iv.score}/5</span>
                  )}
                </div>
              </div>
            ))}
            {interviews.length === 0 && (
              <div className="px-5 py-8 text-center text-[13px] text-gray-400">No interviews scheduled yet.</div>
            )}
          </div>
        </div>
      )}

      {/* Pipeline Tab */}
      {tab === "pipeline" && (
        <div>
          <div className="h-64 mb-8">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pipelineData} barGap={6}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="stage" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }} />
                <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                  {pipelineData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-between py-6 px-4">
            {pipelineStages.filter((s) => s !== "rejected").map((stage, i) => {
              const count = candidates.filter((c) => c.stage === stage).length;
              const isActive = count > 0;
              return (
                <div key={stage} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center text-[14px] font-bold transition-colors ${
                      isActive ? "bg-[#253C7D] text-white" : "bg-gray-100 text-gray-400"
                    }`}>
                      {count}
                    </div>
                    <span className="text-[11px] text-gray-600 mt-2 font-medium">{stageLabels[stage]}</span>
                  </div>
                  {i < 4 && (
                    <div className={`flex-1 h-0.5 mx-2 ${isActive ? "bg-[#253C7D]" : "bg-gray-200"}`} />
                  )}
                </div>
              );
            })}
          </div>
          <div className="mt-6 p-5 bg-gray-50 rounded-xl border border-gray-100">
            <h3 className="text-[14px] font-semibold text-gray-900 mb-3">Pipeline Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-2xl font-bold text-[#253C7D]">{totalCandidates}</p>
                <p className="text-[11px] text-gray-500">Total Applicants</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-600">{candidates.filter((c) => c.stage === "hired").length}</p>
                <p className="text-[11px] text-gray-500">Hired</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-600">{candidates.filter((c) => c.stage === "offer").length}</p>
                <p className="text-[11px] text-gray-500">Offers Pending</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-red-500">{candidates.filter((c) => c.stage === "rejected").length}</p>
                <p className="text-[11px] text-gray-500">Rejected</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Job Modal */}
      {jobModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900">{editingJob ? "Edit Job Posting" : "Post New Job"}</h2>
              <button onClick={() => { setJobModal(false); setEditingJob(null); setNewJob({ title: "", department: "", branch_id: "", description: "", location: "", salary_min: "", salary_max: "", type: "full-time", closing_date: "" }); }} className="p-1 rounded-lg hover:bg-gray-100">
                <i className="ri-close-line text-xl text-gray-500" />
              </button>
            </div>
            <form onSubmit={editingJob ? updateJob : createJob} className="space-y-4">
              <div>
                <label className="block text-[12px] font-semibold text-gray-700 mb-1">Job Title</label>
                <input required value={newJob.title} onChange={(e) => setNewJob({ ...newJob, title: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-[13px] focus:outline-none focus:border-[#253C7D]" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-semibold text-gray-700 mb-1">Department</label>
                  <input required value={newJob.department} onChange={(e) => setNewJob({ ...newJob, department: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-[13px] focus:outline-none focus:border-[#253C7D]" />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-gray-700 mb-1">Branch</label>
                  <select required value={newJob.branch_id} onChange={(e) => setNewJob({ ...newJob, branch_id: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-[13px] focus:outline-none focus:border-[#253C7D]">
                    <option value="">Select branch</option>
                    {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-gray-700 mb-1">Description</label>
                <textarea value={newJob.description} onChange={(e) => setNewJob({ ...newJob, description: e.target.value })} rows={3} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-[13px] focus:outline-none focus:border-[#253C7D]" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-semibold text-gray-700 mb-1">Salary Min ($)</label>
                  <input type="number" value={newJob.salary_min} onChange={(e) => setNewJob({ ...newJob, salary_min: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-[13px] focus:outline-none focus:border-[#253C7D]" />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-gray-700 mb-1">Salary Max ($)</label>
                  <input type="number" value={newJob.salary_max} onChange={(e) => setNewJob({ ...newJob, salary_max: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-[13px] focus:outline-none focus:border-[#253C7D]" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-semibold text-gray-700 mb-1">Location</label>
                  <input value={newJob.location} onChange={(e) => setNewJob({ ...newJob, location: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-[13px] focus:outline-none focus:border-[#253C7D]" />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-gray-700 mb-1">Closing Date</label>
                  <input type="date" value={newJob.closing_date} onChange={(e) => setNewJob({ ...newJob, closing_date: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-[13px] focus:outline-none focus:border-[#253C7D]" />
                </div>
              </div>
              <button type="submit" disabled={postingJob} className="w-full py-2.5 bg-[#253C7D] text-white rounded-lg text-[13px] font-semibold hover:bg-[#1F336A] disabled:opacity-60 disabled:cursor-not-allowed">
                {postingJob ? "Saving..." : editingJob ? "Save Changes" : "Post Job"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Candidate Modal */}
      {candidateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900">{editingCandidate ? "Edit Candidate" : "Add Candidate"}</h2>
              <button onClick={() => { setCandidateModal(false); setEditingCandidate(null); setNewCandidate({ full_name: "", email: "", phone: "", job_posting_id: "", source: "", notes: "" }); setResumeFile(null); }} className="p-1 rounded-lg hover:bg-gray-100">
                <i className="ri-close-line text-xl text-gray-500" />
              </button>
            </div>
            <form onSubmit={editingCandidate ? updateCandidateInfo : addCandidate} className="space-y-4">
              <div>
                <label className="block text-[12px] font-semibold text-gray-700 mb-1">Full Name</label>
                <input required value={newCandidate.full_name} onChange={(e) => setNewCandidate({ ...newCandidate, full_name: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-[13px] focus:outline-none focus:border-[#253C7D]" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-semibold text-gray-700 mb-1">Email</label>
                  <input type="email" required value={newCandidate.email} onChange={(e) => setNewCandidate({ ...newCandidate, email: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-[13px] focus:outline-none focus:border-[#253C7D]" />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-gray-700 mb-1">Phone</label>
                  <input value={newCandidate.phone} onChange={(e) => setNewCandidate({ ...newCandidate, phone: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-[13px] focus:outline-none focus:border-[#253C7D]" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-semibold text-gray-700 mb-1">Job Position</label>
                  <select required value={newCandidate.job_posting_id} onChange={(e) => setNewCandidate({ ...newCandidate, job_posting_id: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-[13px] focus:outline-none focus:border-[#253C7D]">
                    <option value="">Select position</option>
                    {jobs.filter((j) => j.status === "active").map((j) => <option key={j.id} value={j.id}>{j.title}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-gray-700 mb-1">Source</label>
                  <input value={newCandidate.source} onChange={(e) => setNewCandidate({ ...newCandidate, source: e.target.value })} placeholder="e.g. LinkedIn" className="w-full px-3 py-2 rounded-lg border border-gray-200 text-[13px] focus:outline-none focus:border-[#253C7D]" />
                </div>
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-gray-700 mb-1">Notes</label>
                <textarea value={newCandidate.notes} onChange={(e) => setNewCandidate({ ...newCandidate, notes: e.target.value })} rows={2} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-[13px] focus:outline-none focus:border-[#253C7D]" />
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-gray-700 mb-1">Resume</label>
                <div className="relative">
                  <input
                    type="file"
                    id="candidate-resume"
                    accept=".pdf,.doc,.docx"
                    className="hidden"
                    onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                  />
                  <label
                    htmlFor="candidate-resume"
                    className="flex items-center gap-2 w-full px-3 py-2 rounded-lg border border-gray-200 text-[13px] cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <i className="ri-upload-cloud-2-line text-gray-400" />
                    <span className="text-gray-500 truncate">
                      {resumeFile ? resumeFile.name : "Upload PDF, DOC, or DOCX"}
                    </span>
                  </label>
                  {resumeFile && (
                    <button
                      type="button"
                      onClick={() => setResumeFile(null)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-red-500"
                    >
                      <i className="ri-close-line" />
                    </button>
                  )}
                </div>
              </div>
              <button type="submit" disabled={uploadingResume} className="w-full py-2.5 bg-[#253C7D] text-white rounded-lg text-[13px] font-semibold hover:bg-[#1F336A] disabled:opacity-60 disabled:cursor-not-allowed">
                {uploadingResume ? "Saving..." : editingCandidate ? "Save Changes" : "Add Candidate"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Interview Modal */}
      {interviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900">{editingInterview ? "Edit Interview" : "Schedule Interview"}</h2>
              <button onClick={() => { setInterviewModal(false); setEditingInterview(null); setNewInterview({ candidate_id: "", scheduled_at: "", duration_minutes: "60", type: "video", notes: "" }); }} className="p-1 rounded-lg hover:bg-gray-100">
                <i className="ri-close-line text-xl text-gray-500" />
              </button>
            </div>
            <form onSubmit={editingInterview ? updateInterviewInfo : scheduleInterview} className="space-y-4">
              <div>
                <label className="block text-[12px] font-semibold text-gray-700 mb-1">Candidate</label>
                <select required value={newInterview.candidate_id} onChange={(e) => setNewInterview({ ...newInterview, candidate_id: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-[13px] focus:outline-none focus:border-[#253C7D]">
                  <option value="">Select candidate</option>
                  {candidates.map((c) => <option key={c.id} value={c.id}>{c.full_name} - {c.job_postings?.title}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-semibold text-gray-700 mb-1">Date & Time</label>
                  <input type="datetime-local" required value={newInterview.scheduled_at} onChange={(e) => setNewInterview({ ...newInterview, scheduled_at: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-[13px] focus:outline-none focus:border-[#253C7D]" />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-gray-700 mb-1">Duration (min)</label>
                  <select value={newInterview.duration_minutes} onChange={(e) => setNewInterview({ ...newInterview, duration_minutes: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-[13px] focus:outline-none focus:border-[#253C7D]">
                    <option value="30">30 min</option>
                    <option value="45">45 min</option>
                    <option value="60">1 hour</option>
                    <option value="90">1.5 hours</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-gray-700 mb-1">Interview Type</label>
                <select value={newInterview.type} onChange={(e) => setNewInterview({ ...newInterview, type: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-[13px] focus:outline-none focus:border-[#253C7D]">
                  <option value="video">Video Call</option>
                  <option value="in-person">In Person</option>
                  <option value="phone">Phone</option>
                </select>
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-gray-700 mb-1">Notes / Agenda</label>
                <textarea value={newInterview.notes} onChange={(e) => setNewInterview({ ...newInterview, notes: e.target.value })} rows={2} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-[13px] focus:outline-none focus:border-[#253C7D]" />
              </div>
              <button type="submit" disabled={schedulingInterview} className="w-full py-2.5 bg-[#253C7D] text-white rounded-lg text-[13px] font-semibold hover:bg-[#1F336A] disabled:opacity-60 disabled:cursor-not-allowed">
                {schedulingInterview ? "Saving..." : editingInterview ? "Save Changes" : "Schedule Interview"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}