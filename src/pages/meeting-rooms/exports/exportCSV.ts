import type { Booking, MeetingRoom } from "../types";
import { getRoomFloor } from "../roomUtils";

export function exportMeetingRoomsCSV(
  bookings: Booking[],
  rooms: MeetingRoom[],
  selectedDate?: string
): boolean {
  if (bookings.length === 0) return false;

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

  const rows = bookings.map((b) => {
    const room = roomMap.get(b.room_id);
    const floor = room ? `Floor ${getRoomFloor(room)}` : "—";
    const roomName = room?.name || "Room";
    const booker = `${b.employees?.first_name || ""} ${b.employees?.last_name || ""}`.trim() || b.booked_by || "Unknown";
    const dept = b.employees?.department || "—";
    const reqs = b.special_requirements || b.approved_requirements || "None";
    const refs = b.refreshments || b.approved_refreshments || "None";

    return [
      `"${b.date}"`,
      `"${b.start_time} - ${b.end_time}"`,
      `"${roomName.replace(/"/g, '""')}"`,
      `"${floor}"`,
      `"${b.title.replace(/"/g, '""')}"`,
      `"${booker.replace(/"/g, '""')}"`,
      `"${dept.replace(/"/g, '""')}"`,
      b.attendees_count || 0,
      `"${b.status.toUpperCase()}"`,
      `"${reqs.replace(/"/g, '""')}"`,
      `"${refs.replace(/"/g, '""')}"`,
    ].join(",");
  });

  const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute(
    "download",
    `meeting_rooms_schedule_${selectedDate || new Date().toISOString().slice(0, 10)}.csv`
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  return true;
}
