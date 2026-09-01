import type { MeetingRoomOption } from "../../types";

export type LocationType = "room" | "online" | "custom";

/**
 * Calculates duration in hours between start time and end time (HH:mm format).
 */
export function calculateDurationHours(startTime: string, endTime: string): number | null {
  if (!startTime || !endTime) return null;
  const [startH, startM] = startTime.split(":").map(Number);
  const [endH, endM] = endTime.split(":").map(Number);
  if (isNaN(startH) || isNaN(startM) || isNaN(endH) || isNaN(endM)) return null;

  let startMinutes = startH * 60 + startM;
  let endMinutes = endH * 60 + endM;

  if (endMinutes < startMinutes) {
    endMinutes += 24 * 60;
  }

  const diffMinutes = endMinutes - startMinutes;
  const hours = Math.round((diffMinutes / 60) * 10) / 10;
  return hours > 0 ? hours : null;
}

/**
 * Determines whether a location string corresponds to a room, online URL, or custom venue.
 */
export function detectLocationType(
  location: string,
  meetingRooms: MeetingRoomOption[]
): LocationType {
  if (!location) return meetingRooms.length > 0 ? "room" : "custom";
  if (/^https?:\/\//i.test(location)) return "online";
  const matchesRoom = meetingRooms.some((r) => location.includes(r.name));
  if (matchesRoom) return "room";
  return "custom";
}
