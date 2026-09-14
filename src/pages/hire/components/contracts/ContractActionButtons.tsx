import { memo } from "react";
import type { EmploymentContract, ContractModalType } from "../../types/contractTypes";

interface ContractActionButtonsProps {
  contract: EmploymentContract | null;
  isCurrentScopeHr: boolean;
  onOpenGenerate: () => void;
  onOpenWorkflow: (type: ContractModalType) => void;
}

export const ContractActionButtons = memo(function ContractActionButtons({
  contract,
  isCurrentScopeHr,
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
    case "hr_review":
      return (
        <button
          type="button"
          onClick={() => onOpenWorkflow("hr_director_approval")}
          className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-2xs flex items-center gap-1.5 cursor-pointer"
        >
          <i className="ri-shield-user-line" />
          <span>HR Director Approve</span>
        </button>
      );
    case "hr_director_approval":
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
    case "chairwoman_approval":
      return (
        <button
          type="button"
          onClick={() => onOpenWorkflow("issue_contract")}
          className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-2xs flex items-center gap-1.5 cursor-pointer"
        >
          <i className="ri-mail-send-line" />
          <span>Issue Contract</span>
        </button>
      );
    case "issued":
      return (
        <button
          type="button"
          onClick={() => onOpenWorkflow("sign_contract")}
          className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold rounded-xl shadow-2xs flex items-center gap-1.5 cursor-pointer"
        >
          <i className="ri-edit-2-line" />
          <span>Record Countersignature</span>
        </button>
      );
    case "signed":
    case "completed":
      return (
        <span className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-1">
          <i className="ri-checkbox-circle-fill text-emerald-600" />
          <span>Contract Completed</span>
        </span>
      );
    default:
      return null;
  }
});
