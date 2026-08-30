import { memo } from "react";
import { StartOnboardingModal } from "./StartOnboardingModal";
import { OnboardingDocModal } from "./OnboardingDocModal";
import type { EmployeeOption, OnboardingDocForm, OnboardingRequest } from "../../types";

interface OnboardingModalsContainerProps {
  showStartModal: boolean;
  setShowStartModal: (val: boolean) => void;
  startEmployeeId: string;
  setStartEmployeeId: (val: string) => void;
  empSearch: string;
  setEmpSearch: (val: string) => void;
  filteredEligibleEmployees: EmployeeOption[];
  eligibleEmployees: EmployeeOption[];
  starting: boolean;
  handleStartOnboarding: (e: React.FormEvent) => Promise<void>;

  showDocModal: boolean;
  setShowDocModal: (val: boolean) => void;
  selectedRequest: OnboardingRequest | null;
  selectedStage: string;
  docForm: OnboardingDocForm;
  setDocForm: React.Dispatch<React.SetStateAction<OnboardingDocForm>>;
  selectedFileName: string;
  editingDocId: string | null;
  uploading: boolean;
  isDragOver: boolean;
  setIsDragOver: (val: boolean) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  handleDocUpload: (e: React.FormEvent) => Promise<void>;
}

export const OnboardingModalsContainer = memo(function OnboardingModalsContainer({
  showStartModal,
  setShowStartModal,
  startEmployeeId,
  setStartEmployeeId,
  empSearch,
  setEmpSearch,
  filteredEligibleEmployees,
  eligibleEmployees,
  starting,
  handleStartOnboarding,
  showDocModal,
  setShowDocModal,
  selectedRequest,
  selectedStage,
  docForm,
  setDocForm,
  selectedFileName,
  editingDocId,
  uploading,
  isDragOver,
  setIsDragOver,
  fileInputRef,
  handleDocUpload,
}: OnboardingModalsContainerProps) {
  return (
    <>
      <StartOnboardingModal
        isOpen={showStartModal}
        onClose={() => setShowStartModal(false)}
        startEmployeeId={startEmployeeId}
        setStartEmployeeId={setStartEmployeeId}
        empSearch={empSearch}
        setEmpSearch={setEmpSearch}
        filteredEligibleEmployees={filteredEligibleEmployees}
        eligibleCount={eligibleEmployees.length}
        starting={starting}
        onSubmit={handleStartOnboarding}
      />

      <OnboardingDocModal
        isOpen={showDocModal}
        onClose={() => setShowDocModal(false)}
        selectedRequest={selectedRequest}
        selectedStage={selectedStage}
        docForm={docForm}
        setDocForm={setDocForm}
        selectedFileName={selectedFileName}
        editingDocId={editingDocId}
        uploading={uploading}
        isDragOver={isDragOver}
        setIsDragOver={setIsDragOver}
        fileInputRef={fileInputRef}
        onSubmit={handleDocUpload}
      />
    </>
  );
});
