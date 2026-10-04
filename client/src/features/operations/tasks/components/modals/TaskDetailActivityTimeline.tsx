import { memo } from "react";
import type { TaskActivity } from "../../types";
import { ACTIVITY_ICON, ACTIVITY_COLOR } from "../../constants";
import { formatRelative, activityText } from "../../taskUtils";

interface TaskDetailActivityTimelineProps {
  activities: TaskActivity[];
  loadingActivities: boolean;
}

export const TaskDetailActivityTimeline = memo(function TaskDetailActivityTimeline({
  activities,
  loadingActivities,
}: TaskDetailActivityTimelineProps) {
  return (
    <div>
      <h4 className="font-bold text-gray-800 mb-3 uppercase tracking-wider text-[10px]">
        Activity History
      </h4>
      {loadingActivities ? (
        <div className="py-6 text-center text-gray-400">Loading activity…</div>
      ) : activities.length === 0 ? (
        <p className="text-gray-400 italic">No activity recorded yet.</p>
      ) : (
        <div className="space-y-3 pl-2 border-l-2 border-gray-100">
          {activities.map((a) => (
            <div key={a.id} className="relative pl-3 space-y-0.5">
              <div
                className={`absolute -left-[19px] top-0.5 w-4 h-4 rounded-full bg-white flex items-center justify-center ${ACTIVITY_COLOR[a.action]}`}
              >
                <i className={ACTIVITY_ICON[a.action]} />
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-gray-800">
                  {a.employees ? `${a.employees.first_name} ${a.employees.last_name}` : "User"}
                </span>
                <span className="text-[10px] text-gray-400">{formatRelative(a.created_at)}</span>
              </div>
              <p className="text-gray-500">{activityText(a)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});
