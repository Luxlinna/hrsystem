import { memo } from "react";
import { ActionApprovalModal } from "./ActionApprovalModal";
import { BatchItemizedDrilldownModal } from "./BatchItemizedDrilldownModal";
import type { PayrollRun, PayrollRecord } from "../../types";

interface PayrollApprovalModalsContainerProps {
  actionModal: { run: PayrollRun; action: "approve" | "reject" } | null;
  setActionModal: (val: { run: PayrollRun; action: "approve" | "reject" } | null) => void;
  actionNote: string;
  setActionNote: (val: string) => void;
  acting: boolean;
  handleAction: () => Promise<void>;

  viewingBatchRecords: PayrollRun | null;
  setViewingBatchRecords: (val: PayrollRun | null) => void;
  itemizedRecords: PayrollRecord[];
}

export const PayrollApprovalModalsContainer = memo(function PayrollApprovalModalsContainer({
  actionModal,
  setActionModal,
  actionNote,
  setActionNote,
  acting,
  handleAction,
  viewingBatchRecords,
  setViewingBatchRecords,
  itemizedRecords,
}: PayrollApprovalModalsContainerProps) {
  return (
    <>
      <ActionApprovalModal
        isOpen={Boolean(actionModal)}
        onClose={() => setActionModal(null)}
        actionModal={actionModal}
        actionNote={actionNote}
        setActionNote={setActionNote}
        acting={acting}
        onConfirm={handleAction}
      />

      <BatchItemizedDrilldownModal
        isOpen={Boolean(viewingBatchRecords)}
        onClose={() => setViewingBatchRecords(null)}
        run={viewingBatchRecords}
        itemizedRecords={itemizedRecords}
      />
    </>
  );
});
