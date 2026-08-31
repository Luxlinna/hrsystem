import type { Booking, MeetingRoom } from "../types";
import { getRoomFloor } from "../roomUtils";

const getXLSX = async () => {
  return await import("xlsx");
};

export async function exportMeetingRoomsXLSX(
  bookings: Booking[],
  rooms: MeetingRoom[],
  selectedDate?: string
): Promise<boolean> {
  const roomMap = new Map<string, MeetingRoom>();
  rooms.forEach((r) => roomMap.set(r.id, r));

  const data = bookings.length > 0 ? bookings.map((b) => {
    const room = roomMap.get(b.room_id);
    const floor = room ? `Floor ${getRoomFloor(room)}` : "—";
    const roomName = room?.name || "Room";
    const booker = `${b.employees?.first_name || ""} ${b.employees?.last_name || ""}`.trim() || b.booked_by || "Unknown";
    const dept = b.employees?.department || "—";
    const reqs = b.special_requirements || b.approved_requirements || "None";
    const refs = b.refreshments || b.approved_refreshments || "None";

    return {
      Date: b.date,
      "Time Window": `${b.start_time} - ${b.end_time}`,
      "Meeting Room": roomName,
      Floor: floor,
      "Meeting Title": b.title,
      "Booked By": booker,
      Department: dept,
      Attendees: b.attendees_count || 0,
      Status: (b.status || "").toUpperCase(),
      "Special Requirements": reqs,
      "Refreshments & Catering": refs,
    };
  }) : [
    {
      Date: selectedDate || new Date().toISOString().slice(0, 10),
      "Time Window": "—",
      "Meeting Room": "—",
      Floor: "—",
      "Meeting Title": "No reservations scheduled",
      "Booked By": "—",
      Department: "—",
      Attendees: 0,
      Status: "EMPTY",
      "Special Requirements": "—",
      "Refreshments & Catering": "—",
    }
  ];

  const XLSX = await getXLSX();
  const ws = XLSX.utils.json_to_sheet(data);
  ws["!cols"] = [
    { wch: 14 },
    { wch: 16 },
    { wch: 20 },
    { wch: 12 },
    { wch: 28 },
    { wch: 20 },
    { wch: 18 },
    { wch: 10 },
    { wch: 14 },
    { wch: 25 },
    { wch: 25 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Meeting Reservations");
  XLSX.writeFile(
    wb,
    `meeting_rooms_schedule_${selectedDate || new Date().toISOString().slice(0, 10)}.xlsx`
  );
  return true;
}
