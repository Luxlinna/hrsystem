import { memo, useState, useEffect } from "react";
import type { Candidate, Interview } from "../../types";
import { getStageInterview } from "../../constants/evidenceConfig";
import { parseInterviewPanelFromNotes } from "../../utils/interviewPanelHelper";

interface InterviewEvaluationModalProps {
  isOpen: boolean;
  stageKey: string | null;
  candidate: Candidate;
  interviews: Interview[];
  targetInterview?: Interview | null;
  defaultEvaluatorName: string;
  canUserFeedback?: boolean;
  onClose: () => void;
  onSubmitEvaluation: (payload: {
    stageKey: string;
    evaluatorName: string;
    date: string;
    overallScore: number;
    recommendation: "strong_hire" | "advance" | "hold" | "reject";
    competencies: Record<string, number>;
    strengths: string;
    concerns: string;
    notes: string;
    interviewId?: string;
  }) => Promise<void>;
  submitting?: boolean;
}

const STAGE_FORM_METADATA: Record<
  string,
  {
    title: string;
    subtitle: string;
    badge: string;
    responsible: string;
    criteria: string[];
  }
> = {
  hr_interview: {
    title: "HR Interview Evaluation Form",
    subtitle: "Screening cultural alignment, interpersonal readiness & salary expectations",
    badge: "Stage 4 • HR Interview",
    responsible: "HR Manager / Recruiter",
    criteria: [
      "Cultural Fit & Value Alignment",
      "Communication & Interpersonal Clarity",
      "Career Motivation & Compensation Fit",
    ],
  },
  hiring_manager_interview: {
    title: "Hiring Manager Technical Evaluation Form",
    subtitle: "In-depth functional assessment, problem solving & domain competencies",
    badge: "Stage 5 • Technical Round",
    responsible: "Hiring Manager",
    criteria: [
      "Technical Competency & Domain Depth",
      "Practical Problem Solving & Logic",
      "Execution Speed & Architecture Readiness",
    ],
  },
  final_interview: {
    title: "Final Executive Appraisal Form",
    subtitle: "Executive leadership sign-off, vision alignment & final endorsement",
    badge: "Stage 6 • Executive Round",
    responsible: "CEO / Division Director",
    criteria: [
      "Strategic Alignment & Growth Mindset",
      "Leadership Presence & Team Synergy",
      "Executive Readiness & Culture Impact",
    ],
  },
};

const RECOMMENDATIONS = [
  { key: "strong_hire", label: "Strong Hire", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  { key: "advance", label: "Advance to Next Round", color: "bg-blue-50 text-blue-700 border-blue-200" },
  { key: "hold", label: "On Hold / Re-evaluate", color: "bg-amber-50 text-amber-700 border-amber-200" },
  { key: "reject", label: "Do Not Proceed", color: "bg-rose-50 text-rose-700 border-rose-200" },
] as const;

export const InterviewEvaluationModal = memo(function InterviewEvaluationModal({
  isOpen,
  stageKey,
  candidate,
  interviews,
  targetInterview,
  defaultEvaluatorName,
  canUserFeedback = true,
  onClose,
  onSubmitEvaluation,
  submitting = false,
}: InterviewEvaluationModalProps) {
  if (!isOpen || !stageKey) return null;

  const meta = STAGE_FORM_METADATA[stageKey] || {
    title: "Interview Evaluation Form",
    subtitle: "Candidate assessment and scorecard submission",
    badge: "Interview Stage",
    responsible: "Interview Panel",
    criteria: ["Core Competencies", "Communication Clarity", "Role Fit"],
  };

  // Find existing interview record reliably
  const existingInterview = targetInterview || getStageInterview(stageKey, interviews);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/45 backdrop-blur-xs overflow-y-auto no-scrollbar"
      onClick={() => !submitting && onClose()}
    >
      <div
        className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col my-8 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 bg-white flex items-center justify-between gap-4 shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200">
                {meta.badge}
              </span>
              <span className="text-xs text-gray-400 font-medium">Mandatory Audit Evidence</span>
            </div>
            <h3 className="text-base sm:text-lg font-black text-gray-900 tracking-tight">
              {meta.title}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">{meta.subtitle}</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 flex items-center justify-center transition-colors cursor-pointer"
          >
            <i className="ri-close-line text-lg" />
          </button>
        </div>

        <EvaluationFormContent
          meta={meta}
          stageKey={stageKey}
          candidate={candidate}
          existingInterview={existingInterview}
          defaultEvaluatorName={defaultEvaluatorName}
          canUserFeedback={canUserFeedback}
          submitting={submitting}
          onClose={onClose}
          onSubmit={onSubmitEvaluation}
        />
      </div>
    </div>
  );
});

