import { memo, useState, useMemo, useEffect } from "react";
import type { CourseFormState, Employee, MeetingRoomOption, Branch } from "../../types";
import { calculateDurationHours, detectLocationType, type LocationType } from "./courseModalUtils";
import { CourseScheduleSection } from "./CourseScheduleSection";
import { CourseAttributesGrid } from "./CourseAttributesGrid";
import { CourseEmployeeInvites } from "./CourseEmployeeInvites";

interface CourseModalFieldsProps {
  form: CourseFormState;
  setForm: React.Dispatch<React.SetStateAction<CourseFormState>>;
  employees?: Employee[];
  meetingRooms?: MeetingRoomOption[];
  branches?: Branch[];
}

export const CourseModalFields = memo(function CourseModalFields({
  form,
  setForm,
  employees = [],
  meetingRooms = [],
  branches = [],
}: CourseModalFieldsProps) {
  const isTimeBasedDuration = Boolean(form.start_time && form.end_time);

  // Auto-sync duration from start_time & end_time
  useEffect(() => {
    if (form.start_time && form.end_time) {
      const computed = calculateDurationHours(form.start_time, form.end_time);
      if (computed !== null) {
        const computedStr = String(computed);
        if (form.duration_hours !== computedStr) {
          setForm((prev) => ({ ...prev, duration_hours: computedStr }));
        }
      }
    }
  }, [form.start_time, form.end_time, form.duration_hours, setForm]);

  // Determine initial location mode
  const initialLocType = useMemo<LocationType>(
    () => detectLocationType(form.location, meetingRooms),
    [form.location, meetingRooms]
  );

  const [locType, setLocType] = useState<LocationType>(initialLocType);

  return (
    <div className="space-y-5">
      {/* Course Title */}
      <div>
        <label className="block font-extrabold text-gray-900 text-xs sm:text-sm mb-1.5">
          Course / Session Title <span className="text-rose-500">*</span>
        </label>
        <input
          type="text"
          required
          value={form.title}
          onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
          placeholder="e.g. Executive Leadership & Compliance Seminar 2026"
          className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200 rounded-2xl text-xs sm:text-sm font-semibold text-gray-900 focus:outline-none focus:border-[#253C7D] focus:bg-white focus:ring-2 focus:ring-[#253C7D]/10 transition-all"
        />
      </div>

      {/* Schedule: Specific Date, Time & Meeting Room Location */}
      <CourseScheduleSection
        form={form}
        setForm={setForm}
        locType={locType}
        setLocType={setLocType}
        meetingRooms={meetingRooms}
        branches={branches}
      />

      {/* Category, Duration, Instructor, Format Grid */}
      <CourseAttributesGrid
        form={form}
        setForm={setForm}
        isTimeBasedDuration={isTimeBasedDuration}
      />

      {/* Invite Employees Section */}
      <CourseEmployeeInvites
        form={form}
        setForm={setForm}
        employees={employees}
      />

      {/* Description / Syllabus */}
      <div>
        <label className="block font-extrabold text-gray-900 text-xs sm:text-sm mb-1.5">
          Description &amp; Syllabus
        </label>
        <textarea
          rows={3}
          value={form.description}
          onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
          placeholder="Brief description of training objectives, target audience, prerequisites, or topics covered..."
          className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200 rounded-2xl text-xs sm:text-sm font-medium focus:outline-none focus:bg-white focus:border-[#253C7D] focus:ring-2 focus:ring-[#253C7D]/10 resize-none transition-all"
        />
      </div>
    </div>
  );
});
