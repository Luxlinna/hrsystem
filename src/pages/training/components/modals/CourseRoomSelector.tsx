import { memo } from "react";
import type { CourseFormState, MeetingRoomOption, Branch } from "../../types";
import type { LocationType } from "./courseModalUtils";
import type { RoomBookingItem } from "./useRoomSchedule";
import { CourseRoomScheduleView } from "./CourseRoomScheduleView";
import { RequirementsSelectDropdown } from "@/pages/meeting-rooms/components/modals/RequirementsSelectDropdown";
import { RefreshmentsSelectDropdown } from "@/pages/meeting-rooms/components/modals/RefreshmentsSelectDropdown";

interface CourseRoomSelectorProps {
  availableRooms: MeetingRoomOption[];
  selectedRoom: MeetingRoomOption | null;
  branches: Branch[];
  form: CourseFormState;
  setForm: React.Dispatch<React.SetStateAction<CourseFormState>>;
  setLocType: React.Dispatch<React.SetStateAction<LocationType>>;
  onRoomSelect: (roomId: string) => void;
  roomBookings: RoomBookingItem[];
  loadingSchedule: boolean;
  conflict: RoomBookingItem | null;
}

export const CourseRoomSelector = memo(function CourseRoomSelector({
  availableRooms,
  selectedRoom,
  branches,
  form,
  setForm,
  setLocType,
  onRoomSelect,
  roomBookings,
  loadingSchedule,
  conflict,
}: CourseRoomSelectorProps) {
  if (availableRooms.length === 0) {
    return (
      <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <i className="ri-information-line text-base text-amber-600" />
          <span>No meeting rooms registered for this branch yet.</span>
        </div>
        <button
          type="button"
          onClick={() => setLocType("custom")}
          className="font-bold text-[#253C7D] hover:underline cursor-pointer"
        >
          Type custom location →
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-gray-500 font-medium">
          Select from registered branch rooms:
        </span>
        <span className="text-[11px] font-semibold text-blue-700 bg-blue-100/60 px-2 py-0.5 rounded-full">
          {availableRooms.length} {availableRooms.length === 1 ? "room" : "rooms"} available
        </span>
      </div>

      <div className="space-y-2.5">
        <select
          value={selectedRoom?.id || ""}
          onChange={(e) => onRoomSelect(e.target.value)}
          className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-xs sm:text-sm font-bold text-gray-900 focus:outline-none focus:border-[#253C7D] focus:ring-2 focus:ring-[#253C7D]/10 cursor-pointer shadow-xs"
        >
          <option value="">-- Choose a Meeting Room --</option>
          {availableRooms.map((room) => {
            const branchName = branches.find((b) => b.id === room.branch_id)?.name;
            const details = [
              room.floor ? `Floor ${room.floor}` : null,
              room.capacity ? `Cap: ${room.capacity} seats` : null,
              branchName && form.is_admin_course ? branchName : null,
            ]
              .filter(Boolean)
              .join(" · ");

            return (
              <option key={room.id} value={room.id}>
                🏢 {room.name} {details ? `(${details})` : ""}
              </option>
            );
          })}
        </select>

        {selectedRoom && (
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-white rounded-2xl border border-blue-200 text-xs shadow-xs">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-3.5 h-3.5 rounded-full shrink-0 ring-2 ring-white shadow-xs"
                  style={{ backgroundColor: selectedRoom.color || "#253C7D" }}
                />
                <span className="font-extrabold text-sm text-gray-900">
                  {selectedRoom.name}
                </span>
                {selectedRoom.floor && (
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-md font-bold text-xs">
                    Floor {selectedRoom.floor}
                  </span>
                )}
                {selectedRoom.capacity && (
                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-md font-bold text-xs flex items-center gap-1">
                    <i className="ri-team-line" /> {selectedRoom.capacity} Seats
                  </span>
                )}
              </div>
              <span className="text-xs font-extrabold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                <i className="ri-checkbox-circle-fill text-emerald-500 text-sm" /> Reserved for
                Training
              </span>
            </div>

            <CourseRoomScheduleView
              scheduledDate={form.scheduled_date}
              loadingSchedule={loadingSchedule}
              conflict={conflict}
              roomBookings={roomBookings}
            />

            <div className="pt-2.5 space-y-3.5 border-t border-slate-200/80">
              <RequirementsSelectDropdown
                selectedRequirements={form.special_requirements || []}
                onToggleRequirement={(req) => {
                  const current = form.special_requirements || [];
                  const updated = current.includes(req)
                    ? current.filter((r) => r !== req)
                    : [...current, req];
                  setForm((prev) => ({ ...prev, special_requirements: updated }));
                }}
                onSetRequirements={(reqs) => {
                  setForm((prev) => ({ ...prev, special_requirements: reqs }));
                }}
                customReq={form.custom_requirement || ""}
                setCustomReq={(val) => {
                  setForm((prev) => ({ ...prev, custom_requirement: val }));
                }}
              />

              <RefreshmentsSelectDropdown
                selectedRefreshments={form.refreshments || []}
                onToggleRefreshment={(ref) => {
                  const current = form.refreshments || [];
                  const updated = current.includes(ref)
                    ? current.filter((r) => r !== ref)
                    : [...current, ref];
                  setForm((prev) => ({ ...prev, refreshments: updated }));
                }}
                onSetRefreshments={(refs) => {
                  setForm((prev) => ({ ...prev, refreshments: refs }));
                }}
                customRef={form.custom_refreshment || ""}
                setCustomRef={(val) => {
                  setForm((prev) => ({ ...prev, custom_refreshment: val }));
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
});
