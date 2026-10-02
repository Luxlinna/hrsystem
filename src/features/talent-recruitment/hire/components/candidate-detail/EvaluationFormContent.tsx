import { useState, useEffect } from "react";
import type { Candidate, Interview } from "../../types";
import { parseInterviewPanelFromNotes } from "../../utils/interviewPanelHelper";
import {
  exportInterviewEvaluationPdf,
  type InterviewEvaluationExportData,
} from "../../exports/exportInterviewEvaluationPdf";
import { exportInterviewEvaluationWord } from "../../exports/exportInterviewEvaluationWord";
import { toast } from "@/components/Toast";
import {
  RECOMMENDATIONS,
  parseInterviewFeedback,
  extractInterviewerSlots,
} from "./interviewEvaluationUtils";
import { EvaluationCandidateOfferDetails } from "./EvaluationCandidateOfferDetails";
import { EvaluationCriteriaRatings } from "./EvaluationCriteriaRatings";

export interface EvaluationFormContentProps {
  meta: {
    title: string;
    subtitle: string;
    badge: string;
    responsible: string;
    criteria: string[];
  };
  stageKey: string;
  candidate: Candidate;
  interviews?: Interview[];
  existingInterview?: Interview;
  defaultEvaluatorName: string;
  canUserFeedback?: boolean;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (payload: {
    stageKey: string;
    evaluatorName: string;
    date: string;
    overallScore: number;
    recommendation: any;
    competencies: Record<string, number>;
    strengths: string;
    concerns: string;
    notes: string;
    interviewId?: string;
  }) => Promise<void>;
}

