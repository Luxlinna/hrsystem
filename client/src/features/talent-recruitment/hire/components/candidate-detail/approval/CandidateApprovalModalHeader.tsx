import { memo } from "react";
import type { Candidate } from "../../../types";

interface HeaderProps {
  formNumber?: string;
  candidateName: string;
  jobTitle?: string;
  isCompleted: boolean;
  approvedCount: number;
  onClose: () => void;
}

export const CandidateApprovalModalHeader = memo(function CandidateApprovalModalHeader({
  formNumber,
  candidateName,
  jobTitle,
  isCompleted,
  approvedCount,
  onClose,
}: HeaderProps) {
  return (
    <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-[#253C7D]/10 text-[#253C7D] flex items-center justify-center text-xl shadow-2xs">
          <i className="ri-file-check-line" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-black text-gray-900">
              Candidate Approval Form (CAF)
            </h2>
            <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-700 border border-gray-200">
              {formNumber || "CAF-2026-..."}
            </span>
            <span
              className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                isCompleted
                  ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                  : "bg-amber-100 text-amber-800 border border-amber-200"
              }`}
            >
              {isCompleted ? "All 4 Approved" : `${approvedCount}/4 Signed`}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            For candidate <span className="font-bold text-gray-800">{candidateName}</span> &bull; {jobTitle || "Role"}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
      >
        <i className="ri-close-line text-lg" />
      </button>
    </div>
  );
});
