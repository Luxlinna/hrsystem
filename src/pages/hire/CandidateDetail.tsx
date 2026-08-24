import { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { logActivity } from "@/lib/audit";
import { uploadFileToR2 } from "@/lib/r2-storage";

interface Candidate {
  id: string;
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
  linkedin_url: string | null;
  job_posting_id: string;
  job_postings?: { id: string; title: string; department: string; branches?: { name: string } } | null;
}

interface Interview {
  id: string;
  scheduled_at: string;
  duration_minutes: number;
  type: string;
  status: string;
  feedback: string;
  score: number;
  notes: string;
  employees?: { first_name: string; last_name: string; avatar_url?: string } | null;
}

const stageLabels: Record<string, string> = {
  applied: "Applied",
  screening: "Screening",
  interview: "Interview",
  offer: "Offer",
  hired: "Hired",
  rejected: "Rejected",
};

const stageColors: Record<string, string> = {
  applied: "bg-slate-100 text-slate-700 border-slate-200",
  screening: "bg-amber-50 text-amber-700 border-amber-200",
  interview: "bg-sky-50 text-sky-700 border-sky-200",
  offer: "bg-indigo-50 text-indigo-700 border-indigo-200",
  hired: "bg-emerald-50 text-emerald-700 border-emerald-200",
  rejected: "bg-rose-50 text-rose-700 border-rose-200",
};

const STAGE_TIMELINE_ORDER = ["applied", "screening", "interview", "offer", "hired"];

const initials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();

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

export default function CandidateDetail() {
  const { user } = useAuth();
  const { role } = usePermissions();
  const actorName = (user?.user_metadata?.display_name as string) || user?.email || "Unknown";
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingResume, setUploadingResume] = useState(false);

  // Recruiter Notes Editing
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notesText, setNotesText] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);

  // Feedback Modal
  const [feedbackInterview, setFeedbackInterview] = useState<Interview | null>(null);
  const [feedbackScore, setFeedbackScore] = useState(5);
  const [feedbackText, setFeedbackText] = useState("");
  const [savingFeedback, setSavingFeedback] = useState(false);

  // Schedule Interview Modal
  const [scheduleModal, setScheduleModal] = useState(false);
  const [schedulingInterview, setSchedulingInterview] = useState(false);
  const [newInterview, setNewInterview] = useState({
    scheduled_at: "",
    duration_minutes: "60",
    type: "video",
    notes: "",
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const loadRequestId = useRef(0);

  const loadCandidate = async (cid: string) => {
    setLoading(true);
    const requestId = ++loadRequestId.current;
    const [{ data: c }, { data: ivs }] = await Promise.all([
      supabase
        .from("candidates")
        .select("*, job_postings(id, title, department, branches(name))")
        .eq("id", cid)
        .is("deleted_at", null)
        .maybeSingle(),
      supabase
        .from("interviews")
        .select("*, employees(first_name, last_name, avatar_url)")
        .eq("candidate_id", cid)
        .is("deleted_at", null)
        .order("scheduled_at", { ascending: false }),
    ]);

    if (requestId !== loadRequestId.current) return;
    const cand = c as Candidate | null;
    setCandidate(cand);
    if (cand) setNotesText(cand.notes || "");
    setInterviews(ivs || []);
    setLoading(false);
  };

  useEffect(() => {
    if (!id) return;
    loadCandidate(id);
  }, [id]);

  const updateStage = async (stage: string) => {
    if (!id || !candidate) return;
    const { error } = await supabase.from("candidates").update({ stage }).eq("id", id);
    if (error) { toast("Error", "Failed to update candidate stage", "error"); return; }
    setCandidate((prev) => (prev ? { ...prev, stage } : prev));
    toast("Stage Updated", `Candidate moved to ${stageLabels[stage] || stage}.`, "success");
    logActivity({
      module: "hire",
      action: stage === "hired" ? "processed" : stage === "rejected" ? "rejected" : "updated",
      entityType: "candidate",
      entityId: id,
      actorName,
      actorRole: role?.name || "Unknown",
      description: `${candidate.full_name} moved to ${stageLabels[stage] || stage}`,
    });
  };

  const rateCandidate = async (star: number) => {
    if (!id) return;
    const { error } = await supabase.from("candidates").update({ rating: star }).eq("id", id);
    if (error) { toast("Error", "Failed to save rating", "error"); return; }
    setCandidate((prev) => (prev ? { ...prev, rating: star } : prev));
    toast("Rating Saved", `${star}/5 stars recorded.`, "success");
  };

  const uploadResume = async (file: File) => {
    if (!id) return;
    setUploadingResume(true);
    try {
      const url = await uploadFileToR2(file, "candidates/resumes");
      await supabase
        .from("candidates")
        .update({ resume_url: url, resume_name: file.name })
        .eq("id", id);
      setCandidate((prev) => (prev ? { ...prev, resume_url: url, resume_name: file.name } : prev));
      toast("Resume Uploaded", "Candidate resume attached successfully.", "success");
    } catch (err) {
      toast("Upload Failed", err instanceof Error ? err.message : "Could not upload resume", "error");
    } finally {
      setUploadingResume(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!id) return;
    setSavingNotes(true);
    const { error } = await supabase
      .from("candidates")
      .update({ notes: notesText.trim() })
      .eq("id", id);
    setSavingNotes(false);
    if (error) { toast("Error", "Failed to save notes", "error"); return; }
    setCandidate((prev) => (prev ? { ...prev, notes: notesText.trim() } : prev));
    setIsEditingNotes(false);
    toast("Notes Saved", "Evaluation notes updated.", "success");
  };

  const handleSaveFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackInterview || !id) return;
    setSavingFeedback(true);
    const { error } = await supabase
      .from("interviews")
      .update({
        feedback: feedbackText.trim(),
        score: feedbackScore,
        status: "completed",
      })
      .eq("id", feedbackInterview.id);
    setSavingFeedback(false);
    if (error) { toast("Error", "Failed to record interview feedback", "error"); return; }
    toast("Feedback Saved", "Interview marked as completed.", "success");
    setFeedbackInterview(null);
    loadCandidate(id);
  };

  const handleScheduleInterview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || schedulingInterview) return;
    setSchedulingInterview(true);
    const { error } = await supabase.from("interviews").insert([
      {
        candidate_id: id,
        scheduled_at: new Date(newInterview.scheduled_at).toISOString(),
        duration_minutes: Number(newInterview.duration_minutes) || 60,
        type: newInterview.type,
        notes: newInterview.notes.trim(),
        status: "scheduled",
      },
    ]);
    setSchedulingInterview(false);
    if (error) { toast("Error", "Failed to schedule interview", "error"); return; }
    setScheduleModal(false);
    setNewInterview({ scheduled_at: "", duration_minutes: "60", type: "video", notes: "" });
    toast("Interview Booked", "Session scheduled successfully.", "success");
    loadCandidate(id);
  };

  const deleteCandidate = async () => {
    if (!candidate || !confirm(`Move "${candidate.full_name}" to the Recycle Bin?`)) return;
    const { error } = await supabase
      .from("candidates")
      .update({ deleted_at: new Date().toISOString(), deleted_by: actorName })
      .eq("id", candidate.id);
    if (error) { toast("Error", "Failed to delete candidate", "error"); return; }
    toast("Candidate Deleted", "Moved to Recycle Bin.", "success");
    navigate("/hire");
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#F8F9FB]">
        <div className="w-9 h-9 border-3 border-[#253C7D] border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-semibold text-gray-500">Loading candidate profile...</p>
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="p-12 text-center min-h-screen bg-[#F8F9FB] flex flex-col items-center justify-center">
        <i className="ri-user-search-line text-5xl text-gray-300 mb-3 block" />
        <h2 className="text-lg font-bold text-gray-900">Candidate Not Found</h2>
        <p className="text-xs text-gray-500 mt-1 max-w-sm">
          This candidate profile may have been deleted or moved to the Recycle Bin.
        </p>
        <Link
          to="/hire"
          className="mt-4 px-4 py-2 bg-[#253C7D] text-white text-xs font-bold rounded-xl shadow-xs hover:bg-[#1E3064] transition-all"
        >
          Back to Recruitment Hub
        </Link>
      </div>
    );
  }

  const completedInterviews = interviews.filter((iv) => iv.status === "completed");
  const avgScore =
    completedInterviews.length > 0
      ? (
          completedInterviews.reduce((sum, iv) => sum + (iv.score || 0), 0) /
          completedInterviews.length
        ).toFixed(1)
      : "—";

  return (
    <div className="min-h-screen bg-[#F8F9FB] p-5 sm:p-7 lg:p-8 font-sans">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 mb-5 text-xs font-semibold text-gray-400">
        <Link to="/" className="hover:text-[#253C7D] transition-colors">
          Dashboard
        </Link>
        <i className="ri-arrow-right-s-line text-xs" />
        <Link to="/hire" className="hover:text-[#253C7D] transition-colors">
          Recruitment Hub
        </Link>
        <i className="ri-arrow-right-s-line text-xs" />
        <span className="text-[#253C7D] font-bold truncate max-w-[200px]">
          {candidate.full_name}
        </span>
      </div>

      {/* Main Header Profile Card (Modern Enterprise ATS) */}
      <div className="bg-white rounded-3xl border border-gray-200/80 p-6 md:p-7 mb-6 shadow-2xs">
        <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
          <div className="flex items-center gap-5 sm:gap-6 min-w-0">
            {/* Gradient Avatar */}
            <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-[#253C7D] to-[#17254E] text-white flex items-center justify-center text-xl sm:text-2xl font-black shadow-md shrink-0 ring-4 ring-[#253C7D]/10">
              {initials(candidate.full_name)}
            </div>

            <div className="min-w-0 flex-1 space-y-2">
              {/* Row 1: Candidate Name & Dynamic Stage Badge */}
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight leading-none">
                  {candidate.full_name}
                </h1>
                <span
                  className={`text-[11px] font-extrabold px-3 py-0.5 rounded-full uppercase tracking-wider border shadow-2xs inline-flex items-center gap-1 ${
                    stageColors[candidate.stage] || "bg-gray-100 text-gray-700"
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                  {stageLabels[candidate.stage] || candidate.stage}
                </span>
              </div>

              {/* Row 2: Applied Role, Department & Branch Pills */}
              <div className="flex items-center gap-2 flex-wrap text-xs">
                <span className="font-bold text-[#253C7D] flex items-center gap-1.5 bg-[#253C7D]/5 px-2.5 py-1 rounded-lg">
                  <i className="ri-briefcase-line" />
                  {candidate.job_postings?.title || "General Application"}
                </span>

                {candidate.job_postings?.department && (
                  <span className="bg-slate-100 text-slate-700 font-semibold px-2.5 py-1 rounded-lg">
                    {candidate.job_postings.department}
                  </span>
                )}

                {candidate.job_postings?.branches?.name && (
                  <span className="bg-gray-50 border border-gray-200/80 text-gray-600 font-medium px-2.5 py-1 rounded-lg flex items-center gap-1">
                    <i className="ri-building-line text-gray-400" />
                    {candidate.job_postings.branches.name}
                  </span>
                )}
              </div>

              {/* Row 3: Contact & Application Chips */}
              <div className="flex flex-wrap items-center gap-2 text-xs pt-0.5">
                <a
                  href={`mailto:${candidate.email}`}
                  className="bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium px-3 py-1 rounded-xl border border-gray-200/60 flex items-center gap-1.5 transition-colors"
                >
                  <i className="ri-mail-line text-gray-400" />
                  <span>{candidate.email}</span>
                </a>

                {candidate.phone && (
                  <a
                    href={`tel:${candidate.phone}`}
                    className="bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium px-3 py-1 rounded-xl border border-gray-200/60 flex items-center gap-1.5 transition-colors"
                  >
                    <i className="ri-phone-line text-gray-400" />
                    <span>{candidate.phone}</span>
                  </a>
                )}

                <span className="bg-gray-50 text-gray-500 font-medium px-3 py-1 rounded-xl border border-gray-200/60 flex items-center gap-1.5">
                  <i className="ri-calendar-line text-gray-400" />
                  Applied {new Date(candidate.applied_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </span>
              </div>
            </div>
          </div>

          {/* Right: Quick Action Controls */}
          <div className="flex items-center gap-2.5 shrink-0 flex-wrap w-full lg:w-auto justify-start lg:justify-end pt-2 lg:pt-0">
            <button
              onClick={() => setScheduleModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#253C7D] hover:bg-[#1E3064] text-white text-xs font-bold rounded-xl transition-all shadow-sm hover:shadow cursor-pointer"
            >
              <i className="ri-calendar-check-line text-sm" />
              Schedule Interview
            </button>

            <div className="relative">
              <select
                value={candidate.stage}
                onChange={(e) => updateStage(e.target.value)}
                className="pl-3.5 pr-8 py-2.5 border border-gray-200 rounded-xl text-xs font-bold bg-white text-gray-800 cursor-pointer focus:outline-none focus:border-[#253C7D] shadow-2xs appearance-none"
              >
                {Object.entries(stageLabels).map(([key, label]) => (
                  <option key={key} value={key}>
                    Stage: {label}
                  </option>
                ))}
              </select>
              <i className="ri-arrow-down-s-line absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-sm" />
            </div>

            {candidate.stage !== "hired" ? (
              <button
                onClick={() => updateStage("hired")}
                className="inline-flex items-center gap-1 px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-2xs cursor-pointer"
              >
                <i className="ri-check-double-line text-sm" />
                Hire
              </button>
            ) : (
              <span className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <i className="ri-medal-fill" /> Hired
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid: Left Column (2 Cols) + Right Sidebar (1 Col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Primary Content Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* 1. Resume Section */}
          <div className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-2xs">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div>
                <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <i className="ri-file-pdf-line text-rose-500 text-lg" />
                  Resume & Candidate Documents
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">Attached CV document and credential preview</p>
              </div>

              <input
                ref={fileInputRef}
                id="detail-resume-upload"
                type="file"
                accept=".pdf,.doc,.docx"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) uploadResume(file);
                  e.currentTarget.value = "";
                }}
              />

              {!candidate.resume_url && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingResume}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border border-gray-200 hover:bg-gray-50 text-gray-700 transition-colors cursor-pointer"
                >
                  <i className="ri-upload-cloud-2-line text-sm" />
                  {uploadingResume ? "Uploading..." : "Upload Resume"}
                </button>
              )}
            </div>

            {candidate.resume_url ? (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-50 border border-gray-100">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center text-2xl shrink-0">
                      <i className="ri-file-pdf-fill" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate">
                        {candidate.resume_name || "Candidate_Resume.pdf"}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">Applicant Curriculum Vitae / Resume Document</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    <a
                      href={candidate.resume_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#253C7D] hover:bg-[#1E3064] text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
                    >
                      <i className="ri-external-link-line" />
                      View Document
                    </a>
                    <a
                      href={candidate.resume_url}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-semibold rounded-xl transition-all cursor-pointer"
                    >
                      <i className="ri-download-2-line" />
                      Download
                    </a>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingResume}
                      className="inline-flex items-center gap-1 px-3 py-2 border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                    >
                      <i className="ri-restart-line" />
                      {uploadingResume ? "Uploading..." : "Replace"}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="text-center py-10 border-2 border-dashed border-gray-200 rounded-2xl cursor-pointer hover:bg-slate-50/60 transition-colors"
              >
                <i className="ri-file-upload-line text-3xl text-gray-300 mb-2 block" />
                <p className="text-xs font-bold text-gray-700">No Resume Attached Yet</p>
                <p className="text-[11px] text-gray-400 mt-0.5">Click here to upload candidate's PDF or DOCX file.</p>
              </div>
            )}
          </div>

          {/* 2. Interview History Section */}
          <div className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-2xs">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div>
                <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <i className="ri-calendar-check-line text-sky-600 text-lg" />
                  Interview History
                </h2>
              </div>

              <div className="flex items-center gap-3 text-xs text-gray-500 font-semibold">
                <span>{interviews.length} Total</span>
                <span className="text-gray-300">|</span>
                <span>{completedInterviews.length} Completed</span>
                <span className="text-gray-300">|</span>
                <span className="text-[#253C7D] font-bold">Avg Score: {avgScore}</span>
              </div>
            </div>

            {interviews.length > 0 ? (
              <div className="space-y-3">
                {interviews.map((iv) => {
                  const isCompleted = iv.status === "completed";

                  return (
                    <div
                      key={iv.id}
                      className="border border-gray-200/80 rounded-2xl p-4 hover:border-gray-300 transition-all bg-white"
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`inline-flex text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider border ${
                                isCompleted
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : "bg-sky-50 text-sky-700 border-sky-200"
                              }`}
                            >
                              {iv.status}
                            </span>
                            <span className="text-xs font-bold text-gray-800 capitalize">
                              {iv.type} Interview
                            </span>
                          </div>

                          <div className="flex items-center gap-3.5 mt-2 text-xs text-gray-500 flex-wrap">
                            <span className="flex items-center gap-1 font-semibold text-gray-800">
                              <i className="ri-calendar-line text-gray-400" />
                              {formatScheduleDateTime(iv.scheduled_at)}
                            </span>
                            <span className="flex items-center gap-1">
                              <i className="ri-time-line text-gray-400" />
                              {iv.duration_minutes} mins
                            </span>
                            <span className="flex items-center gap-1">
                              <i className="ri-user-line text-gray-400" />
                              {iv.employees ? `${iv.employees.first_name} ${iv.employees.last_name}` : "Assigned Team"}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {!isCompleted ? (
                            <button
                              onClick={() => {
                                setFeedbackInterview(iv);
                                setFeedbackScore(3);
                                setFeedbackText("");
                              }}
                              className="px-3.5 py-1.5 bg-[#253C7D] hover:bg-[#1E3064] text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-1"
                            >
                              <i className="ri-checkbox-circle-line" />
                              Complete Round
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setFeedbackInterview(iv);
                                setFeedbackScore(iv.score || 5);
                                setFeedbackText(iv.feedback || "");
                              }}
                              className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1"
                            >
                              <i className="ri-edit-line" />
                              Edit Feedback
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Feedback remarks callout */}
                      {iv.feedback && (
                        <div className="mt-3 p-3.5 rounded-xl bg-slate-50 border border-gray-100 text-xs">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-gray-800">Reviewer Feedback:</span>
                            <div className="flex items-center gap-1 text-amber-500 font-bold">
                              <i className="ri-star-fill" />
                              <span>{iv.score}/5 Stars</span>
                            </div>
                          </div>
                          <p className="text-gray-600 leading-relaxed italic">"{iv.feedback}"</p>
                        </div>
                      )}

                      {iv.notes && (
                        <p className="mt-2 text-[11px] text-gray-400">
                          <strong>Notes:</strong> {iv.notes}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 border border-gray-100 rounded-2xl">
                <i className="ri-video-chat-line text-3xl text-gray-300 mb-2 block" />
                <p className="text-xs font-semibold text-gray-500">No interviews scheduled yet</p>
                <button
                  onClick={() => setScheduleModal(true)}
                  className="text-xs text-[#253C7D] font-bold hover:underline mt-1 cursor-pointer"
                >
                  + Schedule the first interview
                </button>
              </div>
            )}
          </div>

          {/* 3. Recruiter Notes Section */}
          <div className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-2xs">
            <div className="flex items-center justify-between gap-4 mb-3">
              <h2 className="text-base font-bold text-gray-900">Recruiter Notes</h2>
              {!isEditingNotes ? (
                <button
                  onClick={() => setIsEditingNotes(true)}
                  className="px-3 py-1 border border-gray-200 hover:bg-gray-50 text-xs font-bold text-gray-700 rounded-xl transition-colors cursor-pointer flex items-center gap-1"
                >
                  <i className="ri-edit-line text-xs" /> Edit Notes
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setIsEditingNotes(false);
                      setNotesText(candidate.notes || "");
                    }}
                    className="px-2.5 py-1 text-xs font-semibold text-gray-500 hover:bg-gray-100 rounded-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveNotes}
                    disabled={savingNotes}
                    className="px-3 py-1 bg-[#253C7D] text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer disabled:opacity-60"
                  >
                    {savingNotes ? "Saving..." : "Save"}
                  </button>
                </div>
              )}
            </div>

            {isEditingNotes ? (
              <textarea
                rows={4}
                value={notesText}
                onChange={(e) => setNotesText(e.target.value)}
                placeholder="Enter notes about candidate skills, communication, compensation..."
                className="w-full px-3.5 py-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D] leading-relaxed transition-all"
              />
            ) : (
              <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap bg-slate-50/60 p-4 rounded-2xl border border-gray-100">
                {candidate.notes || "No notes added for this candidate yet. Click 'Edit Notes' to add observations."}
              </p>
            )}
          </div>
        </div>

        {/* Right Intelligence Sidebar */}
        <div className="space-y-6">
          {/* 1. Rating Card */}
          <div className="bg-white rounded-3xl border border-gray-200/80 p-5 shadow-2xs">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
              Candidate Evaluation
            </h3>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => rateCandidate(star)}
                  className={`w-8 h-8 flex items-center justify-center transition-transform hover:scale-125 cursor-pointer ${
                    star <= (candidate.rating || 0) ? "text-amber-400" : "text-gray-200 hover:text-amber-300"
                  }`}
                >
                  <i className="ri-star-fill text-xl" />
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 font-semibold mt-2">
              {candidate.rating ? `${candidate.rating} / 5 Stars` : "Unrated applicant"}
            </p>
          </div>

          {/* 2. Source & Profile Info Card */}
          <div className="bg-white rounded-3xl border border-gray-200/80 p-5 shadow-2xs">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
              Sourcing Channel
            </h3>
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-800">
              <i className="ri-share-forward-line text-[#253C7D]" />
              <span>{candidate.source || "Direct Website Application"}</span>
            </div>
            {candidate.linkedin_url && (
              <a
                href={candidate.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs font-bold text-[#0A66C2] hover:underline mt-2.5 pt-2 border-t border-gray-100"
              >
                <i className="ri-linkedin-box-fill text-base" /> View LinkedIn Profile
              </a>
            )}
          </div>

          {/* 3. Pipeline Timeline (Vertical Stepper with 1-Click Jumping) */}
          <div className="bg-white rounded-3xl border border-gray-200/80 p-5 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Pipeline Timeline
              </h3>
              <span className="text-[10px] text-gray-400 font-medium">Click step to jump</span>
            </div>

            <div className="relative pl-5 space-y-3.5">
              {STAGE_TIMELINE_ORDER.map((stageKey, idx) => {
                const currentIdx = STAGE_TIMELINE_ORDER.indexOf(candidate.stage);
                const isPast = currentIdx >= idx && candidate.stage !== "rejected";
                const isCurrent = candidate.stage === stageKey;

                return (
                  <div
                    key={stageKey}
                    onClick={() => updateStage(stageKey)}
                    className="relative flex items-center gap-3 cursor-pointer group"
                  >
                    <div
                      className={`absolute left-[-18px] w-3.5 h-3.5 rounded-full border-2 z-10 transition-transform group-hover:scale-125 ${
                        isCurrent
                          ? "border-[#253C7D] bg-[#253C7D] ring-4 ring-[#253C7D]/15"
                          : isPast
                          ? "border-[#253C7D] bg-[#253C7D]"
                          : "border-gray-300 bg-white"
                      }`}
                    />
                    {idx < STAGE_TIMELINE_ORDER.length - 1 && (
                      <div
                        className={`absolute left-[-16px] top-3.5 w-0.5 h-full ${
                          isPast && currentIdx > idx ? "bg-[#253C7D]" : "bg-gray-200"
                        }`}
                      />
                    )}
                    <span
                      className={`text-xs font-bold transition-colors ${
                        isCurrent
                          ? "text-[#253C7D]"
                          : isPast
                          ? "text-gray-800"
                          : "text-gray-400 group-hover:text-gray-600"
                      }`}
                    >
                      {stageLabels[stageKey]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 4. Quick Decision Actions */}
          <div className="bg-white rounded-3xl border border-gray-200/80 p-5 shadow-2xs space-y-2">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
              Application Actions
            </h3>

            <button
              onClick={() => updateStage("hired")}
              className="w-full py-2.5 px-3 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer border border-emerald-200/60"
            >
              <i className="ri-check-double-line text-sm" />
              Mark as Hired
            </button>

            <button
              onClick={() => updateStage("rejected")}
              className="w-full py-2.5 px-3 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer border border-rose-200/60"
            >
              <i className="ri-close-circle-line text-sm" />
              Reject Applicant
            </button>

            <button
              onClick={deleteCandidate}
              className="w-full py-2.5 px-3 rounded-xl text-gray-400 hover:text-rose-600 hover:bg-gray-50 text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <i className="ri-delete-bin-line text-sm" />
              Move to Recycle Bin
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* DIALOG MODALS                                                             */}
      {/* ========================================================================= */}

      {/* 1. SCHEDULE INTERVIEW MODAL */}
      {scheduleModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/40 backdrop-blur-xs overflow-y-auto no-scrollbar"
          onClick={() => !schedulingInterview && setScheduleModal(false)}
        >
          <div
            className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-gray-100/80 overflow-hidden flex flex-col animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-gray-100 bg-white flex items-center justify-between gap-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center font-bold text-sm">
                  <i className="ri-calendar-event-line" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Schedule Interview Round</h3>
                  <p className="text-[11px] text-gray-400 mt-0.5">{candidate.full_name}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setScheduleModal(false)}
                className="w-8 h-8 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 flex items-center justify-center transition-colors cursor-pointer"
              >
                <i className="ri-close-line text-lg" />
              </button>
            </div>

            <form onSubmit={handleScheduleInterview} className="p-5 sm:p-6 space-y-4">
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
                  placeholder="Meeting URL (Google Meet / Zoom), topics to cover..."
                  className="w-full px-3.5 py-2 bg-gray-50/70 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D]"
                />
              </div>

              <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setScheduleModal(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={schedulingInterview}
                  className="px-5 py-2 bg-[#253C7D] hover:bg-[#1E3064] text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer disabled:opacity-60"
                >
                  {schedulingInterview ? "Scheduling..." : "Confirm Schedule"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. FEEDBACK MODAL */}
      {feedbackInterview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/40 backdrop-blur-xs overflow-y-auto no-scrollbar"
          onClick={() => !savingFeedback && setFeedbackInterview(null)}
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
                  <p className="text-[11px] text-gray-400 mt-0.5">{candidate.full_name}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setFeedbackInterview(null)}
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
                  Evaluation Remarks & Assessment
                </label>
                <textarea
                  required
                  rows={4}
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="Summarize candidate communication, technical aptitude, role fit..."
                  className="w-full px-3.5 py-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D]"
                />
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setFeedbackInterview(null)}
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