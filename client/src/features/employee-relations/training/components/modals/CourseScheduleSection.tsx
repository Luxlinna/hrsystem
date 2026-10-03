import { memo } from "react";
import type { CourseFormState, MeetingRoomOption, Branch } from "../../types";
import type { LocationType } from "./courseModalUtils";
import { CourseLocationPicker } from "./CourseLocationPicker";

interface CourseScheduleSectionProps {
  form: CourseFormState;
  setForm: React.Dispatch<React.SetStateAction<CourseFormState>>;
  locType: LocationType;
  setLocType: React.Dispatch<React.SetStateAction<LocationType>>;
  meetingRooms: MeetingRoomOption[];
  branches: Branch[];
}

export const CourseScheduleSection = memo(function CourseScheduleSection({
  form,
  setForm,
  locType,
  setLocType,
  meetingRooms,
  branches,
}: CourseScheduleSectionProps) {
  return (
    <div className="p-4 sm:p-5 bg-gradient-to-br from-blue-50/70 to-indigo-50/40 rounded-2xl border border-blue-100/90 space-y-4 shadow-2xs">
      <div className="flex items-center gap-2 text-xs sm:text-sm font-extrabold text-[#253C7D]">
        <div className="w-7 h-7 rounded-lg bg-[#253C7D] text-white flex items-center justify-center text-sm shadow-xs">
          <i className="ri-calendar-event-line" />
        </div>
        <span>Specific Date, Time &amp; Room Location</span>
      </div>

      {/* Date and Time Pickers */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block font-bold text-gray-700 text-xs mb-1">Session Date</label>
          <input
            type="date"
            value={form.scheduled_date}
            onChange={(e) => setForm((prev) => ({ ...prev, scheduled_date: e.target.value }))}
            className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs sm:text-sm font-semibold focus:outline-none focus:border-[#253C7D] shadow-2xs"
          />
        </div>
        <div>
          <label className="block font-bold text-gray-700 text-xs mb-1">Start Time</label>
          <input
            type="time"
            value={form.start_time}
            onChange={(e) => setForm((prev) => ({ ...prev, start_time: e.target.value }))}
            className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs sm:text-sm font-semibold focus:outline-none focus:border-[#253C7D] shadow-2xs"
          />
        </div>
        <div>
          <label className="block font-bold text-gray-700 text-xs mb-1">End Time</label>
          <input
            type="time"
            value={form.end_time}
            onChange={(e) => setForm((prev) => ({ ...prev, end_time: e.target.value }))}
            className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs sm:text-sm font-semibold focus:outline-none focus:border-[#253C7D] shadow-2xs"
          />
        </div>
      </div>

      {/* Location / Meeting Room Picker */}
      <div className="pt-2 border-t border-blue-100/60">
        <CourseLocationPicker
          form={form}
          setForm={setForm}
          locType={locType}
          setLocType={setLocType}
          meetingRooms={meetingRooms}
          branches={branches}
        />
      </div>
    </div>
  );
});
