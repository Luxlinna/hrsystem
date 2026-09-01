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

export interface CourseScheduleMeta {
  scheduled_date?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  location?: string | null;
  created_by_name?: string | null;
}

const META_REGEX = /<!--SCHEDULE_META:([\s\S]*?)-->/;

/**
 * Encodes scheduled session date, times, location, and host into course description.
 */
export function encodeCourseDescription(
  rawDescription: string,
  meta: CourseScheduleMeta
): string {
  const cleanDesc = rawDescription ? rawDescription.replace(META_REGEX, "").trim() : "";
  const hasMeta =
    meta.scheduled_date ||
    meta.start_time ||
    meta.end_time ||
    meta.location ||
    meta.created_by_name;
  if (!hasMeta) return cleanDesc;
  const metaJson = JSON.stringify(meta);
  return cleanDesc
    ? `${cleanDesc}\n\n<!--SCHEDULE_META:${metaJson}-->`
    : `<!--SCHEDULE_META:${metaJson}-->`;
}

/**
 * Decodes scheduled session metadata from course description.
 */
export function decodeCourseDescription(
  fullDescription: string | null
): { description: string; meta: CourseScheduleMeta } {
  if (!fullDescription) {
    return { description: "", meta: {} };
  }
  const match = fullDescription.match(META_REGEX);
  if (!match) {
    return { description: fullDescription, meta: {} };
  }
  try {
    const meta: CourseScheduleMeta = JSON.parse(match[1]);
    const cleanDesc = fullDescription.replace(META_REGEX, "").trim();
    return { description: cleanDesc, meta };
  } catch {
    return { description: fullDescription, meta: {} };
  }
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
