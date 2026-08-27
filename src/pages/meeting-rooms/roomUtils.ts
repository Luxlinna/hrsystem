import type { MeetingRoom } from "./types";
import { ROOM_FLOORS } from "./constants";

export const getRoomFloor = (roomOrName?: MeetingRoom | string | null): number => {
  if (!roomOrName) return 3;
  if (typeof roomOrName === "object") {
    if (roomOrName.floor) return roomOrName.floor;
    return ROOM_FLOORS[roomOrName.name] || (roomOrName.name.toLowerCase().includes("vip") ? 5 : 3);
  }
  return ROOM_FLOORS[roomOrName] || (roomOrName.toLowerCase().includes("vip") ? 5 : 3);
};

export const fmtTime = (t: string): string => {
  if (!t) return "";
  const cleanTime = t.length === 5 ? `${t}:00` : t;
  const d = new Date(`2000-01-01T${cleanTime}`);
  return isNaN(d.getTime())
    ? t
    : d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
};

export const toYMD = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export const addMinutesToTime = (timeStr: string, minutesToAdd: number): string => {
  const [hStr, mStr] = timeStr.split(":");
  let totalMins = parseInt(hStr, 10) * 60 + parseInt(mStr, 10) + minutesToAdd;
  if (totalMins >= 24 * 60) totalMins = 24 * 60 - 1;
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};

export const timeToMinutes = (timeStr: string): number => {
  const [h, m] = timeStr.slice(0, 5).split(":").map(Number);
  return h * 60 + (m || 0);
};

export const getInitials = (emp?: { first_name?: string; last_name?: string } | null): string => {
  if (!emp) return "?";
  return `${emp.first_name?.[0] || ""}${emp.last_name?.[0] || ""}`.toUpperCase();
};

export const getFullName = (emp?: { first_name?: string; last_name?: string } | null): string => {
  if (!emp) return "Unknown Member";
  return `${emp.first_name || ""} ${emp.last_name || ""}`.trim();
};
