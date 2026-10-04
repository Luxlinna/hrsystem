import { memo } from "react";
import { QuickRequestModal } from "./QuickRequestModal";
import { LeaveInspectModal } from "./LeaveInspectModal";
import { DayLeavesModal } from "./DayLeavesModal";
import type { Employee, LeaveRequest, QuickRequestFormData } from "../../types";

interface LeaveCalendarModalsContainerProps {
  showRequestModal: boolean;
  setShowRequestModal: (val: boolean) => void;
  formData: QuickRequestFormData;
  setFormData: React.Dispatch<React.SetStateAction<QuickRequestFormData>>;
  employees: Employee[];
  myEmployee: Employee | null;
  canManage: boolean;
  submitting: boolean;
  handleQuickRequestSubmit: (e: React.FormEvent) => void;

  inspectLeave: LeaveRequest | null;
  setInspectLeave: (leave: LeaveRequest | null) => void;

  dayLeavesModal: { day: number; leaves: LeaveRequest[] } | null;
  setDayLeavesModal: (val: { day: number; leaves: LeaveRequest[] } | null) => void;
  month: number;
  year: number;
}

export const LeaveCalendarModalsContainer = memo(function LeaveCalendarModalsContainer({
  showRequestModal,
  setShowRequestModal,
  formData,
  setFormData,
  employees,
  myEmployee,
  canManage,
  submitting,
  handleQuickRequestSubmit,
  inspectLeave,
  setInspectLeave,
  dayLeavesModal,
  setDayLeavesModal,
  month,
  year,
}: LeaveCalendarModalsContainerProps) {
  return (
    <>
      <QuickRequestModal
        isOpen={showRequestModal}
        onClose={() => setShowRequestModal(false)}
        formData={formData}
        setFormData={setFormData}
        employees={employees}
        myEmployee={myEmployee}
        canManage={canManage}
        submitting={submitting}
        onSubmit={handleQuickRequestSubmit}
      />

      <LeaveInspectModal
        inspectLeave={inspectLeave}
        onClose={() => setInspectLeave(null)}
      />

      <DayLeavesModal
        dayLeavesModal={dayLeavesModal}
        onClose={() => setDayLeavesModal(null)}
        month={month}
        year={year}
        onInspectLeave={setInspectLeave}
      />
    </>
  );
});
