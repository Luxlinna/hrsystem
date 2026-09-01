import { memo, useState, useMemo } from "react";
import type { CourseFormState, Employee, MeetingRoomOption, Branch } from "../../types";

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
  const [empSearch, setEmpSearch] = useState("");

  // Determine initial location mode
  const initialLocType = useMemo<"room" | "online" | "custom">(() => {
    if (!form.location) return meetingRooms.length > 0 ? "room" : "custom";
    if (/^https?:\/\//i.test(form.location)) return "online";
    const matchesRoom = meetingRooms.some((r) => form.location.includes(r.name));
    if (matchesRoom) return "room";
    return "custom";
  }, [form.location, meetingRooms]);

  const [locType, setLocType] = useState<"room" | "online" | "custom">(initialLocType);

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

  const handleRoomSelect = (roomId: string) => {
    const room = availableRooms.find((r) => r.id === roomId);
    if (!room) {
      setForm({ ...form, location: "" });
      return;
    }
    const roomLabel = room.floor ? `${room.name} (Floor ${room.floor})` : room.name;
    setForm({ ...form, location: roomLabel });
  };

  const filteredEmployees = employees.filter((e) => {
    if (!empSearch) return true;
    const name = `${e.first_name} ${e.last_name} ${e.department || ""}`.toLowerCase();
    return name.includes(empSearch.toLowerCase());
  });

  const toggleEmployee = (empId: string) => {
    const list = form.invited_employee_ids || [];
    if (list.includes(empId)) {
      setForm({ ...form, invited_employee_ids: list.filter((id) => id !== empId) });
    } else {
      setForm({ ...form, invited_employee_ids: [...list, empId] });
    }
  };

  const handleSelectAll = () => {
    if (form.invited_employee_ids?.length === filteredEmployees.length) {
      setForm({ ...form, invited_employee_ids: [] });
    } else {
      setForm({ ...form, invited_employee_ids: filteredEmployees.map((e) => e.id) });
    }
  };

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
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="e.g. Executive Leadership & Compliance Seminar 2026"
          className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200 rounded-2xl text-xs sm:text-sm font-semibold text-gray-900 focus:outline-none focus:border-[#253C7D] focus:bg-white focus:ring-2 focus:ring-[#253C7D]/10 transition-all"
        />
      </div>

      {/* Schedule: Specific Date, Time & Meeting Room Location */}
      <div className="p-4 sm:p-5 bg-gradient-to-br from-blue-50/70 to-indigo-50/40 rounded-2xl border border-blue-100/90 space-y-4 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-extrabold text-[#253C7D]">
            <div className="w-7 h-7 rounded-lg bg-[#253C7D] text-white flex items-center justify-center text-sm shadow-xs">
              <i className="ri-calendar-event-line" />
            </div>
            <span>Specific Date, Time &amp; Room Location</span>
          </div>

          {/* Location Type Switcher */}
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

        {/* Date and Time Pickers */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block font-bold text-gray-700 text-xs mb-1">Session Date</label>
            <input
              type="date"
              value={form.scheduled_date}
              onChange={(e) => setForm({ ...form, scheduled_date: e.target.value })}
              className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs sm:text-sm font-semibold focus:outline-none focus:border-[#253C7D] shadow-2xs"
            />
          </div>
          <div>
            <label className="block font-bold text-gray-700 text-xs mb-1">Start Time</label>
            <input
              type="time"
              value={form.start_time}
              onChange={(e) => setForm({ ...form, start_time: e.target.value })}
              className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs sm:text-sm font-semibold focus:outline-none focus:border-[#253C7D] shadow-2xs"
            />
          </div>
          <div>
            <label className="block font-bold text-gray-700 text-xs mb-1">End Time</label>
            <input
              type="time"
              value={form.end_time}
              onChange={(e) => setForm({ ...form, end_time: e.target.value })}
              className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs sm:text-sm font-semibold focus:outline-none focus:border-[#253C7D] shadow-2xs"
            />
          </div>
        </div>

        {/* Location Selector based on chosen mode */}
        <div className="pt-1">
          {locType === "room" ? (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="block font-bold text-gray-800 text-xs">
                  Select Meeting Room for Training <span className="text-rose-500">*</span>
                </label>
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
                    <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-white rounded-2xl border border-blue-200 text-xs shadow-xs">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-3.5 h-3.5 rounded-full shrink-0 ring-2 ring-white shadow-xs"
                          style={{ backgroundColor: selectedRoom.color || "#253C7D" }}
                        />
                        <span className="font-extrabold text-sm text-gray-900">{selectedRoom.name}</span>
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
                        <i className="ri-checkbox-circle-fill text-emerald-500 text-sm" /> Reserved for Training
                      </span>
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
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
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
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="e.g. Building B Training Hall 4, or Grand Hotel Ballroom"
                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[#253C7D] font-medium"
              />
            </div>
          )}
        </div>
      </div>

      {/* Category, Duration, Instructor, Format Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div>
          <label className="block font-bold text-gray-800 text-xs mb-1.5">Category</label>
          <input
            type="text"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            placeholder="e.g. Compliance, Tech, Leadership"
            className="w-full px-3.5 py-2.5 bg-gray-50/80 border border-gray-200 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:bg-white focus:border-[#253C7D]"
          />
        </div>
        <div>
          <label className="block font-bold text-gray-800 text-xs mb-1.5">Duration (Hours)</label>
          <input
            type="number"
            step="0.5"
            min="0"
            value={form.duration_hours}
            onChange={(e) => setForm({ ...form, duration_hours: e.target.value })}
            placeholder="e.g. 4.5"
            className="w-full px-3.5 py-2.5 bg-gray-50/80 border border-gray-200 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:bg-white focus:border-[#253C7D]"
          />
        </div>
        <div>
          <label className="block font-bold text-gray-800 text-xs mb-1.5">Instructor / Host</label>
          <input
            type="text"
            value={form.instructor}
            onChange={(e) => setForm({ ...form, instructor: e.target.value })}
            placeholder="e.g. Internal Lead or External Trainer"
            className="w-full px-3.5 py-2.5 bg-gray-50/80 border border-gray-200 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:bg-white focus:border-[#253C7D]"
          />
        </div>
        <div>
          <label className="block font-bold text-gray-800 text-xs mb-1.5">Format</label>
          <select
            value={form.format}
            onChange={(e) => setForm({ ...form, format: e.target.value as CourseFormState["format"] })}
            className="w-full px-3.5 py-2.5 bg-gray-50/80 border border-gray-200 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:bg-white focus:border-[#253C7D] cursor-pointer"
          >
            <option value="in_person">In-Person Classroom</option>
            <option value="online">Online / Self-Paced</option>
            <option value="hybrid">Hybrid (Online + Live)</option>
          </select>
        </div>
      </div>

      {/* Invite Employees Section */}
      {employees.length > 0 && (
        <div className="space-y-3 pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <label className="block font-extrabold text-gray-900 text-xs sm:text-sm">
                Invite Employees
              </label>
              <span className="px-2 py-0.5 bg-[#253C7D]/10 text-[#253C7D] rounded-full font-bold text-[11px]">
                {form.invited_employee_ids?.length || 0} selected
              </span>
            </div>
            <button
              type="button"
              onClick={handleSelectAll}
              className="text-xs font-bold text-[#253C7D] hover:underline cursor-pointer flex items-center gap-1"
            >
              <i className="ri-checkbox-multiple-line" />
              {form.invited_employee_ids?.length === filteredEmployees.length ? "Deselect All" : "Select All Branch Staff"}
            </button>
          </div>

          <div className="relative">
            <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
            <input
              type="text"
              value={empSearch}
              onChange={(e) => setEmpSearch(e.target.value)}
              placeholder="Search employee name or department to invite..."
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:bg-white focus:border-[#253C7D]"
            />
          </div>

          <div className="max-h-48 overflow-y-auto space-y-1.5 border border-gray-200/80 rounded-2xl p-2 bg-gray-50/40">
            {filteredEmployees.map((emp) => {
              const isSelected = form.invited_employee_ids?.includes(emp.id);
              return (
                <div
                  key={emp.id}
                  onClick={() => toggleEmployee(emp.id)}
                  className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all text-xs sm:text-sm ${
                    isSelected ? "bg-blue-50 text-[#253C7D] font-bold border border-blue-200/80 shadow-2xs" : "hover:bg-gray-100 text-gray-800"
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}}
                      className="w-4 h-4 rounded text-[#253C7D] focus:ring-0 cursor-pointer pointer-events-none"
                    />
                    <div className="w-6 h-6 rounded-full bg-[#253C7D]/15 text-[#253C7D] font-bold text-[10px] flex items-center justify-center shrink-0">
                      {emp.first_name?.[0]}{emp.last_name?.[0]}
                    </div>
                    <span className="truncate font-semibold">{emp.first_name} {emp.last_name}</span>
                    <span className="text-[11px] text-gray-400 font-normal truncate">({emp.department || "Staff"})</span>
                  </div>
                  {isSelected && <i className="ri-check-line text-[#253C7D] font-bold text-base" />}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Description / Syllabus */}
      <div>
        <label className="block font-extrabold text-gray-900 text-xs sm:text-sm mb-1.5">Description &amp; Syllabus</label>
        <textarea
          rows={3}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Brief description of training objectives, target audience, prerequisites, or topics covered..."
          className="w-full px-4 py-2.5 bg-gray-50/80 border border-gray-200 rounded-2xl text-xs sm:text-sm font-medium focus:outline-none focus:bg-white focus:border-[#253C7D] focus:ring-2 focus:ring-[#253C7D]/10 resize-none transition-all"
        />
      </div>
    </div>
  );
});