export function EvaluationFormContent({
  meta,
  stageKey,
  candidate,
  interviews = [],
  existingInterview,
  defaultEvaluatorName,
  canUserFeedback,
  submitting,
  onClose,
  onSubmit,
}: EvaluationFormContentProps) {
  const panelInfo = existingInterview?.notes ? parseInterviewPanelFromNotes(existingInterview.notes) : null;
  const currentUserName = (defaultEvaluatorName || "").trim();

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

  const [evaluator, setEvaluator] = useState(initialParsed.evaluator || resolvedInitialEvaluator);
  const [date, setDate] = useState(
    existingInterview?.scheduled_at ? existingInterview.scheduled_at.split("T")[0] : new Date().toISOString().split("T")[0]
  );
  const [overallScore, setOverallScore] = useState<number>(
    initialParsed.score || existingInterview?.score || (candidate.rating && candidate.rating > 0 ? candidate.rating : 4)
  );
  const [recommendation, setRecommendation] = useState<"recommend_to_hire" | "hold" | "do_not_recommend" | "available_another">(
    initialParsed.rec || "recommend_to_hire"
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
  const [notes, setNotes] = useState(initialParsed.remarks || cleanIvNotes || candidate.notes || "");

  // Dynamic candidate offer fields — purely driven from real record data
  const [offerDepartment, setOfferDepartment] = useState(candidate.department || candidate.job_postings?.department || "");
  const [director, setDirector] = useState("");
  const [officerPosition, setOfficerPosition] = useState(candidate.position || candidate.job_postings?.title || "");
  const [probationSalary, setProbationSalary] = useState(
    candidate.basic_salary ? `$${candidate.basic_salary.toLocaleString()} (Net)` : (candidate.expected_salary ? `$${candidate.expected_salary.toLocaleString()} (Net)` : "")
  );
  const [afterProbationSalary, setAfterProbationSalary] = useState(
    candidate.basic_salary ? `$${candidate.basic_salary.toLocaleString()} (Net)` : (candidate.expected_salary ? `$${candidate.expected_salary.toLocaleString()} (Net)` : "")
  );
  const [onBoardDate, setOnBoardDate] = useState(candidate.start_date || "");

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

  const [exportingWord, setExportingWord] = useState(false);

  const firstIv = interviews.find((i) => i.stage === "1st-interview") || interviews[0];
  const secondIv = interviews.find((i) => i.stage === "2nd-interview") || (interviews.length > 1 ? interviews[1] : undefined);

  const firstSlots = extractInterviewerSlots(firstIv, evaluator.trim() || resolvedInitialEvaluator, date);
  const secondSlots = extractInterviewerSlots(secondIv);

  const getExportPayload = (): InterviewEvaluationExportData => ({
    candidate,
    stageKey,
    stageTitle: "INTERVIEW RESULTS",
    stageSubtitle: meta.subtitle,
    stageBadge: meta.badge,
    responsibleRole: meta.responsible,
    evaluatorName: evaluator.trim() || resolvedInitialEvaluator || "Evaluator",
    date,
    overallScore,
    recommendation,
    competencies: competencyScores,
    strengths: strengths.trim(),
    concerns: concerns.trim(),
    notes: notes.trim(),
    panelMembers: panelInfo?.panelMembers?.map((m) => ({ name: m.name, role: m.role })),
    interviewType: existingInterview?.type,
    interviewDuration: existingInterview?.duration_minutes,
    offerDepartment,
    director,
    officerPosition,
    probationSalary,
    afterProbationSalary,
    onBoardDate,
    firstInterviewers: firstSlots,
    secondInterviewers: secondSlots,
    approvedBy: {
      employerTitle: "Employer",
      name: "",
      role: "Chairwoman",
      company: "",
      date: "",
    },
  });

  const handleExportPdf = () => {
    exportInterviewEvaluationPdf(getExportPayload());
    toast("Exporting PDF", "Preparing official Interview Results scorecard...", "info");
  };

  const handleExportWord = async () => {
    setExportingWord(true);
    try {
      await exportInterviewEvaluationWord(getExportPayload());
      toast("Export Complete", "Official Interview Results Word document (.docx) downloaded.", "success");
    } catch (err) {
      console.error("Word export failed:", err);
      toast("Export Failed", "Could not generate Word document.", "error");
    } finally {
      setExportingWord(false);
    }
  };

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
          <span>Access Restricted: Only invited interviewers or recruiters can record evaluation feedback.</span>
        </div>
      )}

      {/* Candidate Banner with Quick Export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-gray-50/80 rounded-2xl border border-gray-100 gap-3">
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
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleExportPdf}
            className="px-2.5 py-1 bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-2xs"
            title="Export official Interview Results Form as PDF"
          >
            <i className="ri-file-pdf-line text-rose-600" />
            <span>PDF Form</span>
          </button>
          <button
            type="button"
            disabled={exportingWord}
            onClick={handleExportWord}
            className="px-2.5 py-1 bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shadow-2xs disabled:opacity-50"
            title="Export official Interview Results Form as Word (.docx)"
          >
            {exportingWord ? <i className="ri-loader-4-line animate-spin text-blue-600" /> : <i className="ri-file-word-line text-blue-600" />}
            <span>Word Form</span>
          </button>
          <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-gray-100 border border-gray-200 text-gray-600 hidden sm:inline-block">
            {meta.responsible}
          </span>
        </div>
      </div>

      {/* 1. Department Hiring Recommendation Selector */}
      <div>
        <label className="text-[11px] font-bold text-gray-600 uppercase tracking-wider block mb-2">
          Department Hiring Decision <span className="text-rose-500">*</span>
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {RECOMMENDATIONS.map((rec) => {
            const isSelected = recommendation === rec.key;
            return (
              <button
                key={rec.key}
                type="button"
                onClick={() => setRecommendation(rec.key)}
                className={`px-3 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center flex items-center justify-center gap-1.5 ${
                  isSelected
                    ? `${rec.color} ring-2 ring-[#253C7D]/20 shadow-2xs font-extrabold`
                    : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                <i className={isSelected ? "ri-checkbox-circle-fill text-sm" : "ri-checkbox-blank-circle-line text-sm text-gray-400"} />
                <span>{rec.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Offer Details */}
      <EvaluationCandidateOfferDetails
        offerDepartment={offerDepartment}
        setOfferDepartment={setOfferDepartment}
        director={director}
        setDirector={setDirector}
        officerPosition={officerPosition}
        setOfficerPosition={setOfficerPosition}
        onBoardDate={onBoardDate}
        setOnBoardDate={setOnBoardDate}
        probationSalary={probationSalary}
        setProbationSalary={setProbationSalary}
        afterProbationSalary={afterProbationSalary}
        setAfterProbationSalary={setAfterProbationSalary}
      />

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
            placeholder="Interviewer name"
            className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D]"
          />
          {panelInfo?.panelMembers && panelInfo.panelMembers.length > 1 && (
            <p className="text-[10px] text-gray-500 mt-1.5 flex items-center gap-1">
              <i className="ri-team-line text-[#253C7D]" />
              <span>
                Invited Panel: <strong>{panelInfo.panelMembers.map((m) => m.name).join(", ")}</strong>
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

      {/* Competency Ratings and Overall Score */}
      <EvaluationCriteriaRatings
        criteria={meta.criteria}
        competencyScores={competencyScores}
        onUpdateCompetencyScore={(crit, val) => setCompetencyScores((prev) => ({ ...prev, [crit]: val }))}
        overallScore={overallScore}
        onUpdateOverallScore={setOverallScore}
      />

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
            placeholder="Key technical depth, communication, relevant wins..."
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
      <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
            Export:
          </span>
          <button
            type="button"
            onClick={handleExportPdf}
            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title="Export official INTERVIEW RESULTS Form as PDF"
          >
            <i className="ri-file-pdf-line text-rose-600 text-sm" />
            <span>Export PDF</span>
          </button>
          <button
            type="button"
            disabled={exportingWord}
            onClick={handleExportWord}
            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs disabled:opacity-50"
            title="Export official INTERVIEW RESULTS Form as Word (.docx)"
          >
            {exportingWord ? <i className="ri-loader-4-line animate-spin text-sm text-blue-600" /> : <i className="ri-file-word-line text-blue-600 text-sm" />}
            <span>{exportingWord ? "Exporting..." : "Export Word"}</span>
          </button>
        </div>

        <div className="flex items-center gap-2 justify-end">
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
