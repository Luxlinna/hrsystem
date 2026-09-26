import { memo } from "react";
import { ScheduleMatrixEditModal } from "./ScheduleMatrixEditModal";
import { AttendanceLogModal } from "./AttendanceLogModal";
import { CreateMissionModal } from "./CreateMissionModal";
import { CreateCellLeaveModal } from "./CreateCellLeaveModal";
import type { ContextMenuTarget } from "./ScheduleMatrixContextMenu";
import type { AvailableShiftItem } from "./types";

interface ScheduleMatrixModalsContainerProps {
  editingCell: {
    empId: string;
    empName: string;
    dateString: string;
    dayNumber: number;
    currentCode: string;
  } | null;
  availableShifts: AvailableShiftItem[];
  logModalTarget: ContextMenuTarget | null;
  leaveModal: { target: ContextMenuTarget; mode: "self" | "for_employee" } | null;
  missionModal: { target: ContextMenuTarget; mode: "self" | "for_employee" } | null;
  onCloseEdit: () => void;
  onSelectShift: (code: string) => void;
  onCloseLog: () => void;
  onCloseLeave: () => void;
  onCloseMission: () => void;
}

export const ScheduleMatrixModalsContainer = memo(function ScheduleMatrixModalsContainer({
  editingCell,
  availableShifts,
  logModalTarget,
  leaveModal,
  missionModal,
  onCloseEdit,
  onSelectShift,
  onCloseLog,
  onCloseLeave,
  onCloseMission,
}: ScheduleMatrixModalsContainerProps) {
  return (
    <>
      <ScheduleMatrixEditModal
        editingCell={editingCell}
        availableShifts={availableShifts}
        onClose={onCloseEdit}
        onSelectShift={onSelectShift}
      />

      <AttendanceLogModal
        target={logModalTarget}
        onClose={onCloseLog}
      />

      <CreateCellLeaveModal
        target={leaveModal?.target || null}
        formMode={leaveModal?.mode || "self"}
        onClose={onCloseLeave}
      />

      <CreateMissionModal
        target={missionModal?.target || null}
        formMode={missionModal?.mode || "self"}
        onClose={onCloseMission}
      />
    </>
  );
});
