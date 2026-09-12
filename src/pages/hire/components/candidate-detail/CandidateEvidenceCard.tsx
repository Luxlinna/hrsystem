import { memo, useState, useRef, useCallback } from "react";
import type { Candidate, Interview, OfferLetter } from "../../types";
import { STAGE_CONFIG, STAGE_TIMELINE_ORDER } from "../../constants";
import { STAGE_EVIDENCE_RULES } from "../../constants/evidenceConfig";
import {
  isOfferDocument,
  resolveOfferForDocument,
  openOfferDocumentPreview,
} from "../../utils/candidateDocumentUtils";

interface CandidateEvidenceCardProps {
  candidate: Candidate;
  interviews: Interview[];
  uploading?: boolean;
  onUploadStageEvidence: (stageKey: string, file: File) => Promise<void>;
  onOpenFeedbackModal?: (interview: Interview) => void;
  onOpenEvaluationForm?: (stageKey: string) => void;
  onScheduleStageInterview?: (stageKey: string) => void;
  onUpdateStage?: (stage: string) => void;
  onOpenCandidateApproval?: () => void;
  onOpenSalaryProposal?: () => void;
  activeOffer?: OfferLetter | null;
  onExportPdf?: (offer: OfferLetter) => void;
}

export const CandidateEvidenceCard = memo(function CandidateEvidenceCard({
  candidate,
  interviews,
  uploading = false,
  onUploadStageEvidence,
  onOpenFeedbackModal,
  onOpenEvaluationForm,
  onScheduleStageInterview,
  onUpdateStage,
  onOpenCandidateApproval,
  onOpenSalaryProposal,
  activeOffer,
  onExportPdf,
}: CandidateEvidenceCardProps) {
  const [filterMode, setFilterMode] = useState<"all" | "active" | "missing">("all");
  const [activeUploadStage, setActiveUploadStage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleDocClick = useCallback(
    async (doc: any, e: React.MouseEvent) => {
      if (isOfferDocument(doc)) {
        e.preventDefault();
        const offer = await resolveOfferForDocument(candidate, doc, activeOffer);
        if (offer) {
          openOfferDocumentPreview(offer, onExportPdf);
        }
      }
    },
    [candidate, activeOffer, onExportPdf]
  );

  const normStage =
    candidate.stage === "applied" ? "cv_received" : candidate.stage === "interview" ? "hr_interview" : candidate.stage;
  const currentStageIdx = STAGE_TIMELINE_ORDER.indexOf(normStage);

  // Evaluate all 13 stages
  const stageResults = STAGE_EVIDENCE_RULES.map((rule) => {
    const check = rule.checkEvidence(candidate, interviews);
    const ruleIdx = STAGE_TIMELINE_ORDER.indexOf(rule.stageKey);
    const isPastOrCurrent = ruleIdx <= currentStageIdx && normStage !== "rejected";
    const isCurrent = normStage === rule.stageKey;

    let status: "verified" | "pending" | "upcoming" = "upcoming";
    if (check.isVerified) {
      status = "verified";
    } else if (isPastOrCurrent) {
      status = "pending";
    }

    return {
      rule,
      check,
      status,
      isCurrent,
      isPastOrCurrent,
    };
  });

  const verifiedCount = stageResults.filter((r) => r.status === "verified").length;
  const pendingCount = stageResults.filter((r) => r.status === "pending").length;
  const totalStages = STAGE_EVIDENCE_RULES.length;
  const progressPercent = Math.round((verifiedCount / totalStages) * 100);

  const filteredResults = stageResults.filter((r) => {
    if (filterMode === "active") return r.isPastOrCurrent;
    if (filterMode === "missing") return r.status === "pending";
    return true;
  });

  const handleTriggerUpload = (stageKey: string) => {
    setActiveUploadStage(stageKey);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && activeUploadStage) {
      await onUploadStageEvidence(activeUploadStage, file);
      setActiveUploadStage(null);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-2xs">
      {/* Hidden File Input for stage-specific upload */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200">
              <i className="ri-shield-check-line text-purple-600" />
              {totalStages}-Stage Audit Matrix
            </span>
            <span className="text-xs text-gray-400 font-medium">Stage Evidence & Compliance</span>
          </div>
          <h3 className="text-base sm:text-lg font-black text-gray-900 tracking-tight">
            Funnel Evidence Checklist
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Verified artifacts and documentary proof across each stage of the candidate lifecycle.
          </p>
        </div>

        {/* Progress Pill */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-xs font-black text-gray-900">
              {verifiedCount} of {totalStages} Verified
            </p>
            <p className="text-[10px] text-gray-400 font-medium">{progressPercent}% Completed</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#253C7D] text-white flex items-center justify-center text-xs font-black shadow-xs">
            {progressPercent}%
          </div>
        </div>
      </div>

      {/* Overall Progress Bar */}
      <div className="pt-4 pb-2">
        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#253C7D] via-purple-600 to-emerald-500 rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Filter Toggles */}
      <div className="flex items-center gap-2 py-3 flex-wrap">
        <button
          type="button"
          onClick={() => setFilterMode("all")}
          className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            filterMode === "all"
              ? "bg-gray-900 text-white shadow-2xs"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          All Stages (13)
        </button>
        <button
          type="button"
          onClick={() => setFilterMode("active")}
          className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            filterMode === "active"
              ? "bg-[#253C7D] text-white shadow-2xs"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          Current & Passed ({stageResults.filter((r) => r.isPastOrCurrent).length})
        </button>
        <button
          type="button"
          onClick={() => setFilterMode("missing")}
          className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            filterMode === "missing"
              ? "bg-amber-600 text-white shadow-2xs"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          Pending Evidence ({pendingCount})
        </button>
      </div>

      {/* Stage Evidence Items List */}
      <div className="space-y-3 pt-2">
        {filteredResults.map(({ rule, check, status, isCurrent }) => {
          const isInterviewStage = ["hr_interview", "hiring_manager_interview", "final_interview"].includes(
            rule.stageKey
          );

          return (
            <div
              key={rule.stageKey}
              className={`p-4 rounded-2xl border transition-all ${
                isCurrent
                  ? "bg-blue-50/30 border-[#253C7D] ring-1 ring-[#253C7D]/20 shadow-2xs"
                  : status === "verified"
                  ? "bg-white border-gray-200/80 hover:border-gray-300"
                  : status === "pending"
                  ? "bg-amber-50/20 border-amber-200/80"
                  : "bg-gray-50/40 border-gray-100 opacity-70"
              }`}
            >
              {/* Clean Stage Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Status Circle */}
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      status === "verified"
                        ? "bg-emerald-100 text-emerald-700"
                        : status === "pending"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    {status === "verified" ? (
                      <i className="ri-check-line" />
                    ) : (
                      <span>{rule.order}</span>
                    )}
                  </div>

                  <span className="text-xs font-bold text-gray-900">
                    Stage {rule.order}: {rule.stageName}
                  </span>

                  {/* Red star for required interview stages */}
                  {isInterviewStage && (
                    <span className="text-red-500 font-extrabold text-sm leading-none" title="Mandatory Stage">
                      *
                    </span>
                  )}

                  {isCurrent && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#253C7D] text-white">
                      Current Stage
                    </span>
                  )}

                  <span className="text-xs text-gray-400 font-normal">
                    • {rule.responsibleRole}
                  </span>
                </div>

                {/* Right Header Status / Upload Action */}
                <div className="flex items-center gap-2 self-start sm:self-center">
                  {status === "verified" ? (
                    <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                      <i className="ri-checkbox-circle-fill text-emerald-600" />
                      Completed
                    </span>
                  ) : isCurrent ? (
                    <span className="text-xs font-bold text-amber-700 flex items-center gap-1">
                      <i className="ri-time-line text-amber-600" />
                      In Progress
                    </span>
                  ) : null}

                  {rule.allowsUpload && (
                    <button
                      type="button"
                      disabled={uploading}
                      onClick={() => handleTriggerUpload(rule.stageKey)}
                      className="px-2.5 py-1 bg-white hover:bg-gray-50 text-gray-600 border border-gray-200 text-xs font-medium rounded-lg transition-colors cursor-pointer flex items-center gap-1 disabled:opacity-50"
                      title={rule.uploadCategoryLabel}
                    >
                      <i className="ri-upload-2-line text-gray-400" />
                      {check.attachedDocs.length > 0 ? "Attach More" : "Upload"}
                    </button>
                  )}
                </div>
              </div>

              {/* Sequential 2-Step Forms for Interview Stages */}
              {isInterviewStage && (
                <div className="mt-2.5 space-y-2 pt-2 border-t border-gray-100">
                  {/* Step 1: Interview Schedule Form */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-gray-50/90 rounded-xl border border-gray-200/80 gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {check.scheduled ? (
                        <i className="ri-checkbox-circle-fill text-emerald-600 text-lg shrink-0" />
                      ) : (
                        <i className="ri-calendar-line text-amber-600 text-lg shrink-0" />
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-bold text-gray-900">
                            1. Interview Schedule Form
                          </span>
                          <span className="text-red-500 font-bold">*</span>
                        </div>
                        <p className="text-xs text-gray-500">
                          {check.scheduled && check.linkedInterview?.scheduled_at
                            ? `Scheduled: ${new Date(check.linkedInterview.scheduled_at).toLocaleDateString()} (${check.linkedInterview.type || "Interview"})`
                            : "Schedule interview date, time & format first"}
                        </p>
                      </div>
                    </div>

                    {onScheduleStageInterview && (
                      <button
                        type="button"
                        onClick={() => onScheduleStageInterview(rule.stageKey)}
                        className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer shrink-0 ${
                          check.scheduled
                            ? "bg-white text-gray-700 border-gray-200 hover:bg-gray-50 shadow-2xs"
                            : "bg-[#253C7D] text-white border-[#253C7D] hover:bg-[#1E3064] shadow-xs"
                        }`}
                      >
                        {check.scheduled ? "Reschedule" : "Schedule Interview"}
                      </button>
                    )}
                  </div>

                  {/* Step 2: Interview Evaluation Form */}
                  <div
                    className={`flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-gray-50/90 rounded-xl border gap-3 ${
                      check.scheduled ? "border-gray-200/80" : "border-gray-150 opacity-60 bg-gray-50/40"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {check.evaluated ? (
                        <i className="ri-checkbox-circle-fill text-emerald-600 text-lg shrink-0" />
                      ) : check.scheduled ? (
                        <i className="ri-edit-circle-line text-purple-600 text-lg shrink-0" />
                      ) : (
                        <i className="ri-lock-line text-gray-400 text-lg shrink-0" />
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-bold text-gray-900">
                            2. Interview Evaluation Form
                          </span>
                          <span className="text-red-500 font-bold">*</span>
                        </div>
                        <p className="text-xs text-gray-500">
                          {check.evaluated
                            ? `Completed: ${check.attachedDocs[0]?.notes || "Scorecard recorded"}`
                            : check.scheduled
                            ? "Interview scheduled! Recruiter must complete evaluation scorecard"
                            : "Locked — Schedule interview first"}
                        </p>
                      </div>
                    </div>

                    {onOpenEvaluationForm && (
                      <button
                        type="button"
                        disabled={!check.scheduled}
                        onClick={() => onOpenEvaluationForm(rule.stageKey)}
                        className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all shrink-0 ${
                          !check.scheduled
                            ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                            : check.evaluated
                            ? "bg-white text-gray-700 border-gray-200 hover:bg-gray-50 shadow-2xs cursor-pointer"
                            : "bg-purple-600 text-white border-purple-600 hover:bg-purple-700 shadow-xs cursor-pointer"
                        }`}
                      >
                        {check.evaluated ? "View Scorecard" : "Fill Evaluation"}
                      </button>
                    )}
                  </div>

                  {/* Clean, subtle warning if on current stage and either form is pending */}
                  {isCurrent && (!check.scheduled || !check.evaluated) && (
                    <div className="flex items-center gap-1.5 pt-1 text-[11px] text-amber-800 font-medium">
                      <span className="text-red-500 font-bold">*</span>
                      <span>Both forms above must be completed before candidate can advance to next stage.</span>
                    </div>
                  )}
                </div>
              )}

              {/* Non-interview stages summary */}
              {!isInterviewStage && (
                <div className="mt-1 text-xs text-gray-600 space-y-2">
                  <p className={status === "verified" ? "text-emerald-700 font-medium" : "text-gray-500"}>
                    {check.summary}
                  </p>
                  {rule.stageKey === "candidate_approval" && onOpenCandidateApproval && (
                    <div className="pt-0.5">
                      <button
                        type="button"
                        onClick={onOpenCandidateApproval}
                        className="px-3 py-1.5 bg-[#253C7D]/10 hover:bg-[#253C7D]/15 text-[#253C7D] border border-[#253C7D]/20 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <i className="ri-file-check-line text-sm" />
                        Candidate Approval Form (CAF)
                      </button>
                    </div>
                  )}
                  {rule.stageKey === "salary_negotiation" && onOpenSalaryProposal && (
                    <div className="pt-0.5">
                      <button
                        type="button"
                        onClick={onOpenSalaryProposal}
                        className="px-3 py-1.5 bg-violet-50 hover:bg-violet-100 text-violet-800 border border-violet-200 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <i className="ri-money-dollar-circle-line text-sm text-violet-600" />
                        Salary Proposal Form
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Attached Evidence Documents */}
              {check.attachedDocs.length > 0 && (
                <div className="mt-2.5 flex items-center gap-2 flex-wrap pt-2 border-t border-gray-50">
                  <span className="text-[11px] font-medium text-gray-400">Attached:</span>
                  {check.attachedDocs.map((doc, idx) => {
                    if (isOfferDocument(doc)) {
                      return (
                        <button
                          key={doc.url || idx}
                          type="button"
                          onClick={(e) => handleDocClick(doc, e)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white hover:bg-blue-50 border border-blue-200 text-blue-800 text-xs font-medium rounded-lg transition-colors shadow-2xs cursor-pointer"
                          title="View official document"
                        >
                          <i className="ri-file-shield-line text-blue-600" />
                          <span className="truncate max-w-[240px]">{doc.name}</span>
                          <i className="ri-eye-line text-[10px] text-blue-600" />
                        </button>
                      );
                    }

                    return (
                      <a
                        key={doc.url || idx}
                        href={doc.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-xs font-medium rounded-lg transition-colors shadow-2xs"
                      >
                        <i className="ri-file-text-line text-gray-400" />
                        <span className="truncate max-w-[240px]">{doc.name}</span>
                        <i className="ri-external-link-line text-[10px] text-gray-400" />
                      </a>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
});
