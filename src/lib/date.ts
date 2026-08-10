// Local (not UTC) YYYY-MM-DD. `Date#toISOString()` converts to UTC first,
// which silently rolls the date back a day during early-morning hours in
// any timezone ahead of UTC (e.g. ICT, UTC+7) — the wrong answer for
// anything keyed by "today" (attendance, check-in/out, dedupe keys).
export function toYMD(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function todayYMD(): string {
  return toYMD(new Date());
}
