import { memo } from "react";
import type { Candidate, Interview } from "../../types";
import { getStageInterview } from "../../constants/evidenceConfig";
import { resolveDocumentBranding } from "@/services/formLogoService";
import { STAGE_FORM_METADATA } from "./interviewEvaluationUtils";
import { EvaluationFormContent } from "./EvaluationFormContent";

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
    recommendation: any;
    competencies: Record<string, number>;
    strengths: string;
    concerns: string;
    notes: string;
    interviewId?: string;
  }) => Promise<void>;
  submitting?: boolean;
}

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
    title: "Interview Results Form",
    subtitle: "Candidate assessment and scorecard submission",
    badge: "Interview Stage",
    responsible: "Interview Panel",
    criteria: ["Core Competencies", "Communication Clarity", "Role Fit"],
  };

  const existingInterview = targetInterview || getStageInterview(stageKey, interviews);

  const branding = resolveDocumentBranding({
    businessUnit: candidate.job_postings?.branches?.name || candidate.job_postings?.department,
    department: candidate.job_postings?.department,
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/45 backdrop-blur-xs overflow-y-auto no-scrollbar"
      onClick={() => !submitting && onClose()}
    >
      <div
        className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col my-8 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 bg-white flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-4 min-w-0">
            <img
              src={branding.logo}
              alt="Brand Logo"
              className="h-10 w-auto max-w-[120px] object-contain shrink-0"
            />
            <div className="h-8 w-px bg-gray-200 hidden sm:block shrink-0" />
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200">
                  {meta.badge}
                </span>
                <span className="text-xs text-gray-400 font-medium">Mandatory Audit Evidence</span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-gray-900 tracking-tight truncate">
                INTERVIEW RESULTS
              </h3>
              <p className="text-xs text-gray-500 mt-0.5 truncate">{meta.subtitle}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 flex items-center justify-center transition-colors cursor-pointer shrink-0"
          >
            <i className="ri-close-line text-lg" />
          </button>
        </div>

        <EvaluationFormContent
          meta={meta}
          stageKey={stageKey}
          candidate={candidate}
          interviews={interviews}
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
