import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";

interface MeetingRoom {
  id: string;
  name: string;
  capacity: number | null;
  color: string;
}

interface Booking {
  id: string;
  room_id: string;
  title: string;
  booked_by: string;
  date: string;
  start_time: string;
  end_time: string;
  employees?: { first_name: string; last_name: string; department: string } | null;
}

const fmtTime = (t: string) =>
  new Date(`2000-01-01T${t}`).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

// Deliberately local-time based (not toISOString, which is UTC) — using
// UTC here would shift the date by a day in timezones like ICT (UTC+7),
// making "Next"/"Previous" appear broken or skip an extra day.
const toYMD = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export default function MeetingRoomsPage() {
  const { user } = useAuth();
  const { isAdmin } = usePermissions();

  const [rooms, setRooms] = useState<MeetingRoom[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [employeeId, setEmployeeId] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState(toYMD(new Date()));
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ type: string; message: string } | null>(null);

  const [modalRoom, setModalRoom] = useState<MeetingRoom | null>(null);
  const [form, setForm] = useState({ title: "", start_time: "09:00", end_time: "10:00" });
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState<"day" | "month">("day");

  const showToast = (type: string, message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    supabase.from("meeting_rooms").select("*").order("capacity").then(({ data }) => setRooms(data || []));
  }, []);

  useEffect(() => {
    if (!user?.email) return;
    supabase.from("employees").select("id").eq("email", user.email).maybeSingle().then(({ data }) => {
      setEmployeeId(data?.id || "");
    });
  }, [user?.email]);

  const loadBookings = useCallback(async () => {
    setLoading(true);
    const d = new Date(`${selectedDate}T00:00:00`);
    const from = toYMD(new Date(d.getFullYear(), d.getMonth(), 1));
    const to = toYMD(new Date(d.getFullYear(), d.getMonth() + 1, 0));
    const { data } = await supabase
      .from("room_bookings")
      .select("*, employees(first_name, last_name, department)")
      .gte("date", from)
      .lte("date", to)
      .order("start_time");
    setBookings((data as any) || []);
    setLoading(false);
  }, [selectedDate]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  const shiftDate = (days: number) => {
    const d = new Date(`${selectedDate}T00:00:00`);
    d.setDate(d.getDate() + days);
    setSelectedDate(toYMD(d));
  };

  const openModal = (room: MeetingRoom) => {
    setModalRoom(room);
    setForm({ title: "", start_time: "09:00", end_time: "10:00" });
  };

  const bookingsForRoom = (roomId: string) => bookings.filter((b) => b.room_id === roomId && b.date === selectedDate);
  const bookingsForDate = (dateStr: string) => bookings.filter((b) => b.date === dateStr);

  const hasOverlap = (roomId: string, start: string, end: string) =>
    bookingsForRoom(roomId).some((b) => start < b.end_time && end > b.start_time);

  const handleBook = async () => {
    if (!modalRoom || !employeeId) return;
    if (!form.title.trim()) return showToast("error", "Give the meeting a title.");
    if (form.end_time <= form.start_time) return showToast("error", "End time must be after start time.");
    if (hasOverlap(modalRoom.id, form.start_time, form.end_time)) {
      return showToast("error", `${modalRoom.name} is already booked during that time.`);
    }

    setSaving(true);
    const { error } = await supabase.from("room_bookings").insert({
      room_id: modalRoom.id,
      title: form.title.trim(),
      booked_by: employeeId,
      date: selectedDate,
      start_time: form.start_time,
      end_time: form.end_time,
    });
    setSaving(false);

    if (error) {
      showToast(
        "error",
        error.code === "23P01" ? `${modalRoom.name} is already booked during that time.` : "Couldn't create the booking. Try again."
      );
      return;
    }
    showToast("success", `${modalRoom.name} booked for ${fmtTime(form.start_time)}–${fmtTime(form.end_time)}.`);
    setModalRoom(null);
    loadBookings();
  };

  const handleCancel = async (booking: Booking) => {
    if (!confirm(`Cancel "${booking.title}"?`)) return;
    const { error } = await supabase.from("room_bookings").delete().eq("id", booking.id);
    if (error) {
      showToast("error", "Couldn't cancel that booking.");
    } else {
      showToast("success", "Booking cancelled.");
      loadBookings();
    }
  };

  const isToday = selectedDate === toYMD(new Date());
  const totalToday = bookingsForDate(selectedDate).length;

  const shiftMonth = (delta: number) => {
    const d = new Date(`${selectedDate}T00:00:00`);
    d.setMonth(d.getMonth() + delta, 1);
    setSelectedDate(toYMD(d));
  };

  const monthGridCells = () => {
    const d = new Date(`${selectedDate}T00:00:00`);
    const year = d.getFullYear();
    const month = d.getMonth();
    const startOffset = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: (string | null)[] = Array(startOffset).fill(null);
    for (let day = 1; day <= daysInMonth; day++) cells.push(toYMD(new Date(year, month, day)));
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] p-6 lg:p-10">
      {toast && (
        <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl text-[13px] font-semibold text-white shadow-lg ${toast.type === "success" ? "bg-[#253C7D]" : "bg-red-500"}`}>
          {toast.message}
        </div>
      )}

      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-[#1A1A1A]" style={{ fontFamily: "'Playfair Display', serif" }}>
          Meeting Rooms
        </h1>
        <p className="text-[13px] text-gray-500 mt-1">See who has each room booked, and reserve an open slot.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-white border border-gray-100 rounded-xl p-4">
          <i className="ri-calendar-check-line text-lg text-[#253C7D]" />
          <p className="text-xl font-bold text-gray-900 mt-2">{totalToday}</p>
          <p className="text-[11px] text-gray-500">Bookings this day</p>
        </div>
        {rooms.map((r) => (
          <div key={r.id} className="bg-white border border-gray-100 rounded-xl p-4">
            <i className="ri-door-open-line text-lg" style={{ color: r.color }} />
            <p className="text-xl font-bold text-gray-900 mt-2">{bookingsForRoom(r.id).length}</p>
            <p className="text-[11px] text-gray-500">{r.name} bookings</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-5">
        <button
          onClick={() => (viewMode === "month" ? shiftMonth(-1) : shiftDate(-1))}
          className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-lg hover:bg-gray-100 cursor-pointer"
        >
          <i className="ri-arrow-left-s-line" />
        </button>
        {viewMode === "day" ? (
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="border border-gray-200 rounded-lg text-sm px-3 py-1.5 focus:outline-none focus:border-[#253C7D]"
          />
        ) : (
          <p className="text-sm font-semibold text-gray-800 min-w-[140px]">
            {new Date(`${selectedDate}T00:00:00`).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          </p>
        )}
        <button
          onClick={() => (viewMode === "month" ? shiftMonth(1) : shiftDate(1))}
          className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-lg hover:bg-gray-100 cursor-pointer"
        >
          <i className="ri-arrow-right-s-line" />
        </button>
        {!isToday && (
          <button onClick={() => setSelectedDate(toYMD(new Date()))} className="text-[#253C7D] text-sm font-medium hover:underline cursor-pointer">
            Today
          </button>
        )}

        <div className="ml-auto flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1">
          <button
            onClick={() => setViewMode("day")}
            className={`px-3 py-1.5 rounded-md text-[12px] font-semibold cursor-pointer ${viewMode === "day" ? "bg-gray-900 text-white" : "text-gray-500 hover:text-gray-700"}`}
          >
            Day
          </button>
          <button
            onClick={() => setViewMode("month")}
            className={`px-3 py-1.5 rounded-md text-[12px] font-semibold cursor-pointer ${viewMode === "month" ? "bg-gray-900 text-white" : "text-gray-500 hover:text-gray-700"}`}
          >
            <i className="ri-calendar-2-line mr-1" />
            Month Review
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-7 h-7 border-2 border-[#253C7D] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : viewMode === "month" ? (
        <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
          <div className="grid grid-cols-7 border-b border-gray-100">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d} className="p-2 text-center text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {monthGridCells().map((dateStr, i) => {
              if (!dateStr) return <div key={i} className="border-r border-b border-gray-100 min-h-[100px] bg-gray-50/40" />;
              const dayBookings = bookingsForDate(dateStr);
              const isCellToday = dateStr === toYMD(new Date());
              return (
                <button
                  key={dateStr}
                  onClick={() => {
                    setSelectedDate(dateStr);
                    setViewMode("day");
                  }}
                  className={`border-r border-b border-gray-100 min-h-[100px] p-1.5 text-left align-top hover:bg-gray-50 cursor-pointer ${isCellToday ? "bg-[#253C7D]/5" : ""}`}
                >
                  <p className={`text-[12px] font-semibold mb-1 ${isCellToday ? "text-[#253C7D]" : "text-gray-700"}`}>
                    {Number(dateStr.slice(-2))}
                  </p>
                  <div className="space-y-0.5">
                    {dayBookings.slice(0, 3).map((b) => {
                      const room = rooms.find((r) => r.id === b.room_id);
                      return (
                        <div
                          key={b.id}
                          className="text-[10px] px-1 py-0.5 rounded truncate border-l-2"
                          style={{ backgroundColor: (room?.color || "#253C7D") + "18", borderColor: room?.color || "#253C7D" }}
                          title={`${room?.name}: ${b.title} (${fmtTime(b.start_time)}–${fmtTime(b.end_time)})`}
                        >
                          {fmtTime(b.start_time)} {b.title}
                        </div>
                      );
                    })}
                    {dayBookings.length > 3 && (
                      <p className="text-[10px] text-gray-400 px-1">+{dayBookings.length - 3} more</p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {rooms.map((room) => (
            <div key={room.id} className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
              <div className="h-1.5" style={{ backgroundColor: room.color }} />
              <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-base font-bold text-gray-900">{room.name}</h2>
                    {room.capacity && <p className="text-[12px] text-gray-500">Seats up to {room.capacity}</p>}
                  </div>
                  <button
                    onClick={() => openModal(room)}
                    className="bg-[#253C7D] text-white px-3.5 py-2 rounded-lg text-[12px] font-semibold hover:bg-[#1F336A] cursor-pointer"
                  >
                    <i className="ri-add-line mr-1" />
                    Book
                  </button>
                </div>

                {bookingsForRoom(room.id).length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <i className="ri-calendar-line text-2xl mb-1 block" />
                    <p className="text-[12px]">Open all day — no bookings yet.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {bookingsForRoom(room.id).map((b) => {
                      const canCancel = isAdmin || b.booked_by === employeeId;
                      return (
                        <div key={b.id} className="border border-gray-100 rounded-xl px-3.5 py-2.5 flex items-start justify-between gap-2" style={{ backgroundColor: room.color + "0d" }}>
                          <div className="min-w-0">
                            <p className="text-[12px] font-semibold text-gray-900">
                              {fmtTime(b.start_time)} – {fmtTime(b.end_time)}
                            </p>
                            <p className="text-[13px] font-medium text-gray-800 truncate">{b.title}</p>
                            <p className="text-[11px] text-gray-500 truncate">
                              {b.employees ? `${b.employees.first_name} ${b.employees.last_name} · ${b.employees.department}` : "Unknown"}
                            </p>
                          </div>
                          {canCancel && (
                            <button onClick={() => handleCancel(b)} className="text-gray-400 hover:text-red-500 shrink-0 cursor-pointer" title="Cancel booking">
                              <i className="ri-close-line text-lg" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {modalRoom && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => !saving && setModalRoom(null)}>
          <div className="bg-white rounded-2xl w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-bold text-gray-900 mb-1">Book {modalRoom.name}</h3>
            <p className="text-[12px] text-gray-500 mb-3">{new Date(`${selectedDate}T00:00:00`).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</p>

            {bookingsForRoom(modalRoom.id).length > 0 && (
              <div className="mb-4 border border-gray-100 rounded-lg overflow-hidden">
                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide bg-gray-50 px-3 py-1.5">
                  Already booked this day
                </p>
                <div className="max-h-28 overflow-y-auto divide-y divide-gray-100">
                  {bookingsForRoom(modalRoom.id).map((b) => (
                    <div key={b.id} className="px-3 py-1.5 flex items-center justify-between gap-2">
                      <span className="text-[12px] text-gray-700 truncate">{b.title}</span>
                      <span className="text-[11px] text-gray-500 shrink-0">
                        {fmtTime(b.start_time)}–{fmtTime(b.end_time)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <label className="text-[11px] font-semibold text-gray-600 uppercase tracking-wide">Meeting Title</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Weekly sync"
              className="w-full mt-1 mb-3 px-3 py-2 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-[#253C7D]"
            />

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="text-[11px] font-semibold text-gray-600 uppercase tracking-wide">Start</label>
                <input
                  type="time"
                  value={form.start_time}
                  onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-[#253C7D]"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-gray-600 uppercase tracking-wide">End</label>
                <input
                  type="time"
                  value={form.end_time}
                  onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-[#253C7D]"
                />
              </div>
            </div>

            {modalRoom && form.end_time > form.start_time && hasOverlap(modalRoom.id, form.start_time, form.end_time) && (
              <p className="text-[12px] text-red-500 -mt-2 mb-4">
                <i className="ri-error-warning-line mr-1" />
                This overlaps with an existing booking.
              </p>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => setModalRoom(null)}
                disabled={saving}
                className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-lg text-[13px] font-semibold hover:bg-gray-50 cursor-pointer disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                onClick={handleBook}
                disabled={saving}
                className="flex-1 bg-[#253C7D] text-white py-2.5 rounded-lg text-[13px] font-semibold hover:bg-[#1F336A] cursor-pointer disabled:opacity-60"
              >
                {saving ? "Booking..." : "Book Room"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
