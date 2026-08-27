import { memo } from "react";
import type { Offboarding } from "../../types";
import { OffboardingProgressStepper } from "./OffboardingProgressStepper";
import { OffboardingTaskList } from "./OffboardingTaskList";
import { STATUS_CONFIG } from "../../constants";
import { initials, formatRelativeDays } from "../../offboardUtils";

interface OffboardingCardProps {
  offboarding: Offboarding;
  onUpdateStatus: (id: string, status: string) => void;
  onToggleTask: (taskId: string, currentStatus: string) => void;
  onOpenAddTaskModal: (offboardingId: string) => void;
  onOpenEditModal: (o: Offboarding) => void;
  onDeleteOffboarding: (id: string, name: string) => void;
}

export const OffboardingCard = memo(function OffboardingCard({
  offboarding,
  onUpdateStatus,
  onToggleTask,
  onOpenAddTaskModal,
  onOpenEditModal,
  onDeleteOffboarding,
}: OffboardingCardProps) {
  const emp = offboarding.employees;
  const fullName = emp ? `${emp.first_name} ${emp.last_name}` : "Unknown Staff";
  const statusCfg = STATUS_CONFIG[offboarding.status] || STATUS_CONFIG.notice_period;

  return (
    <div
      id={`offboarding-${offboarding.id}`}
      tabIndex={-1}
      className="bg-white rounded-3xl border border-gray-200/80 p-5 sm:p-6 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between focus:ring-2 focus:ring-[#253C7D] outline-none"
    >
      <div>
        {/* Header: Employee Profile & Status Pill */}
        <div className="flex items-start justify-between gap-3 mb-3.5">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-[#253C7D]/10 text-[#253C7D] font-extrabold text-sm flex items-center justify-center shrink-0">
              {initials(emp?.first_name, emp?.last_name)}
            </div>
            <div className="min-w-0">
              <h4 className="font-extrabold text-sm sm:text-base text-gray-900 truncate">{fullName}</h4>
              <p className="text-[11px] text-gray-400 font-medium truncate">
                {emp?.role || "Staff"} &middot; {emp?.department || "General"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => onOpenEditModal(offboarding)}
              className="p-1.5 text-gray-400 hover:text-[#253C7D] hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              title="Edit Offboarding"
            >
              <i className="ri-edit-line text-sm" />
            </button>
            <button
              onClick={() => onDeleteOffboarding(offboarding.id, fullName)}
              className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
              title="Delete Record"
            >
              <i className="ri-delete-bin-line text-sm" />
            </button>
          </div>
        </div>

        {/* Departure Meta Details */}
        <div className="p-3 bg-gray-50/70 rounded-2xl border border-gray-100 mb-3.5 text-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-gray-400 font-medium">Last Working Day:</span>
            <span className="font-extrabold text-gray-900">
              {offboarding.last_day ? new Date(offboarding.last_day).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-400 font-medium">Timeline:</span>
            <span className="font-bold text-amber-700">{formatRelativeDays(offboarding.last_day)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-400 font-medium">Departure Reason:</span>
            <span className="font-bold text-gray-700 truncate max-w-[170px]">{offboarding.reason}</span>
          </div>
        </div>

        {/* Lifecycle Stepper */}
        <OffboardingProgressStepper
          currentStatus={offboarding.status}
          onUpdateStatus={(s) => onUpdateStatus(offboarding.id, s)}
        />

        {/* Tasks List */}
        <OffboardingTaskList
          tasks={offboarding.tasks || []}
          onToggleTask={onToggleTask}
          onOpenAddTaskModal={() => onOpenAddTaskModal(offboarding.id)}
        />
      </div>
    </div>
  );
});
