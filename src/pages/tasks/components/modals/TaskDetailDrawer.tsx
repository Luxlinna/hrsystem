import { memo, useEffect } from "react";
import type { Task, TaskActivity } from "../../types";
import { STATUS_CONFIG, PRIORITY_META } from "../../constants";
import { formatDueDate, formatExact, initials } from "../../taskUtils";
import { getGoogleMapsUrl } from "../../geoUtils";
import { TaskDetailActivityTimeline } from "./TaskDetailActivityTimeline";

interface TaskDetailDrawerProps {
  task: Task | null;
  activities: TaskActivity[];
  loadingActivities: boolean;
  onFetchActivities: (taskId: string) => void;
  onClose: () => void;
  onEdit: (t: Task) => void;
  onDelete: (t: Task) => void;
  onStatusChange: (task: Task, newStatus: Task["status"]) => void;
  onCheckInOut?: (task: Task, mode: "check_in" | "check_out") => void;
}

export const TaskDetailDrawer = memo(function TaskDetailDrawer({
  task,
  activities,
  loadingActivities,
  onFetchActivities,
  onClose,
  onEdit,
  onDelete,
  onCheckInOut,
}: TaskDetailDrawerProps) {
  useEffect(() => {
    if (task?.id) {
      onFetchActivities(task.id);
    }
  }, [task?.id, onFetchActivities]);

  if (!task) return null;

  const statusCfg = STATUS_CONFIG[task.status];
  const priority = PRIORITY_META[task.priority];
  const assigneeName = task.employees
    ? `${task.employees.first_name} ${task.employees.last_name}`
    : "Unassigned";

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-slate-950/40 backdrop-blur-xs animate-in fade-in duration-100"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${statusCfg.badge}`}>
              <i className={statusCfg.icon} />
              {statusCfg.label}
            </span>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold ${priority.bg} ${priority.text} border ${priority.border}`}>
              <i className={priority.icon} />
              {priority.label}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => { onClose(); onEdit(task); }}
              className="p-1.5 text-gray-400 hover:text-[#253C7D] hover:bg-gray-100 rounded-lg cursor-pointer"
            >
              <i className="ri-pencil-line text-base" />
            </button>
            <button
              onClick={() => { onClose(); onDelete(task); }}
              className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
            >
              <i className="ri-delete-bin-line text-base" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg cursor-pointer"
            >
              <i className="ri-close-line text-lg" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
          <div>
            <h2 className="text-base font-bold text-gray-900 leading-snug">{task.title}</h2>
            {task.description && (
              <p className="text-gray-600 mt-2 leading-relaxed bg-gray-50/80 p-3 rounded-xl border border-gray-100 whitespace-pre-wrap">
                {task.description}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 p-3.5 bg-gray-50/60 rounded-xl border border-gray-100">
            <div>
              <span className="text-[11px] text-gray-400 font-medium">Assignee</span>
              <div className="flex items-center gap-1.5 mt-1">
                {task.employees?.avatar_url ? (
                  <img src={task.employees.avatar_url} alt={assigneeName} className="w-5 h-5 rounded-full object-cover" />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-[#253C7D] text-white text-[9px] font-bold flex items-center justify-center">
                    {initials(assigneeName)}
                  </div>
                )}
                <span className="font-semibold text-gray-800">{assigneeName}</span>
              </div>
            </div>

            <div>
              <span className="text-[11px] text-gray-400 font-medium">Deadline</span>
              <p className="font-semibold text-gray-800 mt-1">
                {formatDueDate(task.due_date) || "No deadline"}
              </p>
            </div>
          </div>

          {task.is_outside_work && (
            <div className="rounded-xl border border-indigo-100 bg-indigo-50/30 p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-indigo-900 font-bold">
                  <i className="ri-map-pin-2-line text-indigo-600" />
                  Outside Field Work Tracking
                </div>
                {onCheckInOut && (
                  <div className="flex gap-1.5">
                    {task.work_status !== "checked_in" && task.work_status !== "checked_out" && (
                      <button
                        onClick={() => onCheckInOut(task, "check_in")}
                        className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 cursor-pointer"
                      >
                        Check In
                      </button>
                    )}
                    {task.work_status === "checked_in" && (
                      <button
                        onClick={() => onCheckInOut(task, "check_out")}
                        className="px-2.5 py-1 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 cursor-pointer"
                      >
                        Check Out
                      </button>
                    )}
                  </div>
                )}
              </div>

              {task.work_checked_in_at && (
                <div className="bg-white p-2.5 rounded-lg border border-indigo-100/70 text-[11px] space-y-1">
                  <div className="flex justify-between font-semibold text-gray-700">
                    <span>Check In Location</span>
                    <span className="text-gray-400">{formatExact(task.work_checked_in_at)}</span>
                  </div>
                  {task.work_address && <p className="text-gray-600">{task.work_address}</p>}
                  {task.work_lat && (
                    <a
                      href={getGoogleMapsUrl(task.work_lat, task.work_lng)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-indigo-600 hover:underline"
                    >
                      <i className="ri-external-link-line" />
                      View GPS Coordinates
                    </a>
                  )}
                </div>
              )}
            </div>
          )}

          <TaskDetailActivityTimeline
            activities={activities}
            loadingActivities={loadingActivities}
          />
        </div>
      </div>
    </div>
  );
});
