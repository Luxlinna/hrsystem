import { memo, useMemo, useCallback } from "react";
import type { CourseFormState, MeetingRoomOption, Branch } from "../../types";
import type { LocationType } from "./courseModalUtils";
import { useRoomSchedule } from "./useRoomSchedule";
import { CourseRoomSelector } from "./CourseRoomSelector";

interface CourseLocationPickerProps {
  form: CourseFormState;
  setForm: React.Dispatch<React.SetStateAction<CourseFormState>>;
  locType: LocationType;
  setLocType: React.Dispatch<React.SetStateAction<LocationType>>;
  meetingRooms: MeetingRoomOption[];
  branches: Branch[];
}

export const CourseLocationPicker = memo(function CourseLocationPicker({
  form,
  setForm,
  locType,
  setLocType,
  meetingRooms,
  branches,
}: CourseLocationPickerProps) {
  // Available meeting rooms filtered by course branch scope
  const availableRooms = useMemo(() => {
    if (form.is_admin_course || !form.branch_id) {
      return meetingRooms;
    }
    return meetingRooms.filter((r) => !r.branch_id || r.branch_id === form.branch_id);
  }, [meetingRooms, form.is_admin_course, form.branch_id]);

  // Find currently selected room if any
  const selectedRoom = useMemo(() => {
    if (!form.location) return null;
    return availableRooms.find((r) => form.location.includes(r.name)) || null;
  }, [availableRooms, form.location]);

  const { roomBookings, loadingSchedule, conflict } = useRoomSchedule(
    selectedRoom,
    form.scheduled_date,
    form.title,
    form.start_time,
    form.end_time
  );

  const handleRoomSelect = useCallback(
    (roomId: string) => {
      const room = availableRooms.find((r) => r.id === roomId);
      if (!room) {
        setForm((prev) => ({ ...prev, location: "" }));
        return;
      }
      const roomLabel = room.floor ? `${room.name} (Floor ${room.floor})` : room.name;
      setForm((prev) => ({ ...prev, location: roomLabel }));
    },
    [availableRooms, setForm]
  );

  return (
    <div className="space-y-3">
      {/* Switcher Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <label className="block font-bold text-gray-800 text-xs">
          Training Location &amp; Venue <span className="text-rose-500">*</span>
        </label>

        <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-blue-100/90 shadow-2xs self-start sm:self-auto">
          <button
            type="button"
            onClick={() => {
              setLocType("room");
              if (availableRooms.length > 0 && !selectedRoom) {
                handleRoomSelect(availableRooms[0].id);
              }
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
              locType === "room"
                ? "bg-[#253C7D] text-white shadow-xs"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            <i className="ri-door-open-line text-sm" /> Meeting Room
          </button>
          <button
            type="button"
            onClick={() => setLocType("online")}
            className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
              locType === "online"
                ? "bg-[#253C7D] text-white shadow-xs"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            <i className="ri-video-chat-line text-sm" /> Online Link
          </button>
          <button
            type="button"
            onClick={() => setLocType("custom")}
            className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
              locType === "custom"
                ? "bg-[#253C7D] text-white shadow-xs"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            <i className="ri-map-pin-line text-sm" /> Custom
          </button>
        </div>
      </div>

      {/* Mode-Specific Input */}
      {locType === "room" ? (
        <CourseRoomSelector
          availableRooms={availableRooms}
          selectedRoom={selectedRoom}
          branches={branches}
          form={form}
          setForm={setForm}
          setLocType={setLocType}
          onRoomSelect={handleRoomSelect}
          roomBookings={roomBookings}
          loadingSchedule={loadingSchedule}
          conflict={conflict}
        />
      ) : locType === "online" ? (
        <div>
          <label className="block font-bold text-gray-700 text-xs mb-1.5 flex items-center gap-1.5">
            <i className="ri-video-chat-line text-blue-600 text-sm" /> Online Meeting URL / Link
          </label>
          <div className="relative">
            <input
              type="url"
              value={form.location}
              onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))}
              placeholder="e.g. https://meet.google.com/xyz-abcd-efg or Zoom link"
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#253C7D] font-medium"
            />
            <i className="ri-link text-gray-400 absolute left-3 top-3 text-sm" />
          </div>
        </div>
      ) : (
        <div>
          <label className="block font-bold text-gray-700 text-xs mb-1.5 flex items-center gap-1.5">
            <i className="ri-map-pin-line text-rose-500 text-sm" /> Custom Venue / Off-Site Address
          </label>
          <input
            type="text"
            value={form.location}
            onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))}
            placeholder="e.g. Building B Training Hall 4, or Grand Hotel Ballroom"
            className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#253C7D] font-medium"
          />
        </div>
      )}
    </div>
  );
});
