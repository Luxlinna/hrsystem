import { memo } from "react";
import type { EmploymentContract, ContractModalType } from "../../types/contractTypes";
import { exportContractPdf } from "../../exports/exportContractPdf";
import { exportContractWord } from "../../exports/exportContractWord";

interface ContractActionButtonsProps {
  contract: EmploymentContract | null;
  isCurrentScopeHr: boolean;
  canApproveHrDirector?: boolean;
  canAuthorizeChairwoman?: boolean;
  onOpenGenerate: () => void;
  onOpenWorkflow: (type: ContractModalType) => void;
}

export const ContractActionButtons = memo(function ContractActionButtons({
  contract,
  isCurrentScopeHr,
  canApproveHrDirector = false,
  canAuthorizeChairwoman = false,
  onOpenGenerate,
  onOpenWorkflow,
}: ContractActionButtonsProps) {
  if (!isCurrentScopeHr) {
    return <span className="text-[11px] text-gray-400 italic">Actions restricted to HR Division</span>;
  }

  if (!contract) {
    return (
      <button
        type="button"
        onClick={onOpenGenerate}
        className="px-4 py-2 bg-[#253C7D] hover:bg-[#1E3066] text-white text-xs font-bold rounded-xl shadow-2xs flex items-center gap-1.5 cursor-pointer"
      >
        <i className="ri-file-add-line" />
        <span>Generate Contract</span>
      </button>
    );
  }

  switch (contract.status) {
    case "draft":
    case "hr_review":
      return (
        <button
          type="button"
          onClick={() => onOpenWorkflow("hr_review")}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-2xs flex items-center gap-1.5 cursor-pointer"
        >
          <i className="ri-user-search-line" />
          <span>Endorse HR Review</span>
        </button>
      );

    case "hr_director_approval":
      if (!canApproveHrDirector) {
        return (
          <button
            type="button"
            disabled
            title="Restricted: Requires HR Admin Director permission to approve"
            className="px-4 py-2 bg-amber-50 text-amber-800 border border-amber-300 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-not-allowed opacity-80"
          >
            <i className="ri-lock-line text-amber-600" />
            <span>Awaiting HR Admin Director Approval</span>
          </button>
        );
      }
      return (
        <button
          type="button"
          onClick={() => onOpenWorkflow("hr_director_approval")}
          className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-2xs flex items-center gap-1.5 cursor-pointer"
        >
          <i className="ri-shield-user-line" />
          <span>HR Admin Director Approve</span>
        </button>
      );

    case "chairwoman_approval":
      if (!canAuthorizeChairwoman) {
        return (
          <button
            type="button"
            disabled
            title="Restricted: Requires Chairwoman permission to authorize"
            className="px-4 py-2 bg-purple-50 text-purple-800 border border-purple-300 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-not-allowed opacity-80"
          >
            <i className="ri-lock-line text-purple-600" />
            <span>Awaiting Chairwoman Sign-off</span>
          </button>
        );
      }
      return (
        <button
          type="button"
          onClick={() => onOpenWorkflow("chairwoman_approval")}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-2xs flex items-center gap-1.5 cursor-pointer"
        >
          <i className="ri-award-line" />
          <span>Chairwoman Authorize</span>
        </button>
      );

    case "issued":
      return (
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => exportContractPdf(contract)}
            className="px-3.5 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl text-xs font-bold shadow-2xs flex items-center gap-1.5 cursor-pointer"
          >
            <i className="ri-eye-line text-purple-600" />
            <span>View Contract Document</span>
          </button>
          <button
            type="button"
            onClick={() => exportContractWord(contract)}
            className="px-3.5 py-2 bg-white hover:bg-gray-50 text-slate-800 border border-slate-200 rounded-xl text-xs font-bold shadow-2xs flex items-center gap-1.5 cursor-pointer"
          >
            <i className="ri-file-word-line text-blue-700" />
            <span>Download document as Word</span>
          </button>
          <button
            type="button"
            onClick={() => exportContractPdf(contract)}
            className="px-3.5 py-2 bg-white hover:bg-gray-50 text-slate-800 border border-slate-200 rounded-xl text-xs font-bold shadow-2xs flex items-center gap-1.5 cursor-pointer"
          >
            <i className="ri-file-pdf-line text-red-600" />
            <span>Download document as PDF</span>
          </button>
          <button
            type="button"
            onClick={() => onOpenWorkflow("sign_contract")}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold rounded-xl shadow-2xs flex items-center gap-1.5 cursor-pointer"
          >
            <i className="ri-edit-2-line" />
            <span>Record Countersignature</span>
          </button>
        </div>
      );

    case "signed":
    case "completed":
      return (
        <div className="flex items-center gap-2 flex-wrap">
          {contract.signed_contract_url ? (
            <a
              href={contract.signed_contract_url}
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold shadow-2xs flex items-center gap-1.5"
            >
              <i className="ri-attachment-line" />
              <span>View Signed Contract</span>
            </a>
          ) : (
            <button
              type="button"
              onClick={() => exportContractPdf(contract)}
              className="px-3.5 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl text-xs font-bold shadow-2xs flex items-center gap-1.5 cursor-pointer"
            >
              <i className="ri-eye-line text-purple-600" />
              <span>View Contract Document</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => exportContractWord(contract)}
            className="px-3.5 py-2 bg-white hover:bg-gray-50 text-slate-800 border border-slate-200 rounded-xl text-xs font-bold shadow-2xs flex items-center gap-1.5 cursor-pointer"
          >
            <i className="ri-file-word-line text-blue-700" />
            <span>Download document as Word</span>
          </button>
          <button
            type="button"
            onClick={() => exportContractPdf(contract)}
            className="px-3.5 py-2 bg-white hover:bg-gray-50 text-slate-800 border border-slate-200 rounded-xl text-xs font-bold shadow-2xs flex items-center gap-1.5 cursor-pointer"
          >
            <i className="ri-file-pdf-line text-red-600" />
            <span>Download document as PDF</span>
          </button>
          <span className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-1">
            <i className="ri-checkbox-circle-fill text-emerald-600" />
            <span>Contract Completed</span>
          </span>
        </div>
      );

    default:
      return null;
  }
});
