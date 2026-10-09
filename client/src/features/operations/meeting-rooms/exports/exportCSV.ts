import type { Booking, MeetingRoom } from "../types";
import { getRoomFloor } from "../roomUtils";

export function exportMeetingRoomsCSV(
  bookings: Booking[],
  rooms: MeetingRoom[],
  selectedDate?: string
): boolean {
  const roomMap = new Map<string, MeetingRoom>();
  rooms.forEach((r) => roomMap.set(r.id, r));

  const headers = [
    "Date",
    "Time Slot",
    "Room Name",
    "Floor",
    "Meeting Title",
    "Booked By",
    "Department",
    "Attendees",
    "Status",
    "Requirements",
    "Refreshments",
  ];

  const rows = bookings.length > 0
    ? bookings.map((b) => {
        const room = roomMap.get(b.room_id);
        const floor = room ? `Floor ${getRoomFloor(room)}` : "—";
        const roomName = room?.name || "Room";
        const booker =
          `${b.employees?.last_name || ""} ${b.employees?.first_name || ""}`.trim() ||
          b.booked_by ||
          "Unknown";
        const dept = b.employees?.department || "—";
        const reqs = b.special_requirements || b.approved_requirements || "None";
        const refs = b.refreshments || b.approved_refreshments || "None";

        return [
          `"${b.date}"`,
          `"${b.start_time} - ${b.end_time}"`,
          `"${roomName.replace(/"/g, '""')}"`,
          `"${floor}"`,
          `"${(b.title || "Meeting").replace(/"/g, '""')}"`,
          `"${booker.replace(/"/g, '""')}"`,
          `"${dept.replace(/"/g, '""')}"`,
          b.attendees_count || 0,
          `"${(b.status || "").toUpperCase()}"`,
          `"${reqs.replace(/"/g, '""')}"`,
          `"${refs.replace(/"/g, '""')}"`,
        ].join(",");
      })
    : [
        [
          `"${selectedDate || new Date().toISOString().slice(0, 10)}"`,
          '"—"',
          '"—"',
          '"—"',
          '"No reservations scheduled"',
          '"—"',
          '"—"',
          0,
          '"EMPTY"',
          '"—"',
          '"—"',
        ].join(","),
      ];

  const csvString = "\uFEFF" + [headers.join(","), ...rows].join("\r\n");
  const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `meeting_rooms_schedule_${selectedDate || new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return true;
}
