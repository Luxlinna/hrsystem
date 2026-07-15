import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

interface Review {
  id: string;
  employee_id: string;
  reviewer_id: string;
  quarter: string;
  year: number;
  overall_score: number | null;
  communication_score: number | null;
  teamwork_score: number | null;
  technical_score: number | null;
  leadership_score: number | null;
  comments: string | null;
  strengths: string | null;
  areas_for_improvement: string | null;
  status: string;
  submitted_at: string | null;
  created_at: string;
  employee?: { first_name: string; last_name: string; role: string; department: string };
  reviewer?: { first_name: string; last_name: string };
}

interface Goal {
  id: string;
  employee_id: string;
  title: string;
  description: string;
  target_date: string;
  progress: number;
  status: string;
}

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
  department: string;
}

const scoreColor = (s: number) => {
  if (s >= 4.5) return "text-emerald-600";
  if (s >= 3.5) return "text-[#0D7377]";
  if (s >= 2.5) return "text-amber-600";
  return "text-red-500";
};

const scoreBg = (s: number) => {
  if (s >= 4.5) return "bg-emerald-50";
  if (s >= 3.5) return "bg-[#0D7377]/10";
  if (s >= 2.5) return "bg-amber-50";
  return "bg-red-50";
};

const progressColor = (p: number) => {
  if (p >= 80) return "bg-emerald-500";
  if (p >= 50) return "bg-[#0D7377]";
  if (p >= 25) return "bg-amber-500";
  return "bg-red-400";
};

