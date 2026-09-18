import { memo } from "react";
import type { RoomBookingItem } from "./useRoomSchedule";

interface CourseRoomScheduleViewProps {
  scheduledDate?: string;
  loadingSchedule: boolean;
  conflict: RoomBookingItem | null;
  roomBookings: RoomBookingItem[];
}

export const CourseRoomScheduleView = memo(function CourseRoomScheduleView({
  scheduledDate,
  loadingSchedule,
  conflict,
  roomBookings,
}: CourseRoomScheduleViewProps) {
  return (
    <div className="p-3 bg-slate-50/80 rounded-2xl border border-slate-200/70 text-xs space-y-2">
      <div className="flex items-center justify-between">
        <span className="font-bold text-gray-700 flex items-center gap-1.5">
          <i className="ri-calendar-schedule-line text-[#253C7D]" />
          Room Schedule on {typeof scheduledDate === "string" && scheduledDate ? scheduledDate : "Selected Date"}:
        </span>
        {loadingSchedule && (
          <span className="text-[10px] text-gray-400">Checking…</span>
        )}
      </div>

      {conflict && (
        <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 font-bold flex items-center gap-2 text-xs">
          <i className="ri-alarm-warning-line text-base text-rose-600 shrink-0" />
          <div>
            <span>Time Conflict: Room is already booked ({conflict.start_time} – {conflict.end_time}) for &ldquo;{conflict.title}&rdquo;.</span>
          </div>
        </div>
      )}

      {roomBookings.length === 0 ? (
        <div className="flex items-center gap-1.5 text-emerald-700 font-semibold py-0.5">
          <i className="ri-checkbox-circle-line text-sm" />
          <span>Room is completely free all day on this date!</span>
        </div>
      ) : (
        <div className="space-y-1">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            Booked Meeting Times:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {roomBookings.map((b) => (
              <span
                key={b.id}
                className="px-2.5 py-1 bg-white border border-gray-200 rounded-lg text-[11px] font-bold text-gray-700 flex items-center gap-1 shadow-2xs"
              >
                <i className="ri-time-line text-[#253C7D]" />
                <strong>
                  {b.start_time} – {b.end_time}
                </strong>
                <span className="text-gray-400 font-normal truncate max-w-[120px]">
                  ({b.title})
                </span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});
