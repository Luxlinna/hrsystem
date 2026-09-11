import { memo } from "react";
import type { Candidate, Interview } from "../../types";
import { useCandidateApprovalModal } from "../../hooks/useCandidateApprovalModal";
import { CandidateApprovalModalHeader } from "./approval/CandidateApprovalModalHeader";
import { CandidateApprovalModalFooter } from "./approval/CandidateApprovalModalFooter";
import { ApprovalOverviewTab } from "./approval/ApprovalOverviewTab";
import { ApprovalEvaluationTab } from "./approval/ApprovalEvaluationTab";
import { ApprovalSignatoriesTab } from "./approval/ApprovalSignatoriesTab";

interface CandidateApprovalModalProps {
  isOpen: boolean;
  candidate: Candidate;
  interviews?: Interview[];
  currentUserName?: string;
  onClose: () => void;
  onAdvanceStage?: (targetStage: string) => Promise<void> | void;
}

export const CandidateApprovalModal = memo(function CandidateApprovalModal({
  isOpen,
  candidate,
  interviews = [],
  currentUserName = "HR Operations",
  onClose,
  onAdvanceStage,
}: CandidateApprovalModalProps) {
  const {
    activeTab,
    setActiveTab,
    data,
    setData,
    loading,
    saving,
    isCompleted,
    approvedCount,
    handleSave,
    handleSignStep,
    handleApproveAll,
    handleExportPdf,
    handleAdvanceNext,
  } = useCandidateApprovalModal({
    isOpen,
    candidate,
    interviews,
    currentUserName,
    onAdvanceStage,
    onClose,
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div
        className="bg-white rounded-3xl shadow-2xl border border-gray-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <CandidateApprovalModalHeader
          formNumber={data?.form_number}
          candidateName={candidate.full_name}
          jobTitle={candidate.job_postings?.title}
          isCompleted={isCompleted}
          approvedCount={approvedCount}
          onClose={onClose}
        />

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-gray-100 bg-white">
          <button
            type="button"
            onClick={() => setActiveTab("approvals")}
            className={`pb-3 px-3 text-xs font-bold transition-all relative cursor-pointer ${
              activeTab === "approvals"
                ? "text-fuchsia-700 border-b-2 border-fuchsia-600"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            <i className="ri-user-follow-line mr-1.5" />
            III. Final Approvals ({approvedCount}/4)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("overview")}
            className={`pb-3 px-3 text-xs font-bold transition-all relative cursor-pointer ${
              activeTab === "overview"
                ? "text-fuchsia-700 border-b-2 border-fuchsia-600"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            <i className="ri-user-line mr-1.5" />
            I. Candidate & Role Overview
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("evaluation")}
            className={`pb-3 px-3 text-xs font-bold transition-all relative cursor-pointer ${
              activeTab === "evaluation"
                ? "text-fuchsia-700 border-b-2 border-fuchsia-600"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            <i className="ri-file-list-3-line mr-1.5" />
            II. Evaluation Summary & Panels
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/40">
          {loading || !data ? (
            <div className="py-20 text-center text-gray-400 space-y-2">
              <i className="ri-loader-4-line text-3xl animate-spin text-fuchsia-600 inline-block" />
              <p className="text-xs font-bold">Loading Candidate Approval Data...</p>
            </div>
          ) : (
            <>
              {activeTab === "approvals" && (
                <ApprovalSignatoriesTab
                  data={data}
                  isCompleted={isCompleted}
                  onUpdateComment={(roleKey, comment) =>
                    setData({
                      ...data,
                      signatories: {
                        ...data.signatories,
                        [roleKey]: { ...data.signatories[roleKey], comment },
                      },
                    })
                  }
                  onSignStep={handleSignStep}
                  onApproveAll={handleApproveAll}
                />
              )}

              {activeTab === "overview" && (
                <ApprovalOverviewTab data={data} onChange={setData} />
              )}

              {activeTab === "evaluation" && (
                <ApprovalEvaluationTab data={data} onChange={setData} />
              )}
            </>
          )}
        </div>

        <CandidateApprovalModalFooter
          saving={saving}
          disabled={!data}
          isCompleted={isCompleted}
          onSave={() => handleSave(true)}
          onExportPdf={handleExportPdf}
          onAdvanceNext={handleAdvanceNext}
          onClose={onClose}
        />
      </div>
    </div>
  );
});
