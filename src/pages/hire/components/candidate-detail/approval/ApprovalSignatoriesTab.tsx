import { memo } from "react";
import type { CandidateApproval } from "../../../types";
import type { StepGateStatus, ApprovalStepKey } from "../../../services/candidateApprovalPermissions";
import { SignatoryCard } from "./SignatoryCard";

interface TabProps {
  data: CandidateApproval;
  isCompleted: boolean;
  stepGates: Record<ApprovalStepKey, StepGateStatus>;
  currentUserName: string;
  canFastSign?: boolean;
  onUpdateComment: (roleKey: keyof CandidateApproval["signatories"], comment: string) => void;
  onSignStep: (roleKey: keyof CandidateApproval["signatories"]) => void;
  onApproveAll: () => void;
}

export const ApprovalSignatoriesTab = memo(function ApprovalSignatoriesTab({
  data,
  isCompleted,
  stepGates,
  currentUserName,
  canFastSign = false,
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
            Sequential 4-step sign-off: CEO (by BU) → HR Manager (HR Division) → HR Admin Director → Chairwoman.
          </p>
        </div>
        {!isCompleted && canFastSign && (
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
          subtitle="CEO OF BU"
          signatory={sigs.ceo}
          isLocked={stepGates.ceo.isLocked}
          waitingForTitle={stepGates.ceo.waitingForRoleTitle}
          canSign={stepGates.ceo.canUserSign}
          requiresPermissionHint={stepGates.ceo.requiresPermissionHint}
          currentUserName={currentUserName}
          onCommentChange={(comment) => onUpdateComment("ceo", comment)}
          onSign={() => onSignStep("ceo")}
        />
        <SignatoryCard
          stepNumber={2}
          subtitle="HR MANAGER AT HR DIVISION"
          signatory={sigs.hr_manager}
          isLocked={stepGates.hr_manager.isLocked}
          waitingForTitle={stepGates.hr_manager.waitingForRoleTitle}
          canSign={stepGates.hr_manager.canUserSign}
          requiresPermissionHint={stepGates.hr_manager.requiresPermissionHint}
          currentUserName={currentUserName}
          onCommentChange={(comment) => onUpdateComment("hr_manager", comment)}
          onSign={() => onSignStep("hr_manager")}
        />
        <SignatoryCard
          stepNumber={3}
          subtitle="HR ADMIN DIRECTOR"
          signatory={sigs.division_director}
          isLocked={stepGates.division_director.isLocked}
          waitingForTitle={stepGates.division_director.waitingForRoleTitle}
          canSign={stepGates.division_director.canUserSign}
          requiresPermissionHint={stepGates.division_director.requiresPermissionHint}
          currentUserName={currentUserName}
          onCommentChange={(comment) => onUpdateComment("division_director", comment)}
          onSign={() => onSignStep("division_director")}
        />
        <SignatoryCard
          stepNumber={4}
          subtitle="FINAL CHAIRWOMAN"
          signatory={sigs.chairwoman}
          isLocked={stepGates.chairwoman.isLocked}
          waitingForTitle={stepGates.chairwoman.waitingForRoleTitle}
          canSign={stepGates.chairwoman.canUserSign}
          requiresPermissionHint={stepGates.chairwoman.requiresPermissionHint}
          currentUserName={currentUserName}
          onCommentChange={(comment) => onUpdateComment("chairwoman", comment)}
          onSign={() => onSignStep("chairwoman")}
        />
      </div>
    </div>
  );
});
