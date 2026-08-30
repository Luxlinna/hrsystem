import { memo } from "react";
import { LeaveRequestModal } from "./LeaveRequestModal";
import { LeaveApprovalModal } from "./LeaveApprovalModal";
import { LeaveCancelModal } from "./LeaveCancelModal";
import { LeaveInspectModal } from "./LeaveInspectModal";
import type { Employee, LeaveRequest, LeaveFormData } from "../../types";

interface LeaveModalsContainerProps {
  showForm: boolean;
  setShowForm: (val: boolean) => void;
  formData: LeaveFormData;
  setFormData: React.Dispatch<React.SetStateAction<LeaveFormData>>;
  employees: Employee[];
  myEmployee: Employee | null;
  myApproverName: string;
  canManage: boolean;
  submitting: boolean;
  getRemaining: (empId: string, type: string) => number | null;
  handleSubmitRequest: (e: React.FormEvent) => Promise<void>;

  showApprovalModal: boolean;
  setShowApprovalModal: (val: boolean) => void;
  selectedRequest: LeaveRequest | null;
  approvalAction: "approved" | "rejected";
  approvalNote: string;
  setApprovalNote: (val: string) => void;
  processingApproval: boolean;
  handleProcessApproval: () => Promise<void>;

  showCancelModal: boolean;
  setShowCancelModal: (val: boolean) => void;
  cancelTargetRequest: LeaveRequest | null;
  cancelReason: string;
  setCancelReason: (val: string) => void;
  processingCancel: boolean;
  handleCancelRequest: () => Promise<void>;

  inspectRequest: LeaveRequest | null;
  setInspectRequest: (req: LeaveRequest | null) => void;
  canApproveLeave: boolean;
  onOpenApprovalModal: (req: LeaveRequest, action: "approved" | "rejected") => void;
  onOpenCancelModal: (req: LeaveRequest) => void;
}

export const LeaveModalsContainer = memo(function LeaveModalsContainer({
  showForm,
  setShowForm,
  formData,
  setFormData,
  employees,
  myEmployee,
  myApproverName,
  canManage,
  submitting,
  getRemaining,
  handleSubmitRequest,
  showApprovalModal,
  setShowApprovalModal,
  selectedRequest,
  approvalAction,
  approvalNote,
  setApprovalNote,
  processingApproval,
  handleProcessApproval,
  showCancelModal,
  setShowCancelModal,
  cancelTargetRequest,
  cancelReason,
  setCancelReason,
  processingCancel,
  handleCancelRequest,
  inspectRequest,
  setInspectRequest,
  canApproveLeave,
  onOpenApprovalModal,
  onOpenCancelModal,
}: LeaveModalsContainerProps) {
  return (
    <>
      <LeaveRequestModal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        formData={formData}
        setFormData={setFormData}
        employees={employees}
        myEmployee={myEmployee}
        myApproverName={myApproverName}
        canManage={canManage}
        submitting={submitting}
        getRemaining={getRemaining}
        onSubmit={handleSubmitRequest}
      />

      <LeaveApprovalModal
        isOpen={showApprovalModal}
        onClose={() => setShowApprovalModal(false)}
        selectedRequest={selectedRequest}
        approvalAction={approvalAction}
        approvalNote={approvalNote}
        setApprovalNote={setApprovalNote}
        processingApproval={processingApproval}
        onConfirm={handleProcessApproval}
      />

      <LeaveCancelModal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        cancelTargetRequest={cancelTargetRequest}
        cancelReason={cancelReason}
        setCancelReason={setCancelReason}
        processingCancel={processingCancel}
        onConfirm={handleCancelRequest}
      />

      <LeaveInspectModal
        inspectRequest={inspectRequest}
        onClose={() => setInspectRequest(null)}
        canApproveLeave={canApproveLeave}
        myEmployeeId={myEmployee?.id || ""}
        onOpenApprovalModal={onOpenApprovalModal}
        onOpenCancelModal={onOpenCancelModal}
      />
    </>
  );
});
