import { memo } from "react";
import type { StageEvidenceRule } from "../../constants/evidenceConfig";
import { isOfferDocument } from "../../utils/candidateDocumentUtils";

type StageEvidenceCheck = ReturnType<StageEvidenceRule["checkEvidence"]>;

interface EvidenceStageItemProps {
  rule: StageEvidenceRule;
  check: StageEvidenceCheck;
  status: "verified" | "pending" | "upcoming";
  isCurrent: boolean;
  uploading?: boolean;
  onTriggerUpload: (stageKey: string) => void;
  onScheduleStageInterview?: (stageKey: string) => void;
  onOpenEvaluationForm?: (stageKey: string) => void;
  onOpenCandidateApproval?: () => void;
  onOpenSalaryProposal?: () => void;
  onDocClick: (doc: any, e: React.MouseEvent) => void;
}

export const EvidenceStageItem = memo(function EvidenceStageItem({
  rule,
  check,
  status,
  isCurrent,
  uploading = false,
  onTriggerUpload,
  onScheduleStageInterview,
  onOpenEvaluationForm,
  onOpenCandidateApproval,
  onOpenSalaryProposal,
  onDocClick,
}: EvidenceStageItemProps) {
  const isInterviewStage = ["hr_interview", "hiring_manager_interview", "final_interview"].includes(rule.stageKey);

  return (
    <div
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
      {/* Stage Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
              status === "verified" ? "bg-emerald-100 text-emerald-700" : status === "pending" ? "bg-amber-100 text-amber-800" : "bg-gray-100 text-gray-400"
            }`}
          >
            {status === "verified" ? <i className="ri-check-line" /> : <span>{rule.order}</span>}
          </div>
          <span className="text-xs font-bold text-gray-900">Stage {rule.order}: {rule.stageName}</span>
          {isInterviewStage && <span className="text-red-500 font-extrabold text-sm leading-none" title="Mandatory">*</span>}
          {isCurrent && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#253C7D] text-white">Current Stage</span>}
          <span className="text-xs text-gray-400 font-normal">• {rule.responsibleRole}</span>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-center">
          {status === "verified" ? (
            <span className="text-xs font-bold text-emerald-700 flex items-center gap-1"><i className="ri-checkbox-circle-fill text-emerald-600" /> Completed</span>
          ) : isCurrent ? (
            <span className="text-xs font-bold text-amber-700 flex items-center gap-1"><i className="ri-time-line text-amber-600" /> In Progress</span>
          ) : null}
          {rule.allowsUpload && (
            <button type="button" disabled={uploading} onClick={() => onTriggerUpload(rule.stageKey)}
              className="px-2.5 py-1 bg-white hover:bg-gray-50 text-gray-600 border border-gray-200 text-xs font-medium rounded-lg transition-colors cursor-pointer flex items-center gap-1 disabled:opacity-50"
            >
              <i className="ri-upload-2-line text-gray-400" />
              {check.attachedDocs.length > 0 ? "Attach More" : "Upload"}
            </button>
          )}
        </div>
      </div>

      {/* Interview 2-Step Forms */}
      {isInterviewStage && (
        <div className="mt-2.5 space-y-2 pt-2 border-t border-gray-100">
          {/* Step 1: Schedule */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-gray-50/90 rounded-xl border border-gray-200/80 gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              {check.scheduled ? <i className="ri-checkbox-circle-fill text-emerald-600 text-lg shrink-0" /> : <i className="ri-calendar-line text-amber-600 text-lg shrink-0" />}
              <div className="min-w-0">
                <div className="flex items-center gap-1">
                  <span className="text-xs font-bold text-gray-900">1. Interview Schedule Form</span>
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
              <button type="button" onClick={() => onScheduleStageInterview(rule.stageKey)}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer shrink-0 ${check.scheduled ? "bg-white text-gray-700 border-gray-200 hover:bg-gray-50 shadow-2xs" : "bg-[#253C7D] text-white border-[#253C7D] hover:bg-[#1E3064] shadow-xs"}`}
              >
                {check.scheduled ? "Reschedule" : "Schedule Interview"}
              </button>
            )}
          </div>

          {/* Step 2: Evaluation */}
          <div className={`flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-gray-50/90 rounded-xl border gap-3 ${check.scheduled ? "border-gray-200/80" : "opacity-60 bg-gray-50/40"}`}>
            <div className="flex items-center gap-2.5 min-w-0">
              {check.evaluated ? <i className="ri-checkbox-circle-fill text-emerald-600 text-lg shrink-0" /> : check.scheduled ? <i className="ri-edit-circle-line text-purple-600 text-lg shrink-0" /> : <i className="ri-lock-line text-gray-400 text-lg shrink-0" />}
              <div className="min-w-0">
                <div className="flex items-center gap-1">
                  <span className="text-xs font-bold text-gray-900">2. Interview Evaluation Form</span>
                  <span className="text-red-500 font-bold">*</span>
                </div>
                <p className="text-xs text-gray-500">
                  {check.evaluated ? `Completed: ${check.attachedDocs[0]?.notes || "Scorecard recorded"}` : check.scheduled ? "Interview scheduled! Complete evaluation scorecard" : "Locked — Schedule interview first"}
                </p>
              </div>
            </div>
            {onOpenEvaluationForm && (
              <button type="button" disabled={!check.scheduled} onClick={() => onOpenEvaluationForm(rule.stageKey)}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all shrink-0 ${!check.scheduled ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed" : check.evaluated ? "bg-white text-gray-700 border-gray-200 hover:bg-gray-50 shadow-2xs cursor-pointer" : "bg-purple-600 text-white border-purple-600 hover:bg-purple-700 shadow-xs cursor-pointer"}`}
              >
                {check.evaluated ? "View Scorecard" : "Fill Evaluation"}
              </button>
            )}
          </div>

          {isCurrent && (!check.scheduled || !check.evaluated) && (
            <div className="flex items-center gap-1.5 pt-1 text-[11px] text-amber-800 font-medium">
              <span className="text-red-500 font-bold">*</span>
              <span>Both forms must be completed before candidate can advance to next stage.</span>
            </div>
          )}
        </div>
      )}

      {/* Non-interview summary & action buttons */}
      {!isInterviewStage && (
        <div className="mt-1 text-xs text-gray-600 space-y-2">
          <p className={status === "verified" ? "text-emerald-700 font-medium" : "text-gray-500"}>{check.summary}</p>
          {rule.stageKey === "candidate_approval" && onOpenCandidateApproval && (
            <button type="button" onClick={onOpenCandidateApproval} className="px-3 py-1.5 bg-[#253C7D]/10 hover:bg-[#253C7D]/15 text-[#253C7D] border border-[#253C7D]/20 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer">
              <i className="ri-file-check-line text-sm" /> Candidate Approval Form (CAF)
            </button>
          )}
          {rule.stageKey === "salary_negotiation" && onOpenSalaryProposal && (
            <button type="button" onClick={onOpenSalaryProposal} className="px-3 py-1.5 bg-violet-50 hover:bg-violet-100 text-violet-800 border border-violet-200 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer">
              <i className="ri-money-dollar-circle-line text-sm text-violet-600" /> Salary Proposal Form
            </button>
          )}
        </div>
      )}

      {/* Attached Evidence Documents */}
      {check.attachedDocs.length > 0 && (
        <div className="mt-2.5 flex items-center gap-2 flex-wrap pt-2 border-t border-gray-50">
          <span className="text-[11px] font-medium text-gray-400">Attached:</span>
          {check.attachedDocs.map((doc, idx) =>
            isOfferDocument(doc) ? (
              <button key={doc.url || idx} type="button" onClick={(e) => onDocClick(doc, e)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white hover:bg-blue-50 border border-blue-200 text-blue-800 text-xs font-medium rounded-lg shadow-2xs cursor-pointer"
              >
                <i className="ri-file-shield-line text-blue-600" />
                <span className="truncate max-w-[240px]">{doc.name}</span>
                <i className="ri-eye-line text-[10px] text-blue-600" />
              </button>
            ) : (
              <a key={doc.url || idx} href={doc.url} target="_blank" rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-xs font-medium rounded-lg shadow-2xs"
              >
                <i className="ri-file-text-line text-gray-400" />
                <span className="truncate max-w-[240px]">{doc.name}</span>
                <i className="ri-external-link-line text-[10px] text-gray-400" />
              </a>
            )
          )}
        </div>
      )}
    </div>
  );
});
