import { memo } from "react";
import { PayslipModal } from "./PayslipModal";
import { RecordModal } from "./RecordModal";
import { BranchPayrollPolicyModal } from "./BranchPayrollPolicyModal";
import type { PayrollRecord, PayrollForm, Employee, BranchPayrollPolicy } from "../../types";

interface PayrollModalsContainerProps {
  payslipModal: PayrollRecord | null;
  setPayslipModal: (val: PayrollRecord | null) => void;
  recordModal: { open: boolean; record: PayrollRecord | null };
  setRecordModal: (val: { open: boolean; record: PayrollRecord | null }) => void;
  recordForm: PayrollForm;
  setRecordForm: React.Dispatch<React.SetStateAction<PayrollForm>>;
  employees: Employee[];
  savingRecord: boolean;
  handleSaveRecord: (e: React.FormEvent) => Promise<void>;

  policyModalOpen: boolean;
  setPolicyModalOpen: (val: boolean) => void;
  branchPolicy: BranchPayrollPolicy | null;
  activeBranchName?: string;
  isSuperAdmin: boolean;
  canViewAll: boolean;
  savingPolicy: boolean;
  handleSavePolicy: (policyUpdates: Partial<BranchPayrollPolicy>) => Promise<void>;
}

export const PayrollModalsContainer = memo(function PayrollModalsContainer({
  payslipModal,
  setPayslipModal,
  recordModal,
  setRecordModal,
  recordForm,
  setRecordForm,
  employees,
  savingRecord,
  handleSaveRecord,
  policyModalOpen,
  setPolicyModalOpen,
  branchPolicy,
  activeBranchName,
  isSuperAdmin,
  canViewAll,
  savingPolicy,
  handleSavePolicy,
}: PayrollModalsContainerProps) {
  return (
    <>
      <PayslipModal
        record={payslipModal}
        onClose={() => setPayslipModal(null)}
      />

      <RecordModal
        isOpen={recordModal.open}
        onClose={() => setRecordModal({ open: false, record: null })}
        recordToEdit={recordModal.record}
        form={recordForm}
        setForm={setRecordForm}
        employees={employees}
        saving={savingRecord}
        onSubmit={handleSaveRecord}
      />

      <BranchPayrollPolicyModal
        isOpen={policyModalOpen}
        onClose={() => setPolicyModalOpen(false)}
        policy={branchPolicy}
        branchName={activeBranchName}
        isSuperAdmin={isSuperAdmin}
        canManage={canViewAll}
        saving={savingPolicy}
        onSave={handleSavePolicy}
      />
    </>
  );
});