export default function PerformanceReviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"reviews" | "goals" | "submit">("reviews");
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [filterQ, setFilterQ] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterDept, setFilterDept] = useState("all");
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [goalForm, setGoalForm] = useState({ employee_id: "", title: "", description: "", target_date: "", progress: 0, status: "active" });
  const [reviewForm, setReviewForm] = useState({
    employee_id: "", reviewer_id: "", quarter: "Q2", year: 2026,
    communication_score: 3, teamwork_score: 3, technical_score: 3, leadership_score: 3,
    comments: "", strengths: "", areas_for_improvement: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    const [{ data: r }, { data: g }, { data: e }] = await Promise.all([
      supabase.from("performance_reviews").select(`*, employee:employees!performance_reviews_employee_id_fkey(first_name, last_name, role, department), reviewer:employees!performance_reviews_reviewer_id_fkey(first_name, last_name)`).order("created_at", { ascending: false }),
      supabase.from("performance_goals").select("*").order("target_date"),
      supabase.from("employees").select("id, first_name, last_name, role, department").order("first_name"),
    ]);
    setReviews(r || []);
    setGoals(g || []);
    setEmployees(e || []);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const overall = ((reviewForm.communication_score + reviewForm.teamwork_score + reviewForm.technical_score + reviewForm.leadership_score) / 4);
    await supabase.from("performance_reviews").insert({
      ...reviewForm,
      overall_score: parseFloat(overall.toFixed(1)),
      status: "submitted",
      submitted_at: new Date().toISOString(),
    });
    setReviewForm({ employee_id: "", reviewer_id: "", quarter: "Q2", year: 2026, communication_score: 3, teamwork_score: 3, technical_score: 3, leadership_score: 3, comments: "", strengths: "", areas_for_improvement: "" });
    setSubmitting(false);
    loadData();
    setActiveTab("reviews");
  };

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    await supabase.from("performance_goals").insert(goalForm);
    setGoalForm({ employee_id: "", title: "", description: "", target_date: "", progress: 0, status: "active" });
    setShowGoalModal(false);
    setSubmitting(false);
    loadData();
  };

  const updateGoalProgress = async (goalId: string, progress: number) => {
    await supabase.from("performance_goals").update({ progress, status: progress >= 100 ? "completed" : "active" }).eq("id", goalId);
    setGoals((prev) => prev.map((g) => g.id === goalId ? { ...g, progress, status: progress >= 100 ? "completed" : "active" } : g));
  };

  const filteredReviews = reviews.filter((r) => {
    const matchQ = filterQ === "all" || `${r.quarter} ${r.year}` === filterQ || r.quarter === filterQ;
    const matchS = filterStatus === "all" || r.status === filterStatus;
    const matchD = filterDept === "all" || r.employee?.department === filterDept;
    return matchQ && matchS && matchD;
  });

  const departments = [...new Set(employees.map((e) => e.department))];
  const avgScore = reviews.filter((r) => r.overall_score).reduce((sum, r) => sum + (r.overall_score || 0), 0) / Math.max(reviews.filter((r) => r.overall_score).length, 1);
  const submitted = reviews.filter((r) => r.status === "submitted").length;
  const drafts = reviews.filter((r) => r.status === "draft").length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-[#0D7377] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <div className="p-6 lg:p-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#1A1A1A]" style={{ fontFamily: "'Playfair Display', serif" }}>
              Performance Reviews
            </h1>
            <p className="text-[13px] text-gray-500 mt-1">Quarterly ratings, comments, and goals tracking</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowGoalModal(true)}
              className="inline-flex items-center gap-2 border border-[#0D7377] text-[#0D7377] px-4 py-2.5 rounded-lg text-[13px] font-semibold hover:bg-[#0D7377]/5 transition-colors whitespace-nowrap cursor-pointer"
            >
              <i className="ri-flag-line" /> Add Goal
            </button>
            <button
              onClick={() => setActiveTab("submit")}
              className="inline-flex items-center gap-2 bg-[#0D7377] text-white px-4 py-2.5 rounded-lg text-[13px] font-semibold hover:bg-[#0a5c60] transition-colors whitespace-nowrap cursor-pointer"
            >
              <i className="ri-add-line" /> Submit Review
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {[
            { label: "Total Reviews", value: reviews.length, icon: "ri-file-list-3-line", color: "text-[#0D7377]" },
            { label: "Submitted", value: submitted, icon: "ri-checkbox-circle-line", color: "text-emerald-600" },
            { label: "Drafts", value: drafts, icon: "ri-draft-line", color: "text-amber-600" },
            { label: "Avg Score", value: avgScore.toFixed(1) + " / 5", icon: "ri-star-line", color: "text-violet-600" },
          ].map((s) => (
            <div key={s.label} className="bg-white border border-gray-100 rounded-xl p-4">
              <i className={`${s.icon} ${s.color} text-xl`} />
              <p className="text-xl font-bold text-gray-900 mt-2">{s.value}</p>
              <p className="text-[11px] text-gray-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 w-fit">
          {(["reviews", "goals", "submit"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`px-5 py-2 rounded-lg text-[13px] font-semibold transition-all capitalize cursor-pointer ${
                activeTab === t ? "bg-white text-gray-900" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {t === "submit" ? "Submit Review" : t === "goals" ? "Goals Tracker" : "All Reviews"}
            </button>
          ))}
        </div>

        {/* Reviews Tab */}
        {activeTab === "reviews" && (
          <div className="flex gap-6">
            <div className={`flex-1 transition-all ${selectedReview ? "max-w-[60%]" : ""}`}>
              {/* Filters */}
              <div className="flex flex-wrap gap-3 mb-4">
                <select value={filterQ} onChange={(e) => setFilterQ(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:border-[#0D7377] cursor-pointer">
                  <option value="all">All Quarters</option>
                  <option value="Q1">Q1 2026</option>
                  <option value="Q2">Q2 2026</option>
                </select>
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:border-[#0D7377] cursor-pointer">
                  <option value="all">All Status</option>
                  <option value="submitted">Submitted</option>
                  <option value="draft">Draft</option>
                </select>
                <select value={filterDept} onChange={(e) => setFilterDept(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:border-[#0D7377] cursor-pointer">
                  <option value="all">All Departments</option>
                  {departments.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              <div className="space-y-3">
                {filteredReviews.map((r) => (
                  <div
                    key={r.id}
                    onClick={() => setSelectedReview(selectedReview?.id === r.id ? null : r)}
                    className={`bg-white border rounded-xl p-5 cursor-pointer hover:border-[#0D7377]/30 transition-all ${selectedReview?.id === r.id ? "border-[#0D7377] ring-2 ring-[#0D7377]/10" : "border-gray-100"}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[#0D7377]/10 flex items-center justify-center text-[#0D7377] font-bold text-xs">
                          {r.employee?.first_name?.[0]}{r.employee?.last_name?.[0]}
                        </div>
                        <div>
                          <p className="text-[14px] font-semibold text-gray-900">{r.employee?.first_name} {r.employee?.last_name}</p>
                          <p className="text-[11px] text-gray-500">{r.employee?.role} &middot; {r.employee?.department}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[11px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{r.quarter} {r.year}</span>
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${r.status === "submitted" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                          {r.status}
                        </span>
                        {r.overall_score && (
                          <span className={`text-[15px] font-bold ${scoreColor(r.overall_score)}`}>
                            {r.overall_score}
                          </span>
                        )}
                      </div>
                    </div>

                    {r.overall_score && (
                      <div className="mt-4 grid grid-cols-4 gap-2">
                        {[
                          { label: "Communication", score: r.communication_score },
                          { label: "Teamwork", score: r.teamwork_score },
                          { label: "Technical", score: r.technical_score },
                          { label: "Leadership", score: r.leadership_score },
                        ].map((metric) => (
                          <div key={metric.label} className={`rounded-lg p-2 text-center ${scoreBg(metric.score || 0)}`}>
                            <p className={`text-[14px] font-bold ${scoreColor(metric.score || 0)}`}>{metric.score}</p>
                            <p className="text-[9px] text-gray-500 mt-0.5">{metric.label}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {r.comments && (
                      <p className="mt-3 text-[12px] text-gray-600 line-clamp-2 border-t border-gray-50 pt-3">
                        &ldquo;{r.comments}&rdquo;
                      </p>
                    )}
                  </div>
                ))}

                {filteredReviews.length === 0 && (
                  <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
                    <i className="ri-file-list-3-line text-4xl text-gray-200" />
                    <p className="text-gray-400 mt-2">No reviews found</p>
                  </div>
                )}
              </div>
            </div>

            {/* Detail Panel */}
            {selectedReview && (
              <div className="w-[380px] shrink-0">
                <div className="bg-white border border-gray-100 rounded-xl overflow-hidden sticky top-6">
                  <div className="bg-gradient-to-br from-[#0D7377] to-[#14919B] p-5 text-white">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-[11px] text-white/60">{selectedReview.quarter} {selectedReview.year} Review</p>
                        <h3 className="text-base font-bold mt-1">{selectedReview.employee?.first_name} {selectedReview.employee?.last_name}</h3>
                        <p className="text-[12px] text-white/70">{selectedReview.employee?.role}</p>
                      </div>
                      <button onClick={() => setSelectedReview(null)} className="w-7 h-7 flex items-center justify-center rounded-lg bg-white/20 cursor-pointer">
                        <i className="ri-close-line text-white text-sm" />
                      </button>
                    </div>
                    {selectedReview.overall_score && (
                      <div className="mt-4 bg-white/15 rounded-lg p-3 flex items-center justify-between">
                        <span className="text-[12px] text-white/80">Overall Score</span>
                        <span className="text-2xl font-black">{selectedReview.overall_score}</span>
                      </div>
                    )}
                  </div>

                  <div className="p-5 space-y-4 overflow-y-auto max-h-[500px]">
                    {selectedReview.comments && (
                      <div>
                        <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Manager Comments</p>
                        <p className="text-[13px] text-gray-700 leading-relaxed">{selectedReview.comments}</p>
                      </div>
                    )}
                    {selectedReview.strengths && (
                      <div>
                        <p className="text-[11px] font-semibold text-emerald-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <i className="ri-thumb-up-line" /> Strengths
                        </p>
                        <p className="text-[13px] text-gray-700 leading-relaxed">{selectedReview.strengths}</p>
                      </div>
                    )}
                    {selectedReview.areas_for_improvement && (
                      <div>
                        <p className="text-[11px] font-semibold text-amber-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <i className="ri-arrow-up-circle-line" /> Areas for Growth
                        </p>
                        <p className="text-[13px] text-gray-700 leading-relaxed">{selectedReview.areas_for_improvement}</p>
                      </div>
                    )}
                    <div className="pt-2 border-t border-gray-100">
                      <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Reviewed by</p>
                      <p className="text-[13px] text-gray-700">{selectedReview.reviewer?.first_name} {selectedReview.reviewer?.last_name}</p>
                      {selectedReview.submitted_at && (
                        <p className="text-[11px] text-gray-400 mt-1">
                          Submitted {new Date(selectedReview.submitted_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Goals Tab */}
        {activeTab === "goals" && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {goals.map((g) => {
                const emp = employees.find((e) => e.id === g.employee_id);
                const isOverdue = g.target_date && new Date(g.target_date) < new Date() && g.status !== "completed";
                return (
                  <div key={g.id} className="bg-white border border-gray-100 rounded-xl p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0 pr-2">
                        <p className="text-[14px] font-semibold text-gray-900 leading-tight">{g.title}</p>
                        {emp && <p className="text-[11px] text-gray-500 mt-1">{emp.first_name} {emp.last_name} &middot; {emp.department}</p>}
                      </div>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap shrink-0 ${
                        g.status === "completed" ? "bg-emerald-50 text-emerald-700" :
                        isOverdue ? "bg-red-50 text-red-600" :
                        "bg-[#0D7377]/10 text-[#0D7377]"
                      }`}>
                        {isOverdue ? "Overdue" : g.status}
                      </span>
                    </div>
                    {g.description && <p className="text-[12px] text-gray-500 mb-3 line-clamp-2">{g.description}</p>}
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] text-gray-500">Progress</span>
                        <span className="text-[12px] font-bold text-gray-700">{g.progress}%</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full ${progressColor(g.progress)} rounded-full transition-all`} style={{ width: `${g.progress}%` }} />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-gray-400">
                        Due: {g.target_date ? new Date(g.target_date).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—"}
                      </span>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        step={5}
                        value={g.progress}
                        onChange={(e) => updateGoalProgress(g.id, parseInt(e.target.value))}
                        className="w-20 h-1 accent-[#0D7377] cursor-pointer"
                      />
                    </div>
                  </div>
                );
              })}

              {goals.length === 0 && (
                <div className="col-span-3 text-center py-16 bg-white rounded-xl border border-gray-100">
                  <i className="ri-flag-line text-4xl text-gray-200" />
                  <p className="text-gray-400 mt-2">No goals yet. Add one to start tracking!</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Submit Review Tab */}
        {activeTab === "submit" && (
          <div className="max-w-2xl">
            <div className="bg-white border border-gray-100 rounded-xl p-6">
              <h2 className="text-[16px] font-bold text-gray-900 mb-5">Submit Quarterly Review</h2>
              <form onSubmit={handleSubmitReview} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Employee *</label>
                    <select required value={reviewForm.employee_id} onChange={(e) => setReviewForm({ ...reviewForm, employee_id: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0D7377] cursor-pointer">
                      <option value="">Select employee</option>
                      {employees.map((e) => <option key={e.id} value={e.id}>{e.first_name} {e.last_name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Reviewer *</label>
                    <select required value={reviewForm.reviewer_id} onChange={(e) => setReviewForm({ ...reviewForm, reviewer_id: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0D7377] cursor-pointer">
                      <option value="">Select reviewer</option>
                      {employees.map((e) => <option key={e.id} value={e.id}>{e.first_name} {e.last_name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Quarter</label>
                    <select value={reviewForm.quarter} onChange={(e) => setReviewForm({ ...reviewForm, quarter: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0D7377] cursor-pointer">
                      <option>Q1</option><option>Q2</option><option>Q3</option><option>Q4</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Year</label>
                    <select value={reviewForm.year} onChange={(e) => setReviewForm({ ...reviewForm, year: parseInt(e.target.value) })} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0D7377] cursor-pointer">
                      <option value={2026}>2026</option><option value={2025}>2025</option>
                    </select>
                  </div>
                </div>

                <div>
                  <p className="text-[12px] font-semibold text-gray-700 mb-3">Scores (1–5)</p>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { key: "communication_score", label: "Communication" },
                      { key: "teamwork_score", label: "Teamwork" },
                      { key: "technical_score", label: "Technical" },
                      { key: "leadership_score", label: "Leadership" },
                    ].map((m) => (
                      <div key={m.key}>
                        <label className="block text-[11px] text-gray-500 mb-1.5">{m.label}</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="range"
                            min={1}
                            max={5}
                            step={0.5}
                            value={(reviewForm as any)[m.key]}
                            onChange={(e) => setReviewForm({ ...reviewForm, [m.key]: parseFloat(e.target.value) })}
                            className="flex-1 accent-[#0D7377]"
                          />
                          <span className={`text-[14px] font-bold w-8 text-right ${scoreColor((reviewForm as any)[m.key])}`}>
                            {(reviewForm as any)[m.key]}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 bg-[#0D7377]/5 rounded-lg p-3 text-center">
                    <p className="text-[11px] text-gray-500">Overall Score</p>
                    <p className={`text-2xl font-black ${scoreColor((reviewForm.communication_score + reviewForm.teamwork_score + reviewForm.technical_score + reviewForm.leadership_score) / 4)}`}>
                      {((reviewForm.communication_score + reviewForm.teamwork_score + reviewForm.technical_score + reviewForm.leadership_score) / 4).toFixed(1)}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Comments</label>
                  <textarea
                    value={reviewForm.comments}
                    onChange={(e) => setReviewForm({ ...reviewForm, comments: e.target.value })}
                    rows={3}
                    placeholder="Overall performance summary..."
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0D7377] resize-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Strengths</label>
                    <textarea
                      value={reviewForm.strengths}
                      onChange={(e) => setReviewForm({ ...reviewForm, strengths: e.target.value })}
                      rows={2}
                      placeholder="Key strengths..."
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0D7377] resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Areas for Improvement</label>
                    <textarea
                      value={reviewForm.areas_for_improvement}
                      onChange={(e) => setReviewForm({ ...reviewForm, areas_for_improvement: e.target.value })}
                      rows={2}
                      placeholder="Growth areas..."
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0D7377] resize-none"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 bg-[#0D7377] text-white font-semibold rounded-lg hover:bg-[#0a5c60] transition-colors disabled:opacity-60 cursor-pointer"
                >
                  {submitting ? "Submitting..." : "Submit Review"}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Add Goal Modal */}
      {showGoalModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-[15px] font-bold text-gray-900">Add Performance Goal</h2>
              <button onClick={() => setShowGoalModal(false)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 cursor-pointer">
                <i className="ri-close-line text-gray-500 text-sm" />
              </button>
            </div>
            <form onSubmit={handleAddGoal} className="p-5 space-y-4">
              <div>
                <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Employee *</label>
                <select required value={goalForm.employee_id} onChange={(e) => setGoalForm({ ...goalForm, employee_id: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0D7377] cursor-pointer">
                  <option value="">Select employee</option>
                  {employees.map((e) => <option key={e.id} value={e.id}>{e.first_name} {e.last_name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Goal Title *</label>
                <input required type="text" value={goalForm.title} onChange={(e) => setGoalForm({ ...goalForm, title: e.target.value })} placeholder="e.g., Complete AWS Certification" className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0D7377]" />
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Description</label>
                <textarea value={goalForm.description} onChange={(e) => setGoalForm({ ...goalForm, description: e.target.value })} rows={2} placeholder="Goal details..." className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0D7377] resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Target Date</label>
                  <input type="date" value={goalForm.target_date} onChange={(e) => setGoalForm({ ...goalForm, target_date: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0D7377]" />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Initial Progress ({goalForm.progress}%)</label>
                  <input type="range" min={0} max={100} step={5} value={goalForm.progress} onChange={(e) => setGoalForm({ ...goalForm, progress: parseInt(e.target.value) })} className="w-full mt-2 accent-[#0D7377]" />
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowGoalModal(false)} className="flex-1 py-2.5 border border-gray-200 text-gray-700 text-[13px] font-medium rounded-lg hover:bg-gray-50 cursor-pointer">Cancel</button>
                <button type="submit" disabled={submitting} className="flex-1 py-2.5 bg-[#0D7377] text-white text-[13px] font-semibold rounded-lg hover:bg-[#0a5c60] disabled:opacity-60 cursor-pointer">
                  {submitting ? "Adding..." : "Add Goal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}