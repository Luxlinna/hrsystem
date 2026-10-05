import { memo } from "react";
import type { Candidate } from "../../types";
import { useCandidateCvBank } from "./cv-bank/useCandidateCvBank";
import { CandidateCvBankList } from "./cv-bank/CandidateCvBankList";
import { CandidateCvSettingsTab } from "./cv-bank/CandidateCvSettingsTab";
import { CandidateCvPreviewModal } from "./CandidateCvPreviewModal";
import { formatRelative } from "../../hireUtils";

interface CandidateCvBankModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidates: Candidate[];
  onRefresh?: () => Promise<void> | void;
  isSuperAdmin?: boolean;
  isAdmin?: boolean;
}

export const CandidateCvBankModal = memo(function CandidateCvBankModal({
  isOpen,
  onClose,
  candidates,
  onRefresh,
  isSuperAdmin = true,
  isAdmin = false,
}: CandidateCvBankModalProps) {
  const bank = useCandidateCvBank(candidates, onRefresh);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl h-[88vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-slate-800 to-[#1E3064] text-white flex items-center justify-between gap-4 shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300 text-xl shrink-0">
              <i className="ri-folder-user-line" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">Candidate CV Repository &amp; Settings</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  {bank.totalWithCv} Uploaded CVs
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Centralized document bank and OCR ingestion rules for all candidate resumes
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-800/80 rounded-lg p-0.5 border border-slate-700">
              <button
                type="button"
                onClick={() => bank.setActiveTab("repository")}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  bank.activeTab === "repository" ? "bg-blue-600 text-white shadow-xs" : "text-slate-300 hover:text-white"
                }`}
              >
                <i className="ri-file-list-3-line mr-1" /> All Resumes ({bank.totalWithCv})
              </button>
              <button
                type="button"
                onClick={() => bank.setActiveTab("settings")}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  bank.activeTab === "settings" ? "bg-blue-600 text-white shadow-xs" : "text-slate-300 hover:text-white"
                }`}
              >
                <i className="ri-settings-4-line mr-1" /> CV Ingestion Rules
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800/90 hover:bg-rose-600 text-slate-300 hover:text-white transition-colors cursor-pointer ml-1"
              title="Close"
            >
              <i className="ri-close-line text-base" />
            </button>
          </div>
        </div>

        {/* Content */}
        {bank.activeTab === "repository" ? (
          <CandidateCvBankList
            candidates={bank.filteredCandidates}
            searchQuery={bank.searchQuery}
            setSearchQuery={bank.setSearchQuery}
            formatFilter={bank.formatFilter}
            setFormatFilter={bank.setFormatFilter}
            stageFilter={bank.stageFilter}
            setStageFilter={bank.setStageFilter}
            onPreview={bank.setPreviewCandidate}
            onReupload={bank.handleReuploadCv}
          />
        ) : (
          <CandidateCvSettingsTab
            settings={bank.settings}
            setSettings={bank.setSettings}
            onSave={bank.handleSaveSettings}
          />
        )}

        <CandidateCvPreviewModal
          isOpen={Boolean(bank.previewCandidate)}
          onClose={() => bank.setPreviewCandidate(null)}
          candidateName={bank.previewCandidate?.full_name}
          position={bank.previewCandidate?.job_title || bank.previewCandidate?.position || bank.previewCandidate?.job_postings?.title || undefined}
          appliedDate={bank.previewCandidate?.applied_at ? formatRelative(bank.previewCandidate.applied_at) : undefined}
          fileUrl={bank.previewCandidate?.resume_url}
          fileName={bank.previewCandidate?.resume_name || undefined}
        />
      </div>
    </div>
  );
});
