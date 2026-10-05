import { memo } from "react";
import type { JobDescriptionTemplate } from "../../types";
import { CreateSalaryProposalModal } from "../offers/CreateSalaryProposalModal";
import { OfferWorkflowModal } from "../offers/OfferWorkflowModal";
import { HireModalsContainer } from "./HireModalsContainer";
import { ImportHiringInfoModal } from "./ImportHiringInfoModal";
import { ManageJdTemplatesModal } from "./ManageJdTemplatesModal";
import { CandidateCvBankModal } from "./CandidateCvBankModal";

interface HirePageModalsProps {
  h: any;
  offersManager: any;
  showImportModal: boolean;
  setShowImportModal: (show: boolean) => void;
  showJdModal: boolean;
  setShowJdModal: (show: boolean) => void;
  showCvBankModal: boolean;
  setShowCvBankModal: (show: boolean) => void;
  jdTemplates: JobDescriptionTemplate[];
  loadJdTemplates: () => Promise<void>;
}

export const HirePageModals = memo(function HirePageModals({
  h,
  offersManager,
  showImportModal,
  setShowImportModal,
  showJdModal,
  setShowJdModal,
  showCvBankModal,
  setShowCvBankModal,
  jdTemplates,
  loadJdTemplates,
}: HirePageModalsProps) {
  return (
    <>
      <CreateSalaryProposalModal
        isOpen={offersManager.isCreateProposalOpen}
        onClose={offersManager.closeCreateProposal}
        candidate={offersManager.targetCandidate}
        candidates={h.candidates}
        hiringRequests={h.hiringRequests}
        existingOffers={offersManager.offers}
        onSubmit={offersManager.handleCreateProposal}
      />

      <OfferWorkflowModal
        isOpen={Boolean(offersManager.activeOffer && offersManager.modalType)}
        onClose={offersManager.closeWorkflowModal}
        offer={offersManager.activeOffer}
        modalType={offersManager.modalType}
        actorName={offersManager.currentUserName}
        onApproveBuCeo={offersManager.handleApproveBuCeo}
        onApproveHrManager={offersManager.handleApproveHrManager}
        onApproveHrDirector={offersManager.handleApproveHrDirector}
        onAuthorizeChairwoman={offersManager.handleAuthorizeChairwoman}
        onApproveSalary={offersManager.handleApproveSalary}
        onGenerateDraft={offersManager.handleGenerateDraft}
        onEndorseHrReview={offersManager.handleEndorseHrReview}
        onApproveManagement={offersManager.handleApproveManagement}
        onIssueOffer={offersManager.handleIssueOffer}
        onRecordDecision={offersManager.handleRecordDecision}
        onExportPdf={offersManager.handleExportPdf}
        onExportWord={offersManager.handleExportWord}
      />

      <HireModalsContainer {...h} />

      <ImportHiringInfoModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onSuccess={h.loadData}
      />

      <ManageJdTemplatesModal
        isOpen={showJdModal}
        onClose={() => setShowJdModal(false)}
        templates={jdTemplates}
        onRefresh={loadJdTemplates}
        isSuperAdmin={h.isSuperAdmin}
        isAdmin={h.isAdmin}
      />

      <CandidateCvBankModal
        isOpen={showCvBankModal}
        onClose={() => setShowCvBankModal(false)}
        candidates={h.candidates}
        onRefresh={h.loadData}
        isSuperAdmin={h.isSuperAdmin}
        isAdmin={h.isAdmin}
      />
    </>
  );
});
