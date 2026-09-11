import { memo } from "react";
import type { CandidateApproval } from "../../../types";
import { SignatoryCard } from "./SignatoryCard";

interface TabProps {
  data: CandidateApproval;
  isCompleted: boolean;
  onUpdateComment: (roleKey: keyof CandidateApproval["signatories"], comment: string) => void;
  onSignStep: (roleKey: keyof CandidateApproval["signatories"]) => void;
  onApproveAll: () => void;
}

export const ApprovalSignatoriesTab = memo(function ApprovalSignatoriesTab({
  data,
  isCompleted,
  onUpdateComment,
  onSignStep,
  onApproveAll,
}: TabProps) {
  const sigs = data.signatories;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-extrabold text-gray-900">
            Section III: Final Approval Signatories
          </h3>
          <p className="text-xs text-gray-500">
            Review comments and collect authorized signatures from all 4 leadership roles.
          </p>
        </div>
        {!isCompleted && (
          <button
            type="button"
            onClick={onApproveAll}
            className="px-3 py-1.5 bg-fuchsia-50 hover:bg-fuchsia-100 text-fuchsia-700 border border-fuchsia-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <i className="ri-shield-check-line text-sm" /> Fast-Sign All (Admin)
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SignatoryCard
          stepNumber={1}
          subtitle="EXECUTIVE SIGN-OFF"
          signatory={sigs.ceo}
          onCommentChange={(comment) => onUpdateComment("ceo", comment)}
          onSign={() => onSignStep("ceo")}
        />
        <SignatoryCard
          stepNumber={2}
          subtitle="HR SIGN-OFF"
          signatory={sigs.hr_manager}
          onCommentChange={(comment) => onUpdateComment("hr_manager", comment)}
          onSign={() => onSignStep("hr_manager")}
        />
        <SignatoryCard
          stepNumber={3}
          subtitle="DIVISION DIRECTOR"
          signatory={sigs.division_director}
          onCommentChange={(comment) => onUpdateComment("division_director", comment)}
          onSign={() => onSignStep("division_director")}
        />
        <SignatoryCard
          stepNumber={4}
          subtitle="FINAL CHAIRWOMAN"
          signatory={sigs.chairwoman}
          onCommentChange={(comment) => onUpdateComment("chairwoman", comment)}
          onSign={() => onSignStep("chairwoman")}
        />
      </div>
    </div>
  );
});
