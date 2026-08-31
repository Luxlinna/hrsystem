import type { Booking, MeetingRoom } from "../types";
import { getRoomFloor } from "../roomUtils";

export function exportMeetingRoomsPDF(
  bookings: Booking[],
  rooms: MeetingRoom[],
  selectedDate?: string,
  title = "Meeting Rooms & Conference Hub Schedule"
): boolean {
  if (bookings.length === 0) return false;

  const roomMap = new Map<string, MeetingRoom>();
  rooms.forEach((r) => roomMap.set(r.id, r));

  const total = bookings.length;
  const approved = bookings.filter((b) => b.status === "approved").length;
  const pending = bookings.filter((b) => b.status === "pending").length;
  const totalAttendees = bookings.reduce((acc, b) => acc + (Number(b.attendees_count) || 0), 0);

  const rows = bookings
    .map((b) => {
      const room = roomMap.get(b.room_id);
      const floor = room ? `Floor ${getRoomFloor(room)}` : "—";
      const roomName = room?.name || "Room";
      const booker = `${b.employees?.first_name || ""} ${b.employees?.last_name || ""}`.trim() || b.booked_by || "Unknown";
      const dept = b.employees?.department || "—";
      const reqs = b.special_requirements || b.approved_requirements || "None";
      const statusColor =
        b.status === "approved"
          ? "background:#d1fae5;color:#065f46"
          : b.status === "pending"
          ? "background:#fef3c7;color:#92400e"
          : "background:#fee2e2;color:#991b1b";

      return `<tr>
        <td style="font-weight:700;color:#111">${b.date}</td>
        <td><span style="font-weight:600">${b.start_time} - ${b.end_time}</span></td>
        <td style="font-weight:700;color:#253C7D">${roomName} <small style="color:#64748b">(${floor})</small></td>
        <td style="font-weight:600">${b.title}</td>
        <td>${booker} <br/><span style="font-size:10px;color:#64748b">${dept}</span></td>
        <td style="text-align:center;font-weight:700">${b.attendees_count || 0}</td>
        <td>
          <span style="display:inline-block;padding:2px 8px;border-radius:6px;font-size:10px;font-weight:700;${statusColor}">
            ${(b.status || "").toUpperCase()}
          </span>
        </td>
        <td style="font-size:10px;color:#64748b">${reqs}</td>
      </tr>`;
    })
    .join("");

  const html = `<!DOCTYPE html>
  <html>
  <head>
    <title>${title}</title>
    <style>
      @page { size: A4 landscape; margin: 15mm; }
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 24px; color: #1e293b; }
      .header-box { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #253C7D; padding-bottom: 14px; margin-bottom: 18px; }
      h1 { font-size: 20px; font-weight: 800; color: #253C7D; margin: 0 0 4px 0; }
      .meta { font-size: 11px; color: #64748b; }
      .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 18px; }
      .stat-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px 14px; text-align: center; }
      .stat-val { font-size: 18px; font-weight: 800; color: #253C7D; }
      .stat-lbl { font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-top: 2px; }
      table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 11px; }
      th { text-align: left; padding: 8px 8px; background: #253C7D; color: #fff; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
      td { padding: 7px 8px; border-bottom: 1px solid #f1f5f9; }
      tr:nth-child(even) { background-color: #f8fafc; }
      .footer { margin-top: 24px; font-size: 10px; color: #94a3b8; display: flex; justify-content: space-between; border-top: 1px solid #e2e8f0; padding-top: 8px; }
    </style>
  </head>
  <body>
    <div class="header-box">
      <div>
        <h1>HRM_OPS — ${title}</h1>
        <div class="meta">Facility Management &middot; Conference Reservation Log</div>
      </div>
      <div class="meta" style="text-align:right">
        <div><strong>Generated:</strong> ${new Date().toLocaleString("en-US")}</div>
        <div><strong>Total Attendees:</strong> ${totalAttendees} Attendees</div>
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-val">${total}</div>
        <div class="stat-lbl">Total Bookings</div>
      </div>
      <div class="stat-card">
        <div class="stat-val" style="color:#059669">${approved}</div>
        <div class="stat-lbl">Approved Sessions</div>
      </div>
      <div class="stat-card">
        <div class="stat-val" style="color:#d97706">${pending}</div>
        <div class="stat-lbl">Pending Review</div>
      </div>
      <div class="stat-card">
        <div class="stat-val" style="color:#2563eb">${totalAttendees}</div>
        <div class="stat-lbl">Participants Scheduled</div>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Date</th>
          <th>Time Slot</th>
          <th>Room &amp; Floor</th>
          <th>Meeting Title</th>
          <th>Booked By</th>
          <th style="text-align:center">Attendees</th>
          <th>Status</th>
          <th>Requirements</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>

    <div class="footer">
      <div>HRM_OPS Enterprise HRMS &middot; Facility &amp; Meeting Rooms Schedule</div>
      <div>Page 1 of 1</div>
    </div>
  </body>
  </html>`;

  const w = window.open("", "_blank");
  if (w) {
    w.document.write(html);
    w.document.close();
    setTimeout(() => w.print(), 400);
  }
  return true;
}
