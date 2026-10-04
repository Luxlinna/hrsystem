import { memo } from "react";
import type { Task, FormState, Employee } from "../../types";
import { TaskOutsideWorkMissionForm } from "./TaskOutsideWorkMissionForm";
import { TaskFormModalHeader } from "./TaskFormModalHeader";
import { useOutsideWorkMissionForm } from "./useOutsideWorkMissionForm";

interface TaskFormModalProps {
  editingTask: Task | null;
  employees: Employee[];
  currentEmployeeId?: string | null;
  saving: boolean;
  onSave: (
    form: FormState & {
      work_address?: string | null;
      work_lat?: number | null;
      work_lng?: number | null;
      work_accuracy_m?: number | null;
    },
    editId?: string
  ) => void;
  onClose: () => void;
}

export const TaskFormModal = memo(function TaskFormModal({
  editingTask,
  employees,
  currentEmployeeId,
  saving,
  onSave,
  onClose,
}: TaskFormModalProps) {
  const mission = useOutsideWorkMissionForm({
    editingTask,
    employees,
    currentEmployeeId,
    onSave,
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/45 backdrop-blur-xs animate-in fade-in duration-100 overflow-y-auto"
      onClick={() => !saving && !mission.uploading && onClose()}
    >
      <div
        className="w-full max-w-4xl rounded-2xl bg-white dark:bg-slate-900 p-5 sm:p-7 shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto animate-in zoom-in-95 duration-150 border border-gray-100 dark:border-slate-800 transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        <TaskFormModalHeader
          isEditing={Boolean(editingTask)}
          onClose={() => !saving && !mission.uploading && onClose()}
        />

        <form
          onSubmit={(e) => mission.handleOutsideWorkSubmit(e, editingTask?.status || "todo")}
          className="space-y-6"
        >
          <TaskOutsideWorkMissionForm
            employees={employees}
            primaryEmpId={mission.primaryEmpId}
            setPrimaryEmpId={mission.setPrimaryEmpId}
            missionType={mission.missionType}
            setMissionType={mission.setMissionType}
            missionFor={mission.missionFor}
            setMissionFor={mission.setMissionFor}
            subject={mission.subject}
            setSubject={mission.setSubject}
            fromDate={mission.fromDate}
            setFromDate={mission.setFromDate}
            toDate={mission.toDate}
            setToDate={mission.setToDate}
            totalDays={mission.totalDays}
            setTotalDays={mission.setTotalDays}
            priority={mission.missionPriority}
            setPriority={mission.setMissionPriority}
            location={mission.owLocation}
            setLocation={mission.setOwLocation}
            detail={mission.detail}
            setDetail={mission.setDetail}
            remark={mission.remark}
            setRemark={mission.setRemark}
            otherTeamMembers={mission.otherTeamMembers}
            setOtherTeamMembers={mission.setOtherTeamMembers}
            attachmentFile={mission.attachmentFile}
            setAttachmentFile={mission.setAttachmentFile}
          />

          <div className="pt-4 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between">
            <button
              type="submit"
              disabled={saving || mission.uploading || !mission.subject.trim() || !mission.primaryEmpId}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0284c7] hover:bg-[#0369a1] text-white rounded-md text-xs font-semibold cursor-pointer shadow-xs disabled:opacity-50 transition-colors"
            >
              <i
                className={
                  saving || mission.uploading
                    ? "ri-loader-4-line animate-spin text-sm"
                    : "ri-save-line text-sm"
                }
              />
              <span>
                {saving || mission.uploading
                  ? "Saving Mission..."
                  : editingTask
                  ? "Save Changes"
                  : mission.otherTeamMembers.length > 0
                  ? `Create Mission (${1 + mission.otherTeamMembers.length} Tasks)`
                  : "Save Mission"}
              </span>
              <i className="ri-arrow-down-s-line text-xs ml-0.5" />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-gray-500 hover:text-gray-700 dark:text-slate-400 cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});