interface EvaluationFormContentProps {
  meta: {
    title: string;
    subtitle: string;
    badge: string;
    responsible: string;
    criteria: string[];
  };
  stageKey: string;
  candidate: Candidate;
  existingInterview?: Interview;
  defaultEvaluatorName: string;
  canUserFeedback?: boolean;
  submitting: boolean;
  onClose: () => void;
  onSubmit: InterviewEvaluationModalProps["onSubmitEvaluation"];
}

function parseInterviewFeedback(feedback?: string | null, currentEvaluatorName?: string) {
  if (!feedback) return { strengths: "", concerns: "", remarks: "", rec: "advance" as const, score: undefined, evaluator: "" };

  const blocks = feedback.split(/\n\s*---\s*\n/).map((b) => b.trim()).filter(Boolean);

  let targetBlock = blocks[0] || feedback;
  if (currentEvaluatorName && blocks.length > 1) {
    const cleanCurrent = currentEvaluatorName.trim().toLowerCase();
    const matched = blocks.find((b) => {
      const evalLine = b.split("\n").find((l) => l.toLowerCase().startsWith("evaluator:"));
      if (!evalLine) return false;
      const evalName = evalLine.replace(/evaluator:\s*/i, "").trim().toLowerCase();
      return evalName === cleanCurrent || evalName.includes(cleanCurrent) || cleanCurrent.includes(evalName);
    });
    if (matched) {
      targetBlock = matched;
    } else {
      // Current evaluator hasn't submitted their feedback yet for this panel session
      return { strengths: "", concerns: "", remarks: "", rec: "advance" as const, score: undefined, evaluator: currentEvaluatorName };
    }
  }

  if (targetBlock.includes("[EVALUATION FORM:")) {
    const lines = targetBlock.split("\n");
    let strengths = "";
    let concerns = "";
    let remarks = "";
    let evaluator = "";
    let rec: "strong_hire" | "advance" | "hold" | "reject" = "advance";
    let score: number | undefined = undefined;

    lines.forEach((line) => {
      if (line.startsWith("Evaluator: ")) evaluator = line.replace("Evaluator: ", "").trim();
      else if (line.startsWith("Strengths: ")) strengths = line.replace("Strengths: ", "").trim();
      else if (line.startsWith("Concerns: ")) concerns = line.replace("Concerns: ", "").trim();
      else if (line.startsWith("Remarks: ")) remarks = line.replace("Remarks: ", "").trim();
      else if (line.startsWith("Score: ")) {
        const match = line.match(/Score:\s*(\d+(\.\d+)?)/);
        if (match) score = parseFloat(match[1]);
      } else if (line.startsWith("Recommendation: ")) {
        const r = line.toLowerCase();
        if (r.includes("strong")) rec = "strong_hire";
        else if (r.includes("hold")) rec = "hold";
        else if (r.includes("not proceed") || r.includes("reject")) rec = "reject";
        else rec = "advance";
      }
    });

    return { strengths, concerns, remarks: remarks || targetBlock, rec, score, evaluator };
  }

  // Plain feedback text from simple feedback modal
  return { strengths: "", concerns: "", remarks: targetBlock.trim(), rec: "advance" as const, score: undefined, evaluator: "" };
}

