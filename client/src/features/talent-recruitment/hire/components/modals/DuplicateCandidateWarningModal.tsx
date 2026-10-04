import { memo } from "react";
import type { Candidate } from "../../types";
import type { DuplicateMatchResult } from "../../utils/cvDuplicateMatcher";
import type { ExtractedCvData } from "../../utils/cvExtractor";

interface DuplicateCandidateWarningModalProps {
  isOpen: boolean;
  matchResult: DuplicateMatchResult;
  extractedData: ExtractedCvData;
  newFile?: File | null;
  onClose: () => void;
  onViewCandidate: (candidateId: string) => void;
  onMerge: (existingCandidateId: string) => void;
  onCreateNew: () => void;
  merging?: boolean;
}

export const DuplicateCandidateWarningModal = memo(function DuplicateCandidateWarningModal({
  isOpen,
  matchResult,
  extractedData,
  newFile,
  onClose,
  onViewCandidate,
  onMerge,
  onCreateNew,
  merging = false,
}: DuplicateCandidateWarningModalProps) {
  if (!isOpen || !matchResult.matchedCandidate) return null;

  const existing = matchResult.matchedCandidate;
  const isStrong = matchResult.matchType === "strong";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/50 backdrop-blur-xs overflow-y-auto no-scrollbar animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Warning / Match Badge */}
        <div
          className={`px-6 py-5 border-b flex items-start justify-between gap-4 shrink-0 ${
            isStrong
              ? "bg-rose-50/70 border-rose-100"
              : "bg-amber-50/70 border-amber-100"
          }`}
        >
          <div className="flex items-start gap-3.5">
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-xl shrink-0 ${
                isStrong
                  ? "bg-rose-600 text-white shadow-md shadow-rose-600/20"
                  : "bg-amber-500 text-white shadow-md shadow-amber-500/20"
              }`}
            >
              <i className={isStrong ? "ri-error-warning-fill" : "ri-alert-fill"} />
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span
                  className={`px-3 py-0.5 rounded-full text-xs font-black uppercase tracking-wider ${
                    isStrong
                      ? "bg-rose-100 text-rose-800 border border-rose-200"
                      : "bg-amber-100 text-amber-900 border border-amber-200"
                  }`}
                >
                  {isStrong ? "Strong Match — 100%" : `Possible Duplicate — ${matchResult.matchScore}% Match`}
                </span>
                <span className="text-xs font-semibold text-gray-500">
                  Existing candidate detected in database
                </span>
              </div>
              <h3 className="text-lg font-extrabold text-gray-900">
                {isStrong ? "Existing Candidate Found" : "Potential Duplicate Candidate Profile"}
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                The uploaded CV matches a candidate profile already registered in your system.
                <strong> The system never merges automatically</strong> — please select an action below.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-white/80 flex items-center justify-center transition-colors cursor-pointer shrink-0"
          >
            <i className="ri-close-line text-xl" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[70vh]">
          {/* Match Reason Alerts */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <i className="ri-shield-check-line text-emerald-600" />
              Detected Matching Criteria:
            </p>
            <ul className="space-y-1.5 text-xs font-semibold text-gray-800">
              {matchResult.matchReasons.map((reason, idx) => (
                <li key={idx} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Side-by-Side Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Existing Candidate Card */}
            <div className="border border-blue-200 bg-blue-50/30 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-blue-100">
                <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wider flex items-center gap-1">
                  <i className="ri-database-2-line" /> Existing Candidate in System
                </span>
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-extrabold rounded-md uppercase">
                  {existing.stage || "Registered"}
                </span>
              </div>

              <div>
                <h4 className="text-base font-extrabold text-gray-900">
                  {existing.full_name}
                </h4>
                <p className="text-xs text-gray-500 font-medium">
                  {existing.job_postings?.title || "Master Candidate Record"}
                </p>
              </div>

              <div className="space-y-1.5 text-xs text-gray-600 font-medium">
                <div className="flex items-center gap-2">
                  <i className="ri-mail-line text-gray-400 w-4" />
                  <span className={isStrong && extractedData.email === existing.email ? "font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded" : ""}>
                    {existing.email || "No email on record"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <i className="ri-phone-line text-gray-400 w-4" />
                  <span className={isStrong && extractedData.phone && existing.phone?.includes(extractedData.phone) ? "font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded" : ""}>
                    {existing.phone || "No phone on record"}
                  </span>
                </div>
                {existing.education && (
                  <div className="flex items-start gap-2 pt-1">
                    <i className="ri-graduation-cap-line text-gray-400 w-4 mt-0.5" />
                    <span className="text-[11px] text-gray-700 line-clamp-2">{existing.education}</span>
                  </div>
                )}
                {existing.work_experience && (
                  <div className="flex items-start gap-2 pt-1">
                    <i className="ri-briefcase-line text-gray-400 w-4 mt-0.5" />
                    <span className="text-[11px] text-gray-700 line-clamp-2">{existing.work_experience}</span>
                  </div>
                )}
                {(existing.resume_name || (existing.documents && existing.documents.length > 0)) && (
                  <div className="flex items-center gap-2 pt-1.5 border-t border-blue-100/80 text-[11px] text-blue-900 font-bold">
                    <i className="ri-file-pdf-2-line text-rose-500 w-4 shrink-0" />
                    <span className="truncate" title={existing.resume_name || existing.documents?.[0]?.name}>
                      CV on record: {existing.resume_name || existing.documents?.[0]?.name}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* New CV Extracted Card */}
            <div className="border border-purple-200 bg-purple-50/30 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-purple-100">
                <span className="text-[11px] font-bold text-purple-800 uppercase tracking-wider flex items-center gap-1">
                  <i className="ri-file-text-line" /> Newly Uploaded CV
                </span>
                <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-[10px] font-extrabold rounded-md">
                  Extracted Info
                </span>
              </div>

              <div>
                <h4 className="text-base font-extrabold text-gray-900">
                  {extractedData.full_name || "Name not extracted"}
                </h4>
                <p className="text-xs text-gray-500 font-medium truncate">
                  {newFile?.name || "Uploaded CV Document"}
                </p>
              </div>

              <div className="space-y-1.5 text-xs text-gray-600 font-medium">
                <div className="flex items-center gap-2">
                  <i className="ri-mail-line text-gray-400 w-4" />
                  <span className={isStrong && extractedData.email === existing.email ? "font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded" : ""}>
                    {extractedData.email || "Not detected"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <i className="ri-phone-line text-gray-400 w-4" />
                  <span className={isStrong && extractedData.phone && existing.phone?.includes(extractedData.phone) ? "font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded" : ""}>
                    {extractedData.phone || "Not detected"}
                  </span>
                </div>
                {extractedData.education && (
                  <div className="flex items-start gap-2 pt-1">
                    <i className="ri-graduation-cap-line text-gray-400 w-4 mt-0.5" />
                    <span className="text-[11px] text-gray-700 line-clamp-2">{extractedData.education}</span>
                  </div>
                )}
                {(extractedData.previous_companies?.length || extractedData.previous_positions?.length) ? (
                  <div className="flex items-start gap-2 pt-1">
                    <i className="ri-briefcase-line text-gray-400 w-4 mt-0.5" />
                    <span className="text-[11px] text-gray-700 line-clamp-2">
                      {[
                        ...(extractedData.previous_positions || []),
                        ...(extractedData.previous_companies || []),
                      ].join(" · ")}
                    </span>
                  </div>
                ) : null}
                {newFile && (
                  <div className="flex items-center gap-2 pt-1.5 border-t border-purple-100/80 text-[11px] text-purple-900 font-bold">
                    <i className="ri-file-upload-line text-purple-600 w-4 shrink-0" />
                    <span className="truncate" title={newFile.name}>
                      Uploading: {newFile.name}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Fields Checked Table */}
          {matchResult.fieldMatches.length > 0 && (
            <div className="border border-gray-100 rounded-2xl overflow-hidden">
              <div className="bg-gray-50 px-4 py-2 border-b border-gray-100 flex items-center justify-between text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                <span>Field Checked</span>
                <span>Match Status</span>
              </div>
              <div className="divide-y divide-gray-100 text-xs">
                {matchResult.fieldMatches.map((f, i) => (
                  <div key={i} className="px-4 py-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {f.isMatched ? (
                        <i className="ri-checkbox-circle-fill text-emerald-500 text-base" />
                      ) : (
                        <i className="ri-close-circle-line text-gray-300 text-base" />
                      )}
                      <span className="font-semibold text-gray-800">{f.label}</span>
                    </div>
                    <div>
                      {f.isMatched ? (
                        <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold text-[11px]">
                          Matched {f.scoreContribution ? `(${f.scoreContribution})` : ""}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-[11px]">Different</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer with 3 Required Actions */}
        <div className="px-6 py-4 bg-gray-50/80 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-[11px] text-gray-400 font-medium text-center sm:text-left">
            Choose how to handle this candidate record.
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
            {/* Action 1: View Candidate */}
            <button
              type="button"
              onClick={() => onViewCandidate(existing.id)}
              className="px-3.5 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-100 text-gray-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <i className="ri-external-link-line" />
              <span>View Candidate</span>
            </button>

            {/* Action 2: Merge */}
            <button
              type="button"
              disabled={merging}
              onClick={() => onMerge(existing.id)}
              className="px-4 py-2 rounded-xl bg-[#253C7D] hover:bg-[#1f3268] text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-[#253C7D]/20 disabled:opacity-60"
            >
              <i className="ri-git-merge-line" />
              <span>{merging ? "Merging Profile..." : "Merge into Existing"}</span>
            </button>

            {/* Action 3: Create New */}
            <button
              type="button"
              onClick={onCreateNew}
              className="px-3.5 py-2 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <i className="ri-user-add-line" />
              <span>Create New Record</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});
