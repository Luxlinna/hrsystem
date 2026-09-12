import type { OfferLetter } from "../../types";
import type { WorkflowModalType } from "../../hooks/useOfferLetters";
import { isHrDivisionScope } from "@/services/formLogoService";
import { getWorkflowStepMeta } from "./workflow/workflowStepConfig";
import { WorkflowPermissionGuard } from "./workflow/WorkflowPermissionGuard";
import { WorkflowOfferSummary } from "./workflow/WorkflowOfferSummary";
import { WorkflowStepRenderer } from "./workflow/WorkflowStepRenderer";
import { useOfferWorkflowState } from "./workflow/useOfferWorkflowState";

interface OfferWorkflowModalProps {
  isOpen: boolean;
  onClose: () => void;
  offer: OfferLetter | null;
  modalType: WorkflowModalType;
  actorName?: string;
  onApproveSalary?: (offer: OfferLetter, notes?: string) => Promise<void>;
  onApproveBuCeo?: (offer: OfferLetter, notes?: string) => Promise<void>;
  onApproveHrManager?: (offer: OfferLetter, notes?: string) => Promise<void>;
  onApproveHrDirector?: (offer: OfferLetter, notes?: string) => Promise<void>;
  onAuthorizeChairwoman?: (offer: OfferLetter, notes?: string) => Promise<void>;
  onGenerateDraft?: (offer: OfferLetter) => Promise<void>;
  onEndorseHrReview: (offer: OfferLetter, notes?: string) => Promise<void>;
  onApproveManagement: (offer: OfferLetter, notes?: string) => Promise<void>;
  onIssueOffer: (offer: OfferLetter, expiryDate?: string) => Promise<void>;
  onRecordDecision: (
    offer: OfferLetter,
    decision: "accepted" | "rejected",
    notes?: string,
    rejectionReason?: string,
    signedDoc?: { name: string; url: string; size?: number; type?: string }
  ) => Promise<void>;
  onExportPdf: (offer: OfferLetter) => void;
  onExportWord?: (offer: OfferLetter) => void;
}

export function OfferWorkflowModal(props: OfferWorkflowModalProps) {
  const { isOpen, onClose, offer, modalType, onExportPdf, onExportWord } = props;
  const state = useOfferWorkflowState(props);

  if (!isOpen || !offer || !modalType || modalType === "preview") return null;

  // HR-only stages security guard
  const hrOnlyModalTypes = [
    "hr_manager_approval",
    "hr_director_approval",
    "chairwoman_approval",
    "hr_review",
    "management_approval",
    "issue_offer",
  ];
  if (!state.isCurrentScopeHr && hrOnlyModalTypes.includes(modalType)) {
    return (
      <WorkflowPermissionGuard
        effectiveBranchName={state.effectiveBranchName}
        canSwitchToHr={state.canSwitchToHr}
        roleName={state.role?.name}
        onSwitchToHr={() => {
          const hrBranch = state.branches.find((b) => isHrDivisionScope(b.name));
          state.setSelectedBranchId(hrBranch ? hrBranch.id : "all");
        }}
        onClose={onClose}
      />
    );
  }

  const meta = getWorkflowStepMeta(modalType, offer, state.decision);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className={`px-6 py-4 bg-gradient-to-r ${meta.color} text-white flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-xl">
              <i className={meta.icon} />
            </div>
            <div>
              <h2 className="text-base font-extrabold tracking-tight">{meta.title}</h2>
              <p className="text-xs text-white/80">{meta.subtitle}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
          >
            <i className="ri-close-line text-lg" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 text-slate-800">
          <WorkflowOfferSummary
            offer={offer}
            modalType={modalType}
            canActOnStep={state.canActOnStep}
            roleName={state.role?.name}
          />

          <WorkflowStepRenderer
            modalType={modalType}
            offer={offer}
            onExportPdf={onExportPdf}
            onExportWord={onExportWord}
            checkTerms={state.checkTerms}
            setCheckTerms={state.setCheckTerms}
            checkRemuneration={state.checkRemuneration}
            setCheckRemuneration={state.setCheckRemuneration}
            checkProbation={state.checkProbation}
            setCheckProbation={state.setCheckProbation}
            checkCompliance={state.checkCompliance}
            setCheckCompliance={state.setCheckCompliance}
            hrReviewer={state.hrReviewer}
            setHrReviewer={state.setHrReviewer}
            expiryDate={state.expiryDate}
            setExpiryDate={state.setExpiryDate}
            decision={state.decision}
            setDecision={state.setDecision}
            rejectionReason={state.rejectionReason}
            setRejectionReason={state.setRejectionReason}
            otherReason={state.otherReason}
            setOtherReason={state.setOtherReason}
            signedFile={state.signedFile}
            setSignedFile={state.setSignedFile}
          />

          {/* Action Notes */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              {modalType === "decision" ? "Candidate Response Notes" : "Approval / Review Notes (Optional)"}
            </label>
            <textarea
              rows={2}
              placeholder="Add any context, remarks, or specific instructions..."
              value={state.notes}
              onChange={(e) => state.setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
            />
          </div>

          {/* Quick Export Actions */}
          {!["salary_proposal"].includes(offer.status) && (
            <div className="pt-2 flex items-center justify-end gap-2">
              {onExportWord && (
                <button
                  type="button"
                  onClick={() => onExportWord(offer)}
                  className="text-xs font-bold text-sky-700 hover:text-sky-900 flex items-center gap-1.5 cursor-pointer bg-sky-50/80 hover:bg-sky-100/80 px-3 py-1.5 rounded-lg border border-sky-200/60 transition-colors"
                  title="Download official Offer Letter Word document (.docx)"
                >
                  <i className="ri-file-word-line text-sm text-sky-700" /> Export Word (.docx)
                </button>
              )}
              <button
                type="button"
                onClick={() => onExportPdf(offer)}
                className="text-xs font-bold text-blue-700 hover:text-blue-900 flex items-center gap-1.5 cursor-pointer bg-blue-50/80 hover:bg-blue-100/80 px-3 py-1.5 rounded-lg border border-blue-200/60 transition-colors"
                title="Preview or print official Offer Letter PDF"
              >
                <i className="ri-file-pdf-line text-sm text-rose-600" /> Preview / Print PDF
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={state.submitting || state.uploadingSignedFile || !state.canActOnStep}
            onClick={state.handleAction}
            title={!state.canActOnStep ? "Your role does not have authorization permissions for this step" : undefined}
            className="px-5 py-2 text-xs font-bold text-white bg-[#253C7D] hover:bg-[#1e3066] rounded-lg shadow-sm transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {state.submitting || state.uploadingSignedFile ? (
              <>
                <i className="ri-loader-4-line animate-spin" />
                <span>{state.uploadingSignedFile ? "Uploading Scan to S3..." : "Saving..."}</span>
              </>
            ) : (
              <>
                <i className={meta.icon} />
                <span>{meta.actionBtn}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
