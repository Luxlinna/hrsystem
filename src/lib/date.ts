// Company timezone — Cambodia (ICT, UTC+7). Attendance and "today" logic run
// on this zone regardless of each device's own clock/timezone setting, so a
// phone set to the wrong timezone can't record shifted check-in/out times.
export const DEFAULT_TIMEZONE = "Asia/Phnom_Penh";

// Local (not UTC) YYYY-MM-DD. `Date#toISOString()` converts to UTC first,
// which silently rolls the date back a day during early-morning hours in
// any timezone ahead of UTC (e.g. ICT, UTC+7) — the wrong answer for
// anything keyed by "today" (attendance, check-in/out, dedupe keys).
export function toYMD(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export interface ZonedParts { ymd: string; hh: number; mm: number; ss: number; minutesOfDay: number; }

// Wall-clock parts of an instant as seen in `timeZone`.
export function zonedParts(date: Date = new Date(), timeZone: string = DEFAULT_TIMEZONE): ZonedParts {
  const p: Record<string, string> = {};
  for (const part of new Intl.DateTimeFormat("en-CA", { timeZone, hour12: false, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" }).formatToParts(date)) {
    p[part.type] = part.value;
  }
  const hh = Number(p.hour === "24" ? "0" : p.hour);
  const mm = Number(p.minute);
  const ss = Number(p.second);
  return { ymd: `${p.year}-${p.month}-${p.day}`, hh, mm, ss, minutesOfDay: hh * 60 + mm };
}

// Offset (ms) to add to a wall-clock reading in `timeZone` to get UTC —
// i.e. how far that zone is ahead of UTC at the given instant.
function tzOffsetMs(instant: Date, timeZone: string): number {
  const q = zonedParts(instant, timeZone);
  return Date.UTC(Number(q.ymd.slice(0, 4)), Number(q.ymd.slice(5, 7)) - 1, Number(q.ymd.slice(8, 10)), q.hh, q.mm, q.ss) - instant.getTime();
}

// Absolute instant for a wall-clock time in `timeZone` ("08:15:00 in Phnom
// Penh"). Two-pass refinement handles zones whose offset shifts; fine for
// fixed-offset zones like ICT after one pass.
export function zonedTimeToInstant(ymd: string, hh: number, mm: number, ss = 0, timeZone: string = DEFAULT_TIMEZONE): Date {
  const asUtc = Date.UTC(Number(ymd.slice(0, 4)), Number(ymd.slice(5, 7)) - 1, Number(ymd.slice(8, 10)), hh, mm, ss);
  let ts = asUtc - tzOffsetMs(new Date(asUtc), timeZone);
  ts = asUtc - tzOffsetMs(new Date(ts), timeZone);
  return new Date(ts);
}

export function todayYMD(timeZone: string = DEFAULT_TIMEZONE): string {
  return zonedParts(new Date(), timeZone).ymd;
}

// Day of week (0=Sun … 6=Sat) as seen in `timeZone`, not on the device clock.
export function zonedDayOfWeek(date: Date = new Date(), timeZone: string = DEFAULT_TIMEZONE): number {
  return new Date(`${zonedParts(date, timeZone).ymd}T12:00:00Z`).getUTCDay();
}

// YYYY-MM-DD shifted by N days (calendar math on noon UTC — no DST edges).
export function addDaysYMD(ymd: string, days: number): string {
  const d = new Date(`${ymd}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
