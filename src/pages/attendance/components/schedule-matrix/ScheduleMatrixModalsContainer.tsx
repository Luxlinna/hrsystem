import { memo } from "react";
import { AttendanceLogModal } from "./AttendanceLogModal";
import { CreateMissionModal } from "./CreateMissionModal";
import { CreateCellLeaveModal } from "./CreateCellLeaveModal";
import type { ContextMenuTarget } from "./ScheduleMatrixContextMenu";

interface ScheduleMatrixModalsContainerProps {
  logModalTarget: ContextMenuTarget | null;
  leaveModal: { target: ContextMenuTarget; mode: "self" | "for_employee" } | null;
  missionModal: { target: ContextMenuTarget; mode: "self" | "for_employee" } | null;
  onCloseLog: () => void;
  onCloseLeave: () => void;
  onCloseMission: () => void;
}

export const ScheduleMatrixModalsContainer = memo(function ScheduleMatrixModalsContainer({
  logModalTarget,
  leaveModal,
  missionModal,
  onCloseLog,
  onCloseLeave,
  onCloseMission,
}: ScheduleMatrixModalsContainerProps) {
  return (
    <>

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
