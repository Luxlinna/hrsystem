import type { DatePreset } from "./types";

export function toYMD(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

export function resolveDateRangeBounds(
  datePreset: DatePreset,
  fromDate: string,
  toDate: string
): { start: string; end: string } | null {
  const now = new Date();
  const todayStr = toYMD(now);

  if (datePreset === "this_month") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    return { start: toYMD(start), end: todayStr };
  }

  if (datePreset === "last_month") {
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const end = new Date(now.getFullYear(), now.getMonth(), 0);
    return { start: toYMD(start), end: toYMD(end) };
  }

  if (datePreset === "this_quarter") {
    const currentQuarter = Math.floor(now.getMonth() / 3);
    const start = new Date(now.getFullYear(), currentQuarter * 3, 1);
    return { start: toYMD(start), end: todayStr };
  }

  if (datePreset === "this_year") {
    const start = new Date(now.getFullYear(), 0, 1);
    return { start: toYMD(start), end: todayStr };
  }

  if (datePreset === "last_year") {
    const start = new Date(now.getFullYear() - 1, 0, 1);
    const end = new Date(now.getFullYear() - 1, 11, 31);
    return { start: toYMD(start), end: toYMD(end) };
  }

  if (datePreset === "custom") {
    return {
      start: fromDate || "1970-01-01",
      end: toDate || "2099-12-31",
    };
  }

  return null;
}
