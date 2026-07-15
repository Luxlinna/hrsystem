import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import app from "@/lib/firebase";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

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
  job_postings?: { title: string; department: string; branches?: { name: string } } | null;
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
  employees?: { first_name: string; last_name: string } | null;
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
  applied: "bg-gray-100 text-gray-600",
  screening: "bg-amber-50 text-amber-700",
  interview: "bg-blue-50 text-blue-700",
  offer: "bg-emerald-50 text-emerald-700",
  hired: "bg-[#0D7377] text-white",
  rejected: "bg-red-50 text-red-600",
};

export default function CandidateDetail() {
  const { id } = useParams<{ id: string }>();
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [feedbackModal, setFeedbackModal] = useState<string | null>(null);
  const [feedbackForm, setFeedbackForm] = useState({ feedback: "", score: 3 });
  const [scheduleModal, setScheduleModal] = useState(false);
  const [newInterview, setNewInterview] = useState({ scheduled_at: "", duration_minutes: "60", type: "video", notes: "" });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  useEffect(() => {
    if (!id) return;
    loadCandidate(id);
  }, [id]);

  const loadCandidate = async (cid: string) => {
    setLoading(true);
    const { data: c } = await supabase
      .from("candidates")
      .select("*, job_postings(title, department, branches(name))")
      .eq("id", cid)
      .maybeSingle();
    setCandidate(c as Candidate | null);

    const { data: ivs } = await supabase
      .from("interviews")
      .select("*, employees(first_name, last_name)")
      .eq("candidate_id", cid)
      .order("scheduled_at", { ascending: false });
    setInterviews(ivs || []);
    setLoading(false);
  };

  const uploadResume = async (file: File) => {
    if (!id) return;
    setUploadingResume(true);
    try {
      const storage = getStorage(app);
      const storageRef = ref(storage, `resumes/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      await supabase.from("candidates").update({ resume_url: url, resume_name: file.name }).eq("id", id);
      setCandidate((prev) => prev ? { ...prev, resume_url: url, resume_name: file.name } : prev);
      toast("Resume uploaded", "Candidate resume saved", "success");
    } catch {
      toast("Upload failed", "Could not upload resume", "error");
    }
    setUploadingResume(false);
  };

  const submitFeedback = async (interviewId: string) => {
    await supabase.from("interviews").update({
      feedback: feedbackForm.feedback,
      score: feedbackForm.score,
      status: "completed",
    }).eq("id", interviewId);
    setFeedbackModal(null);
    setFeedbackForm({ feedback: "", score: 3 });
    toast("Feedback saved", "Interview marked as completed", "success");
    if (id) loadCandidate(id);
  };

  const scheduleInterview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    await supabase.from("interviews").insert([{
      candidate_id: id,
      scheduled_at: new Date(newInterview.scheduled_at).toISOString(),
      duration_minutes: Number(newInterview.duration_minutes),
      type: newInterview.type,
      notes: newInterview.notes,
      status: "scheduled",
    }]);
    setScheduleModal(false);
    setNewInterview({ scheduled_at: "", duration_minutes: "60", type: "video", notes: "" });
    toast("Interview scheduled", "New interview added to calendar", "success");
    if (id) loadCandidate(id);
  };

  const updateStage = async (stage: string) => {
    if (!id) return;
    await supabase.from("candidates").update({ stage }).eq("id", id);
    setCandidate((prev) => prev ? { ...prev, stage } : prev);
    toast("Stage updated", `Moved to ${stageLabels[stage]}`, "success");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-10 h-10 border-2 border-[#0D7377] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="p-10 text-center">
        <i className="ri-user-search-line text-4xl text-gray-300 mb-3 block" />
        <p className="text-gray-500">Candidate not found</p>
        <Link to="/hire" className="text-[13px] text-[#0D7377] hover:underline mt-2 inline-block">
          Back to Hiring
        </Link>
      </div>
    );
  }

  const initials = candidate.full_name.split(" ").map((n) => n[0]).join("");
  const completedInterviews = interviews.filter((iv) => iv.status === "completed");
  const avgScore = completedInterviews.length > 0
    ? (completedInterviews.reduce((sum, iv) => sum + (iv.score || 0), 0) / completedInterviews.length).toFixed(1)
    : "—";

  return (
    <div className="p-6 lg:p-10 min-h-screen bg-[#FAFAF8]">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6 text-[12px] text-gray-500">
        <Link to="/" className="hover:text-[#0D7377]">Dashboard</Link>
        <i className="ri-arrow-right-s-line" />
        <Link to="/hire" className="hover:text-[#0D7377]">Hiring</Link>
        <i className="ri-arrow-right-s-line" />
        <span className="text-gray-900 font-medium">{candidate.full_name}</span>
      </div>

      {/* Header Card */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8 mb-6">
        <div className="flex flex-col md:flex-row gap-6 items-start">
          <div className="w-20 h-20 rounded-2xl bg-[#0D7377] flex items-center justify-center text-white text-2xl font-bold shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
              <h1 className="text-2xl md:text-3xl font-bold text-[#1A1A1A]">{candidate.full_name}</h1>
              <span className={`inline-flex text-[11px] font-semibold px-3 py-1 rounded-full ${stageColors[candidate.stage] || "bg-gray-100 text-gray-600"}`}>
                {stageLabels[candidate.stage]}
              </span>
            </div>
            <p className="text-[14px] text-gray-600 mt-1">{candidate.job_postings?.title || "—"}</p>
            <div className="flex flex-wrap gap-3 mt-3 text-[12px] text-gray-500">
              <span className="flex items-center gap-1"><i className="ri-building-line" />{candidate.job_postings?.department || "—"}</span>
              <span className="flex items-center gap-1"><i className="ri-map-pin-line" />{candidate.job_postings?.branches?.name || "Headquarters"}</span>
              <span className="flex items-center gap-1"><i className="ri-mail-line" />{candidate.email}</span>
              <span className="flex items-center gap-1"><i className="ri-phone-line" />{candidate.phone || "—"}</span>
              <span className="flex items-center gap-1"><i className="ri-calendar-line" /> Applied {new Date(candidate.applied_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
            </div>
          </div>
          <div className="flex gap-2 shrink-0 flex-wrap">
            <button
              onClick={() => setScheduleModal(true)}
              className="px-4 py-2 bg-[#0D7377] text-white text-[13px] font-semibold rounded-lg hover:bg-[#0a5c60]"
            >
              <i className="ri-calendar-check-line mr-1" />
              Schedule Interview
            </button>
            <select
              value={candidate.stage}
              onChange={(e) => updateStage(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-[13px] bg-white cursor-pointer focus:outline-none focus:border-[#0D7377]"
            >
              {Object.entries(stageLabels).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Resume Section */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-[#1A1A1A]">Resume</h2>
              <input
                ref={fileInputRef}
                id="detail-resume-upload"
                type="file"
                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                className="opacity-0 absolute w-0 h-0"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) uploadResume(file);
                  e.currentTarget.value = "";
                }}
              />
              {!candidate.resume_url && (
                <label
                  htmlFor="detail-resume-upload"
                  onClick={triggerFileSelect}
                  className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[12px] font-semibold border cursor-pointer ${uploadingResume ? "opacity-60" : "border-gray-200 hover:bg-gray-50 text-gray-700"}`}
                >
                  <i className="ri-upload-cloud-2-line" />
                  {uploadingResume ? "Uploading..." : "Upload Resume"}
                </label>
              )}
            </div>

            {candidate.resume_url ? (
              <div>
                <div className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 border border-gray-100 mb-4">
                  <div className="w-12 h-12 rounded-lg bg-red-50 flex items-center justify-center">
                    <i className="ri-file-pdf-line text-red-500 text-xl" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-semibold text-gray-900 truncate">{candidate.resume_name || "Resume"}</p>
                    <p className="text-[11px] text-gray-500">PDF / DOC Document</p>
                  </div>
                  <div className="flex gap-2">
                    <a
                      href={candidate.resume_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-[#0D7377] text-white text-[11px] font-semibold rounded-lg hover:bg-[#0a5c60]"
                    >
                      <i className="ri-download-line mr-1" /> Download
                    </a>
                    <label
                      htmlFor="detail-resume-upload"
                      onClick={triggerFileSelect}
                      className="inline-flex items-center gap-1 px-3 py-1.5 border border-gray-200 text-gray-600 text-[11px] font-semibold rounded-lg hover:bg-gray-50 cursor-pointer"
                    >
                      <i className="ri-restart-line" /> Replace
                    </label>
                  </div>
                </div>
                {/* Resume preview */}
                <div className="border border-gray-100 rounded-xl overflow-hidden h-[400px] bg-gray-50">
                  {candidate.resume_url.endsWith('.pdf') || candidate.resume_name?.endsWith('.pdf') ? (
                    <object
                      data={candidate.resume_url}
                      type="application/pdf"
                      className="w-full h-full"
                    >
                      <div className="flex items-center justify-center h-full flex-col gap-2">
                        <i className="ri-file-pdf-line text-4xl text-gray-300" />
                        <p className="text-[13px] text-gray-500">PDF preview not available</p>
                        <a href={candidate.resume_url} target="_blank" rel="noopener noreferrer" className="text-[13px] text-[#0D7377] font-medium hover:underline">
                          Open in new tab
                        </a>
                      </div>
                    </object>
                  ) : (
                    <iframe
                      src={candidate.resume_url}
                      title="Resume Preview"
                      className="w-full h-full"
                    />
                  )}
                </div>
                <p className="text-[11px] text-gray-400 mt-2 text-center">Preview may not display correctly for all file types</p>
              </div>
            ) : (
              <div className="text-center py-10 border-2 border-dashed border-gray-200 rounded-xl">
                <i className="ri-file-upload-line text-3xl text-gray-300 mb-2 block" />
                <p className="text-[13px] text-gray-500">No resume uploaded yet</p>
                <button
                  type="button"
                  onClick={triggerFileSelect}
                  className="text-[13px] text-[#0D7377] font-medium hover:underline cursor-pointer inline-block mt-2 bg-transparent border-0 p-0"
                >
                  Upload now
                </button>
              </div>
            )}
          </div>

          {/* Interview History */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-[#1A1A1A]">Interview History</h2>
              <div className="flex items-center gap-4 text-[12px] text-gray-500">
                <span>{interviews.length} total</span>
                <span className="text-gray-300">|</span>
                <span>{completedInterviews.length} completed</span>
                <span className="text-gray-300">|</span>
                <span className="text-[#0D7377] font-semibold">Avg Score: {avgScore}</span>
              </div>
            </div>

            {interviews.length > 0 ? (
              <div className="space-y-3">
                {interviews.map((iv) => (
                  <div key={iv.id} className="border border-gray-100 rounded-xl p-4 hover:border-gray-200 transition-colors">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            iv.status === "scheduled" ? "bg-blue-50 text-blue-700" : iv.status === "completed" ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-600"
                          }`}>{iv.status}</span>
                          <span className="text-[12px] text-gray-400">{iv.type} interview</span>
                        </div>
                        <div className="flex items-center gap-3 mt-1.5 text-[12px] text-gray-500">
                          <span className="flex items-center gap-0.5">
                            <i className="ri-calendar-line" />
                            {iv.scheduled_at ? new Date(iv.scheduled_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "TBD"}
                          </span>
                          <span className="flex items-center gap-0.5">
                            <i className="ri-time-line" /> {iv.duration_minutes}m
                          </span>
                          <span className="flex items-center gap-0.5">
                            <i className="ri-user-line" />
                            {iv.employees ? `${iv.employees.first_name} ${iv.employees.last_name}` : "TBD"}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {iv.status === "scheduled" && (
                          <button
                            onClick={() => {
                              setFeedbackModal(iv.id);
                              setFeedbackForm({ feedback: "", score: 3 });
                            }}
                            className="px-3 py-1.5 bg-[#0D7377] text-white text-[11px] font-semibold rounded-lg hover:bg-[#0a5c60]"
                          >
                            Complete
                          </button>
                        )}
                        {iv.status === "completed" && iv.score > 0 && (
                          <span className="text-[12px] font-bold text-amber-600">{iv.score}/5</span>
                        )}
                      </div>
                    </div>
                    {iv.feedback && (
                      <div className="mt-3 p-3 rounded-lg bg-gray-50">
                        <p className="text-[11px] font-semibold text-gray-500 mb-1">Feedback</p>
                        <p className="text-[13px] text-gray-700">{iv.feedback}</p>
                      </div>
                    )}
                    {iv.notes && (
                      <p className="mt-2 text-[12px] text-gray-400">Notes: {iv.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <i className="ri-video-chat-line text-3xl text-gray-300 mb-2 block" />
                <p className="text-[13px] text-gray-500">No interviews scheduled yet</p>
                <button
                  onClick={() => setScheduleModal(true)}
                  className="text-[13px] text-[#0D7377] font-medium hover:underline mt-1"
                >
                  Schedule the first interview
                </button>
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-[#1A1A1A] mb-3">Recruiter Notes</h2>
            <p className="text-[13px] text-gray-600 leading-relaxed whitespace-pre-wrap">
              {candidate.notes || "No notes added for this candidate yet."}
            </p>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Rating Card */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="text-[14px] font-bold text-[#1A1A1A] mb-3">Rating</h3>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  className={`w-8 h-8 flex items-center justify-center transition-colors ${star <= (candidate.rating || 0) ? "text-amber-400" : "text-gray-200"}`}
                  onClick={async () => {
                    await supabase.from("candidates").update({ rating: star }).eq("id", id);
                    setCandidate((prev) => prev ? { ...prev, rating: star } : prev);
                    toast("Rating saved", `${star}/5 stars`, "success");
                  }}
                >
                  <i className="ri-star-fill text-lg" />
                </button>
              ))}
            </div>
            <p className="text-[12px] text-gray-500 mt-2">{(candidate.rating || 0)}/5 stars</p>
          </div>

          {/* Source Info */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="text-[14px] font-bold text-[#1A1A1A] mb-3">Source</h3>
            <div className="flex items-center gap-2 text-[13px] text-gray-700">
              <i className="ri-link text-gray-400" />
              {candidate.source || "Direct Application"}
            </div>
            {candidate.linkedin_url && (
              <a
                href={candidate.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-[13px] text-[#0D7377] hover:underline mt-2"
              >
                <i className="ri-linkedin-box-line" /> LinkedIn Profile
              </a>
            )}
          </div>

          {/* Pipeline Timeline */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="text-[14px] font-bold text-[#1A1A1A] mb-4">Pipeline Timeline</h3>
            <div className="relative pl-5 space-y-4">
              {Object.entries(stageLabels).map(([key, label], idx) => {
                const isDone = ["applied", candidate.stage].includes(key) ||
                  (candidate.stage === "hired" && key !== "rejected") ||
                  (candidate.stage === "offer" && ["applied", "screening", "interview", "offer"].includes(key)) ||
                  (candidate.stage === "interview" && ["applied", "screening", "interview"].includes(key)) ||
                  (candidate.stage === "screening" && ["applied", "screening"].includes(key));
                const isCurrent = key === candidate.stage;
                return (
                  <div key={key} className="relative flex items-center gap-3">
                    <div className={`absolute left-[-18px] w-3 h-3 rounded-full border-2 z-10 ${
                      isCurrent ? "border-[#0D7377] bg-[#0D7377]" : isDone ? "border-[#0D7377] bg-[#0D7377]" : "border-gray-200 bg-white"
                    }`} />
                    {idx < 5 && (
                      <div className={`absolute left-[-16px] top-3 w-0.5 h-full ${isDone ? "bg-[#0D7377]" : "bg-gray-200"}`} />
                    )}
                    <span className={`text-[12px] font-medium ${isCurrent ? "text-[#0D7377] font-bold" : isDone ? "text-gray-700" : "text-gray-400"}`}>
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Contact */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="text-[14px] font-bold text-[#1A1A1A] mb-3">Contact</h3>
            <div className="space-y-2">
              <a href={`mailto:${candidate.email}`} className="flex items-center gap-2 text-[13px] text-gray-700 hover:text-[#0D7377] transition-colors">
                <i className="ri-mail-line text-gray-400" /> {candidate.email}
              </a>
              {candidate.phone && (
                <a href={`tel:${candidate.phone}`} className="flex items-center gap-2 text-[13px] text-gray-700 hover:text-[#0D7377] transition-colors">
                  <i className="ri-phone-line text-gray-400" /> {candidate.phone}
                </a>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="text-[14px] font-bold text-[#1A1A1A] mb-3">Actions</h3>
            <div className="space-y-1">
              <button
                onClick={async () => {
                  if (!id) return;
                  await supabase.from("candidates").update({ stage: "rejected" }).eq("id", id);
                  setCandidate((prev) => prev ? { ...prev, stage: "rejected" } : prev);
                  toast("Candidate rejected", "Moved to rejected stage", "warning");
                }}
                className="w-full text-left flex items-center gap-2 p-2.5 rounded-lg hover:bg-red-50 text-[13px] text-red-600 transition-colors"
              >
                <i className="ri-close-circle-line" /> Reject Candidate
              </button>
              <button
                onClick={async () => {
                  if (!id) return;
                  await supabase.from("candidates").update({ stage: "hired" }).eq("id", id);
                  setCandidate((prev) => prev ? { ...prev, stage: "hired" } : prev);
                  toast("Candidate hired", "Congratulations!", "success");
                }}
                className="w-full text-left flex items-center gap-2 p-2.5 rounded-lg hover:bg-green-50 text-[13px] text-green-600 transition-colors"
              >
                <i className="ri-check-double-line" /> Mark as Hired
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Feedback Modal */}
      {feedbackModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-gray-900">Interview Feedback</h3>
              <button onClick={() => setFeedbackModal(null)} className="p-1 rounded-lg hover:bg-gray-100">
                <i className="ri-close-line text-xl text-gray-500" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-[12px] font-semibold text-gray-700 mb-1">Score (1-5)</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      onClick={() => setFeedbackForm({ ...feedbackForm, score: s })}
                      className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg transition-colors ${
                        s <= feedbackForm.score ? "bg-amber-50 text-amber-500" : "bg-gray-100 text-gray-300"
                      }`}
                    >
                      <i className="ri-star-fill" />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-gray-700 mb-1">Feedback</label>
                <textarea
                  value={feedbackForm.feedback}
                  onChange={(e) => setFeedbackForm({ ...feedbackForm, feedback: e.target.value })}
                  rows={4}
                  placeholder="Enter interview feedback..."
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-[13px] focus:outline-none focus:border-[#0D7377]"
                />
              </div>
              <button
                onClick={() => submitFeedback(feedbackModal)}
                className="w-full py-2.5 bg-[#0D7377] text-white rounded-lg text-[13px] font-semibold hover:bg-[#0a5c60]"
              >
                Submit & Complete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Interview Modal */}
      {scheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-gray-900">Schedule Interview</h3>
              <button onClick={() => setScheduleModal(false)} className="p-1 rounded-lg hover:bg-gray-100">
                <i className="ri-close-line text-xl text-gray-500" />
              </button>
            </div>
            <form onSubmit={scheduleInterview} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-semibold text-gray-700 mb-1">Date & Time</label>
                  <input type="datetime-local" required value={newInterview.scheduled_at} onChange={(e) => setNewInterview({ ...newInterview, scheduled_at: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-[13px] focus:outline-none focus:border-[#0D7377]" />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-gray-700 mb-1">Duration</label>
                  <select value={newInterview.duration_minutes} onChange={(e) => setNewInterview({ ...newInterview, duration_minutes: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-[13px] focus:outline-none focus:border-[#0D7377]">
                    <option value="30">30 min</option>
                    <option value="45">45 min</option>
                    <option value="60">1 hour</option>
                    <option value="90">1.5 hours</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-gray-700 mb-1">Type</label>
                <select value={newInterview.type} onChange={(e) => setNewInterview({ ...newInterview, type: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-[13px] focus:outline-none focus:border-[#0D7377]">
                  <option value="video">Video Call</option>
                  <option value="in-person">In Person</option>
                  <option value="phone">Phone</option>
                </select>
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-gray-700 mb-1">Notes</label>
                <textarea value={newInterview.notes} onChange={(e) => setNewInterview({ ...newInterview, notes: e.target.value })} rows={2} className="w-full px-3 py-2 rounded-lg border border-gray-200 text-[13px] focus:outline-none focus:border-[#0D7377]" />
              </div>
              <button type="submit" className="w-full py-2.5 bg-[#0D7377] text-white rounded-lg text-[13px] font-semibold hover:bg-[#0a5c60]">
                Schedule Interview
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}