function EvaluationFormContent({
  meta,
  stageKey,
  candidate,
  existingInterview,
  defaultEvaluatorName,
  canUserFeedback,
  submitting,
  onClose,
  onSubmit,
}: EvaluationFormContentProps) {
  const panelInfo = existingInterview?.notes ? parseInterviewPanelFromNotes(existingInterview.notes) : null;
  const currentUserName = (defaultEvaluatorName || "").trim();

  // Match the logged-in user to their invited panel member name if present
  const matchedPanelMember = panelInfo?.panelMembers?.find((m) => {
    if (!currentUserName) return false;
    const mName = m.name.trim().toLowerCase();
    const cur = currentUserName.toLowerCase();
    return mName === cur || mName.includes(cur) || cur.includes(mName);
  });

  const resolvedInitialEvaluator =
    matchedPanelMember?.name ||
    currentUserName ||
    (existingInterview?.employees
      ? `${existingInterview.employees.first_name || ""} ${existingInterview.employees.last_name || ""}`.trim()
      : "Evaluator");

  const initialParsed = parseInterviewFeedback(existingInterview?.feedback, resolvedInitialEvaluator);
  const cleanIvNotes = (existingInterview?.notes || "")
    .replace(/\[Stage:.*?\]\s*/g, "")
    .replace(/\[Panel:.*?\]\s*/g, "")
    .replace(/\[PanelIds:.*?\]\s*/g, "")
    .replace(/\[Format:.*?\]\s*/g, "")
    .trim();

  const [evaluator, setEvaluator] = useState(
    initialParsed.evaluator || resolvedInitialEvaluator
  );
  const [date, setDate] = useState(
    existingInterview?.scheduled_at ? existingInterview.scheduled_at.split("T")[0] : new Date().toISOString().split("T")[0]
  );
  const [overallScore, setOverallScore] = useState<number>(
    initialParsed.score || existingInterview?.score || (candidate.rating && candidate.rating > 0 ? candidate.rating : 4)
  );
  const [recommendation, setRecommendation] = useState<"strong_hire" | "advance" | "hold" | "reject">(
    initialParsed.rec || "advance"
  );
  const [competencyScores, setCompetencyScores] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    meta.criteria.forEach((c) => {
      init[c] = existingInterview?.score ? Math.round(existingInterview.score) : 4;
    });
    return init;
  });
  const [strengths, setStrengths] = useState(initialParsed.strengths || "");
  const [concerns, setConcerns] = useState(initialParsed.concerns || "");
  const [notes, setNotes] = useState(
    initialParsed.remarks || cleanIvNotes || candidate.notes || ""
  );

  useEffect(() => {
    if (existingInterview) {
      const p = parseInterviewFeedback(existingInterview.feedback, resolvedInitialEvaluator);
      const clean = (existingInterview.notes || "")
        .replace(/\[Stage:.*?\]\s*/g, "")
        .replace(/\[Panel:.*?\]\s*/g, "")
        .replace(/\[PanelIds:.*?\]\s*/g, "")
        .replace(/\[Format:.*?\]\s*/g, "")
        .trim();

      if (p.score) setOverallScore(p.score);
      else if (existingInterview.score) setOverallScore(existingInterview.score);

      const resolvedNotes = p.remarks || clean || candidate.notes || "";
      if (resolvedNotes) setNotes(resolvedNotes);

      if (p.strengths) setStrengths(p.strengths);
      if (p.concerns) setConcerns(p.concerns);
      if (p.rec) setRecommendation(p.rec);

      if (p.evaluator) {
        setEvaluator(p.evaluator);
      } else {
        setEvaluator(resolvedInitialEvaluator);
      }

      if (existingInterview.scheduled_at) {
        setDate(existingInterview.scheduled_at.split("T")[0]);
      }
    } else if (candidate.notes) {
      setNotes((prev) => prev || candidate.notes || "");
      if (candidate.rating) setOverallScore(candidate.rating);
    }
  }, [existingInterview, candidate.notes, candidate.rating, resolvedInitialEvaluator]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      stageKey,
      evaluatorName: evaluator.trim() || resolvedInitialEvaluator || "Evaluator",
      date,
      overallScore,
      recommendation,
      competencies: competencyScores,
      strengths: strengths.trim(),
      concerns: concerns.trim(),
      notes: notes.trim(),
      interviewId: existingInterview?.id,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
      {!canUserFeedback && (
        <div className="flex items-center gap-2.5 p-3.5 bg-amber-50 rounded-2xl border border-amber-200 text-xs font-semibold text-amber-800">
          <i className="ri-lock-line text-base text-amber-600 shrink-0" />
          <span>Access Restricted: You were not invited by the recruiter to interview this candidate. Only invited interviewers or recruiters can record evaluation feedback.</span>
        </div>
      )}

      {/* Candidate Banner */}
      <div className="flex items-center justify-between p-3.5 bg-gray-50/80 rounded-2xl border border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#253C7D] text-white flex items-center justify-center font-bold text-sm">
            {candidate.full_name?.charAt(0) || "C"}
          </div>
          <div>
            <h4 className="text-sm font-bold text-gray-900">{candidate.full_name}</h4>
            <p className="text-xs text-gray-500">
              Target: {candidate.job_postings?.title || "Applicant"} • {candidate.candidate_code || "CAN"}
            </p>
          </div>
        </div>
        <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-white border border-gray-200 text-gray-600">
          Responsible: {meta.responsible}
        </span>
      </div>

      {/* Meta Row: Evaluator & Date */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wider block mb-1.5">
            Interviewer / Evaluator <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={evaluator}
            onChange={(e) => setEvaluator(e.target.value)}
            placeholder="e.g. Thorng Dararith (HR)"
            className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D]"
          />
          {panelInfo?.panelMembers && panelInfo.panelMembers.length > 1 && (
            <p className="text-[10px] text-gray-500 mt-1.5 flex items-center gap-1">
              <i className="ri-team-line text-[#253C7D]" />
              <span>
                Invited Panel: <strong>{panelInfo.panelMembers.map((m) => m.name).join(", ")}</strong> (Each interviewer records feedback with their own account)
              </span>
            </p>
          )}
        </div>

        <div>
          <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wider block mb-1.5">
            Interview Date <span className="text-rose-500">*</span>
          </label>
          <input
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D]"
          />
        </div>
      </div>

      {/* Competency Ratings */}
      <div>
        <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wider block mb-2">
          Competency Criteria Ratings (1–5)
        </label>
        <div className="space-y-2.5 bg-gray-50/60 p-3.5 rounded-2xl border border-gray-100">
          {meta.criteria.map((crit) => {
            const score = competencyScores[crit] || 4;
            return (
              <div key={crit} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-xs font-semibold text-gray-700">{crit}</span>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() =>
                        setCompetencyScores((prev) => ({
                          ...prev,
                          [crit]: val,
                        }))
                      }
                      className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        val === score
                          ? "bg-[#253C7D] text-white shadow-2xs scale-105"
                          : "bg-white border border-gray-200 text-gray-500 hover:border-gray-400"
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Overall Score */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">
            Overall Performance Rating
          </label>
          <span className="text-xs font-black text-[#253C7D]">
            {overallScore === 5
              ? "5/5 - Exceptional Fit"
              : overallScore === 4
              ? "4/5 - Strong Candidate"
              : overallScore === 3
              ? "3/5 - Meets Requirements"
              : overallScore === 2
              ? "2/5 - Borderline / Gaps"
              : "1/5 - Unsatisfactory"}
          </span>
        </div>
        <div className="flex items-center justify-center gap-3 py-2.5 bg-gray-50 rounded-2xl border border-gray-100">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setOverallScore(star)}
              className={`text-2xl cursor-pointer transition-transform hover:scale-115 ${
                star <= overallScore ? "text-amber-400" : "text-gray-200"
              }`}
            >
              <i className={star <= overallScore ? "ri-star-fill" : "ri-star-line"} />
            </button>
          ))}
        </div>
      </div>

      {/* Recommendation Selector */}
      <div>
        <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wider block mb-2">
          Final Recommendation
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {RECOMMENDATIONS.map((rec) => {
            const isSelected = recommendation === rec.key;
            return (
              <button
                key={rec.key}
                type="button"
                onClick={() => setRecommendation(rec.key)}
                className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                  isSelected ? `${rec.color} ring-2 ring-[#253C7D]/20 shadow-2xs font-extrabold` : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                {rec.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Strengths & Concerns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wider block mb-1">
            Candidate Strengths & Highlights
          </label>
          <textarea
            rows={2}
            value={strengths}
            onChange={(e) => setStrengths(e.target.value)}
            placeholder="Key technical depth, excellent communication, relevant past wins..."
            className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D]"
          />
        </div>

        <div>
          <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wider block mb-1">
            Areas of Concern / Red Flags
          </label>
          <textarea
            rows={2}
            value={concerns}
            onChange={(e) => setConcerns(e.target.value)}
            placeholder="Skill gaps, notice period risks, compensation mismatch..."
            className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D]"
          />
        </div>
      </div>

      {/* Full Evaluation Remarks */}
      <div>
        <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wider block mb-1">
          Detailed Evaluation Remarks & Sign-off Notes <span className="text-rose-500">*</span>
        </label>
        <textarea
          rows={3}
          required
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Detailed synthesis of candidate responses, behavioral observations, and justification for recommendation..."
          className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D]"
        />
      </div>

      {/* Action Footer */}
      <div className="pt-4 border-t border-gray-100 flex items-center justify-between gap-3">
        <span className="text-[11px] text-gray-400 flex items-center gap-1">
          <i className="ri-shield-check-line text-emerald-600" />
          Will generate audit evidence artifact automatically
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || !notes.trim() || !canUserFeedback}
            className="px-5 py-2 bg-[#253C7D] hover:bg-[#1E3064] text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
          >
            <i className="ri-check-double-line" />
            {submitting ? "Saving Evidence..." : "Submit & Verify Evidence"}
          </button>
        </div>
      </div>
    </form>
  );
}
