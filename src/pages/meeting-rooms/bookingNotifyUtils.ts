import { notify } from "@/lib/notify";
import { logActivity } from "@/lib/audit";
import { notifyTelegramEvent, escapeTelegramHtml, hrNexusUrl } from "@/lib/telegramNotify";
import type { MeetingRoom, BookingFormData } from "./types";
import { fmtTime } from "./roomUtils";

interface SendBookingNotificationProps {
  isEdit: boolean;
  bookingId: string;
  modalRoom: MeetingRoom;
  bookingForm: BookingFormData;
  empName: string;
  roleName: string;
  finalRefreshments: string;
}

export async function sendBookingNotification({
  isEdit,
  bookingId,
  modalRoom,
  bookingForm,
  empName,
  roleName,
  finalRefreshments,
}: SendBookingNotificationProps) {
  const floorText = `Floor ${modalRoom.floor || 3}`;
  const timeText = `${fmtTime(bookingForm.start_time)}–${fmtTime(bookingForm.end_time)}`;

  if (isEdit) {
    await notify({
      source: "meeting_rooms",
      type: "info",
      title: "Meeting Room Booking Modified",
      message: `${empName} modified reservation for ${modalRoom.name} (${floorText}) on ${bookingForm.date} (${timeText}) "${bookingForm.title}".`,
      entityId: bookingId,
    });

    notifyTelegramEvent(
      `✏️ <b>Room Booking Modified</b>\n\n👤 <b>By:</b> ${escapeTelegramHtml(empName)}\n🏢 <b>Room:</b> ${escapeTelegramHtml(modalRoom.name)} (${floorText})\n📅 <b>When:</b> ${bookingForm.date}, ${timeText}\n📌 <b>Title:</b> ${escapeTelegramHtml(bookingForm.title)}`,
      { text: "Open in HR Nexus", url: hrNexusUrl("/meeting-rooms") }
    );

    logActivity({
      module: "meeting_rooms",
      action: "updated",
      entityType: "room_booking",
      entityId: bookingId,
      actorName: empName,
      actorRole: roleName,
      description: `Modified booking for ${modalRoom.name} (${floorText}): "${bookingForm.title}"`,
    });
  } else {
    await notify({
      source: "meeting_rooms",
      type: "info",
      title: "New Meeting Room Booking Request",
      message: `${empName} requested ${modalRoom.name} (${floorText}) on ${bookingForm.date} (${timeText}) "${bookingForm.title}".`,
      entityId: bookingId,
    });

    notifyTelegramEvent(
      `🚪 <b>New Room Booking Request</b>\n\n👤 <b>Booked By:</b> ${escapeTelegramHtml(empName)}\n🏢 <b>Room:</b> ${escapeTelegramHtml(modalRoom.name)} (${floorText})\n📅 <b>When:</b> ${bookingForm.date}, ${timeText}\n📌 <b>Title:</b> ${escapeTelegramHtml(bookingForm.title)}\n👥 <b>Attendees:</b> ${bookingForm.attendees_count} ppl\n🍿 <b>Snacks:</b> ${escapeTelegramHtml(finalRefreshments)}`,
      { text: "Open in HR Nexus", url: hrNexusUrl("/meeting-rooms") }
    );

    logActivity({
      module: "meeting_rooms",
      action: "created",
      entityType: "room_booking",
      entityId: bookingId,
      actorName: empName,
      actorRole: roleName,
      description: `Requested ${modalRoom.name} (${floorText}) on ${bookingForm.date}: "${bookingForm.title}"`,
    });
  }
}
