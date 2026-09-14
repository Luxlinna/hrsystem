import { memo, useState, useEffect, useCallback } from "react";
import type { Candidate, OfferLetter } from "../../types";
import type { EmploymentContract, ContractModalType } from "../../types/contractTypes";
import { CONTRACT_WORKFLOW_STEPS, isContractStepPassed } from "../../constants/contractWorkflowConfig";
import { getPortalCompletionStats } from "../../constants/documentPortalConfig";
import { fetchCandidateContract } from "../../services/contractService";
import { ContractActionButtons } from "./ContractActionButtons";
import { GenerateContractModal } from "./GenerateContractModal";
import { ContractWorkflowModal } from "./ContractWorkflowModal";

interface CandidateContractLifecycleCardProps {
  candidate: Candidate;
  activeOffer: OfferLetter | null;
  actorName: string;
  isCurrentScopeHr: boolean;
  onRefreshCandidate?: () => void;
}

export const CandidateContractLifecycleCard = memo(function CandidateContractLifecycleCard({
  candidate,
  activeOffer,
  actorName,
  isCurrentScopeHr,
  onRefreshCandidate,
}: CandidateContractLifecycleCardProps) {
  const [contract, setContract] = useState<EmploymentContract | null>(null);
  const [isGenerateModal, setIsGenerateModal] = useState(false);
  const [workflowModal, setWorkflowModal] = useState<ContractModalType>(null);

  const stats = getPortalCompletionStats(candidate.documents || []);
  const isDocumentsVerified = stats.isAllComplete;

  const loadContract = useCallback(async () => {
    if (!candidate?.id) return;
    const res = await fetchCandidateContract(candidate.id);
    setContract(res);
  }, [candidate?.id]);

  useEffect(() => {
    loadContract();
  }, [loadContract]);

  return (
    <div className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-2xs space-y-5">
      {/* Header with Title & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-700">
              <i className="ri-draft-line text-lg" />
            </div>
            <h2 className="text-sm sm:text-base font-black text-gray-900 tracking-tight">Contract Module</h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-purple-50 text-purple-700 border border-purple-200">
              HR Division
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1 pl-10">
            Sequential 7-step governance: Generate → HR Review → HR Director → Chairwoman → Issued → Signature → Completed.
          </p>
        </div>

        {/* Status Pill */}
        <div className="shrink-0">
          {!isDocumentsVerified ? (
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1.5">
              <i className="ri-lock-line text-xs" />
              <span>Pending Documents ({stats.verifiedRequired}/{stats.totalRequired})</span>
            </span>
          ) : contract ? (
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
              <i className="ri-checkbox-circle-fill text-xs" />
              <span>Contract #{contract.contract_number} ({contract.status.replace("_", " ")})</span>
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200 flex items-center gap-1.5">
              <i className="ri-sparkling-fill text-xs" />
              <span>Ready to Generate</span>
            </span>
          )}
        </div>
      </div>

      {/* Activation Gate Check */}
      {!isDocumentsVerified ? (
        <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
          <i className="ri-alert-line text-base text-amber-700 shrink-0 mt-0.5" />
          <div>
            <strong className="font-bold">Prerequisite Locked:</strong> All 8 required pre-boarding documents must be verified in the Employee Document Portal before generating the employment contract. (Currently {stats.verifiedRequired} of {stats.totalRequired} verified).
          </div>
        </div>
      ) : (
        <>
          {/* Linkage Breadcrumb */}
          <div className="p-3 rounded-2xl bg-[#FAFBFD] border border-gray-200/80 flex items-center gap-2 flex-wrap text-xs text-gray-600">
            <span className="font-bold text-gray-900 flex items-center gap-1"><i className="ri-user-3-line text-[#253C7D]" />{candidate.full_name}</span>
            <i className="ri-arrow-right-s-line text-gray-400" />
            <span className="font-semibold text-gray-700">{candidate.job_postings?.title || "Position"}</span>
            <i className="ri-arrow-right-s-line text-gray-400" />
            <span className="text-gray-600">{candidate.job_postings?.branches?.name || "HQ"}</span>
            <i className="ri-arrow-right-s-line text-gray-400" />
            <span className="text-gray-600">{activeOffer?.offer_reference || "Accepted Offer"}</span>
            <i className="ri-arrow-right-s-line text-gray-400" />
            <span className="font-bold text-purple-700">{contract?.contract_number || "Contract Draft"}</span>
          </div>

          {/* 7-Step Visual Stepper */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            {CONTRACT_WORKFLOW_STEPS.map((step, idx) => {
              const isPassed = contract && isContractStepPassed(contract.status, step.stage);
              const isCurrent = contract && contract.status === step.stage;

              return (
                <div
                  key={step.stage}
                  className={`p-2.5 rounded-2xl border text-center transition-all ${
                    isCurrent
                      ? "bg-purple-50/80 border-purple-300 shadow-2xs"
                      : isPassed
                      ? "bg-emerald-50/50 border-emerald-200 text-emerald-800"
                      : "bg-gray-50/50 border-gray-100 text-gray-400"
                  }`}
                >
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <span className="text-[10px] font-extrabold">{idx + 1}.</span>
                    <i className={`${step.icon} text-xs`} />
                  </div>
                  <p className="text-[11px] font-bold truncate">{step.shortLabel}</p>
                  <span className="text-[9px] block text-gray-400 truncate mt-0.5">{step.responsible}</span>
                </div>
              );
            })}
          </div>

          {/* Action Row */}
          <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-3 flex-wrap">
            <div className="text-xs text-gray-500">
              {contract ? (
                <span>Salary: <strong className="text-gray-900">${contract.monthly_salary} {contract.currency}</strong> • Start: <strong className="text-gray-900">{contract.start_date}</strong></span>
              ) : (
                <span>Draft contract from accepted offer terms.</span>
              )}
            </div>

            <ContractActionButtons
              contract={contract}
              isCurrentScopeHr={isCurrentScopeHr}
              onOpenGenerate={() => setIsGenerateModal(true)}
              onOpenWorkflow={setWorkflowModal}
            />
          </div>
        </>
      )}

      {/* Modals */}
      <GenerateContractModal
        isOpen={isGenerateModal}
        candidate={candidate}
        offer={activeOffer}
        actorName={actorName}
        onClose={() => setIsGenerateModal(false)}
        onContractCreated={() => { loadContract(); onRefreshCandidate?.(); }}
      />

      {contract && (
        <ContractWorkflowModal
          type={workflowModal}
          contract={contract}
          actorName={actorName}
          onClose={() => setWorkflowModal(null)}
          onActionComplete={() => { loadContract(); onRefreshCandidate?.(); }}
        />
      )}
    </div>
  );
});
