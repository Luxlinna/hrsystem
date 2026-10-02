import { memo, useState, useRef, useCallback } from "react";
import type { Candidate, Interview, OfferLetter } from "../../types";
import { STAGE_TIMELINE_ORDER } from "../../constants";
import { STAGE_EVIDENCE_RULES } from "../../constants/evidenceConfig";
import { resolveOfferForDocument, openOfferDocumentPreview, isOfferDocument } from "../../utils/candidateDocumentUtils";
import { EvidenceStageItem } from "./EvidenceStageItem";

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
  onOpenEvaluationForm,
  onScheduleStageInterview,
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
        if (offer) openOfferDocumentPreview(offer, onExportPdf);
      }
    },
    [candidate, activeOffer, onExportPdf]
  );

  const normStage =
    candidate.stage === "applied" ? "cv_received" : candidate.stage === "interview" ? "hr_interview" : candidate.stage;
  const currentStageIdx = STAGE_TIMELINE_ORDER.indexOf(normStage);

  const stageResults = STAGE_EVIDENCE_RULES.map((rule) => {
    const check = rule.checkEvidence(candidate, interviews);
    const ruleIdx = STAGE_TIMELINE_ORDER.indexOf(rule.stageKey);
    const isPastOrCurrent = ruleIdx <= currentStageIdx && normStage !== "rejected";
    const isCurrent = normStage === rule.stageKey;
    let status: "verified" | "pending" | "upcoming" = "upcoming";
    if (check.isVerified) status = "verified";
    else if (isPastOrCurrent) status = "pending";
    return { rule, check, status, isCurrent, isPastOrCurrent };
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
    if (fileInputRef.current) { fileInputRef.current.value = ""; fileInputRef.current.click(); }
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
      <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} />

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
          <h3 className="text-base sm:text-lg font-black text-gray-900 tracking-tight">Funnel Evidence Checklist</h3>
          <p className="text-xs text-gray-500 mt-0.5">Verified artifacts and documentary proof across each stage of the candidate lifecycle.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-xs font-black text-gray-900">{verifiedCount} of {totalStages} Verified</p>
            <p className="text-[10px] text-gray-400 font-medium">{progressPercent}% Completed</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#253C7D] text-white flex items-center justify-center text-xs font-black shadow-xs">
            {progressPercent}%
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="pt-4 pb-2">
        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-[#253C7D] via-purple-600 to-emerald-500 rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }} />
        </div>
      </div>

      {/* Filter Toggles */}
      <div className="flex items-center gap-2 py-3 flex-wrap">
        {(["all", "active", "missing"] as const).map((mode) => (
          <button key={mode} type="button" onClick={() => setFilterMode(mode)}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filterMode === mode
                ? mode === "all" ? "bg-gray-900 text-white shadow-2xs" : mode === "active" ? "bg-[#253C7D] text-white shadow-2xs" : "bg-amber-600 text-white shadow-2xs"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {mode === "all" && `All Stages (${totalStages})`}
            {mode === "active" && `Current & Passed (${stageResults.filter((r) => r.isPastOrCurrent).length})`}
            {mode === "missing" && `Pending Evidence (${pendingCount})`}
          </button>
        ))}
      </div>

      {/* Stage Items */}
      <div className="space-y-3 pt-2">
        {filteredResults.map(({ rule, check, status, isCurrent }) => (
          <EvidenceStageItem
            key={rule.stageKey}
            rule={rule}
            check={check}
            status={status}
            isCurrent={isCurrent}
            uploading={uploading}
            onTriggerUpload={handleTriggerUpload}
            onScheduleStageInterview={onScheduleStageInterview}
            onOpenEvaluationForm={onOpenEvaluationForm}
            onOpenCandidateApproval={onOpenCandidateApproval}
            onOpenSalaryProposal={onOpenSalaryProposal}
            onDocClick={handleDocClick}
          />
        ))}
      </div>
    </div>
  );
});
