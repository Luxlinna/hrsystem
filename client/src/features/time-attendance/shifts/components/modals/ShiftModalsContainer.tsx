import { memo } from "react";
import { CreateEditShiftModal } from "./CreateEditShiftModal";
import { DuplicateShiftModal } from "./DuplicateShiftModal";
import { DeleteShiftConfirmModal } from "./DeleteShiftConfirmModal";
import { AssignStaffModal } from "./AssignStaffModal";
import { CopyWeekModal } from "./CopyWeekModal";
import { WorkloadDrawer } from "../drawers/WorkloadDrawer";
import type { useShifts } from "../../hooks/useShifts";

interface ShiftModalsContainerProps {
  shiftsState: ReturnType<typeof useShifts>;
}

export const ShiftModalsContainer = memo(function ShiftModalsContainer({ shiftsState }: ShiftModalsContainerProps) {
  return (
    <>
      <CreateEditShiftModal
        showCreateModal={shiftsState.showCreateModal}
        showEditModal={shiftsState.showEditModal}
        onClose={() => {
          shiftsState.setShowCreateModal(false);
          shiftsState.setShowEditModal(false);
        }}
        shiftForm={shiftsState.shiftForm}
        setShiftForm={shiftsState.setShiftForm}
        branches={shiftsState.branches}
        departments={shiftsState.departments}
        submitting={shiftsState.submitting}
        onApplyTemplate={shiftsState.applyTemplate}
        onSubmit={shiftsState.showEditModal ? shiftsState.handleEditShift : shiftsState.handleCreateShift}
      />

      <DuplicateShiftModal
        show={shiftsState.showDuplicateModal}
        onClose={() => shiftsState.setShowDuplicateModal(false)}
        selectedShift={shiftsState.selectedShift}
        duplicateDate={shiftsState.duplicateDate}
        setDuplicateDate={shiftsState.setDuplicateDate}
        submitting={shiftsState.submitting}
        onSubmit={shiftsState.handleDuplicateShift}
      />

      <DeleteShiftConfirmModal
        show={shiftsState.showDeleteConfirm}
        onClose={() => shiftsState.setShowDeleteConfirm(false)}
        selectedShift={shiftsState.selectedShift}
        submitting={shiftsState.submitting}
        onConfirm={shiftsState.handleDeleteShift}
      />

      <CopyWeekModal
        show={shiftsState.showCopyWeekModal}
        onClose={() => shiftsState.setShowCopyWeekModal(false)}
        weekShifts={shiftsState.weekShifts}
        weekDates={shiftsState.weekDates}
        copyIncludeStaff={shiftsState.copyIncludeStaff}
        setCopyIncludeStaff={shiftsState.setCopyIncludeStaff}
        submitting={shiftsState.submitting}
        onCopyWeekSchedule={shiftsState.handleCopyWeekSchedule}
      />

      <AssignStaffModal
        show={shiftsState.showAssignModal}
        onClose={() => shiftsState.setShowAssignModal(false)}
        selectedShift={shiftsState.selectedShift}
        selectedShiftAssignments={shiftsState.selectedShiftAssignments}
        employees={shiftsState.employees}
        departments={shiftsState.departments}
        remainingSpots={shiftsState.remainingSpots}
        assignEmployeeIds={shiftsState.assignEmployeeIds}
        setAssignEmployeeIds={shiftsState.setAssignEmployeeIds}
        assignSearch={shiftsState.assignSearch}
        setAssignSearch={shiftsState.setAssignSearch}
        assignDeptFilter={shiftsState.assignDeptFilter}
        setAssignDeptFilter={shiftsState.setAssignDeptFilter}
        checkEmployeeConflict={shiftsState.checkEmployeeConflict}
        submitting={shiftsState.submitting}
        onAssign={shiftsState.handleAssign}
        onOpenEditShift={shiftsState.openEditModal}
      />

      <WorkloadDrawer
        show={shiftsState.showWorkloadDrawer}
        onClose={() => shiftsState.setShowWorkloadDrawer(false)}
        weekDates={shiftsState.weekDates}
        staffWorkload={shiftsState.staffWorkload}
      />
    </>
  );
});
