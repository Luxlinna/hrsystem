import { memo, useMemo, useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { CourseFormState, MeetingRoomOption, Branch } from "../../types";
import { decodeCourseDescription, type LocationType } from "./courseModalUtils";

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
  const [roomBookings, setRoomBookings] = useState<
    { id: string; title: string; start_time: string; end_time: string }[]
  >([]);
  const [loadingSchedule, setLoadingSchedule] = useState(false);

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

  // Fetch booked times for this room on the scheduled date
  useEffect(() => {
    if (!selectedRoom || !form.scheduled_date) {
      setRoomBookings([]);
      return;
    }
    let cancelled = false;
    setLoadingSchedule(true);

    const loadRoomSchedule = async () => {
      // 1. Regular room bookings from room_bookings table
      const { data: rb } = await supabase
        .from("room_bookings")
        .select("id, title, start_time, end_time, status")
        .eq("room_id", selectedRoom.id)
        .eq("date", form.scheduled_date)
        .neq("status", "rejected")
        .neq("status", "cancelled");

      // 2. Training courses decoded from description
      const { data: tc } = await supabase
        .from("training_courses")
        .select("id, title, description")
        .is("deleted_at", null);

      if (cancelled) return;

      const merged: { id: string; title: string; start_time: string; end_time: string }[] = [];
      const seenTimes = new Set<string>();

      (rb || []).forEach((b) => {
        if (b.start_time && b.end_time) {
          const sTime = b.start_time.slice(0, 5);
          const eTime = b.end_time.slice(0, 5);
          const timeKey = `${sTime}-${eTime}`;
          seenTimes.add(timeKey);
          merged.push({ id: b.id, title: b.title, start_time: sTime, end_time: eTime });
        }
      });

      (tc || []).forEach((c) => {
        if (c.title === form.title) return;
        const { meta } = decodeCourseDescription(c.description);
        if (
          meta.scheduled_date === form.scheduled_date &&
          meta.location &&
          meta.location.toLowerCase().includes(selectedRoom.name.toLowerCase()) &&
          meta.start_time &&
          meta.end_time
        ) {
          const sTime = meta.start_time.slice(0, 5);
          const eTime = meta.end_time.slice(0, 5);
          const timeKey = `${sTime}-${eTime}`;
          if (!seenTimes.has(timeKey)) {
            seenTimes.add(timeKey);
            merged.push({
              id: c.id,
              title: `🎓 Training: ${c.title}`,
              start_time: sTime,
              end_time: eTime,
            });
          }
        }
      });

      merged.sort((a, b) => a.start_time.localeCompare(b.start_time));
      setRoomBookings(merged);
      setLoadingSchedule(false);
    };

    loadRoomSchedule();
    return () => {
      cancelled = true;
    };
  }, [selectedRoom, form.scheduled_date, form.title]);

  // Detect time overlap / conflict
  const conflict = useMemo(() => {
    if (!form.start_time || !form.end_time || roomBookings.length === 0) return null;
    return (
      roomBookings.find((b) => {
        return form.start_time < b.end_time && form.end_time > b.start_time;
      }) || null
    );
  }, [roomBookings, form.start_time, form.end_time]);

  const handleRoomSelect = (roomId: string) => {
    const room = availableRooms.find((r) => r.id === roomId);
    if (!room) {
      setForm((prev) => ({ ...prev, location: "" }));
      return;
    }
    const roomLabel = room.floor ? `${room.name} (Floor ${room.floor})` : room.name;
    setForm((prev) => ({ ...prev, location: roomLabel }));
  };

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
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-gray-500 font-medium">
              Select from registered branch rooms:
            </span>
            <span className="text-[11px] font-semibold text-blue-700 bg-blue-100/60 px-2 py-0.5 rounded-full">
              {availableRooms.length} {availableRooms.length === 1 ? "room" : "rooms"} available
            </span>
          </div>

          {availableRooms.length > 0 ? (
            <div className="space-y-2.5">
              <select
                value={selectedRoom?.id || ""}
                onChange={(e) => handleRoomSelect(e.target.value)}
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

                  {/* Room Meeting Schedule & Booked Times for this Day */}
                  <div className="p-3 bg-slate-50/80 rounded-2xl border border-slate-200/70 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-gray-700 flex items-center gap-1.5">
                        <i className="ri-calendar-schedule-line text-[#253C7D]" />
                        Room Schedule on {typeof form.scheduled_date === "string" && form.scheduled_date ? form.scheduled_date : "Selected Date"}:
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
                </div>
              )}
            </div>
          ) : (
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
          )}
        </div>
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
