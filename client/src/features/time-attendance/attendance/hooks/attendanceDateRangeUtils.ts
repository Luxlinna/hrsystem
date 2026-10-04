import { toYMD } from "@/lib/date";
import type { DatePreset } from "../types";

export interface DateBounds {
  start: string;
  end: string;
}

export function formatYMDToDMY(ymd: string): string {
  if (!ymd) return "";
  const parts = ymd.split("-");
  if (parts.length !== 3) return ymd;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

export function computeDateRangeBounds(
  preset: DatePreset,
  todayYMD: string,
  singleDate?: string,
  fromDate?: string,
  toDateStr?: string
): DateBounds {
  const cur = new Date();
  if (preset === "today" || preset === "all") return { start: todayYMD, end: todayYMD };
  if (preset === "yesterday") {
    const y = new Date();
    y.setDate(y.getDate() - 1);
    const yStr = toYMD(y);
    return { start: yStr, end: yStr };
  }
  if (preset === "this_week") {
    const start = new Date(cur);
    start.setDate(cur.getDate() - cur.getDay());
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return { start: toYMD(start), end: toYMD(end) };
  }
  if (preset === "last_week") {
    const start = new Date(cur);
    start.setDate(cur.getDate() - cur.getDay() - 7);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return { start: toYMD(start), end: toYMD(end) };
  }
  if (preset === "this_month") {
    const start = new Date(cur.getFullYear(), cur.getMonth(), 1);
    const end = new Date(cur.getFullYear(), cur.getMonth() + 1, 0);
    return { start: toYMD(start), end: toYMD(end) };
  }
  if (preset === "last_month") {
    const start = new Date(cur.getFullYear(), cur.getMonth() - 1, 1);
    const end = new Date(cur.getFullYear(), cur.getMonth(), 0);
    return { start: toYMD(start), end: toYMD(end) };
  }
  if (preset === "single_date" && singleDate) {
    return { start: singleDate, end: singleDate };
  }
  if (preset === "custom_range" || preset === "range") {
    return {
      start: fromDate || todayYMD,
      end: toDateStr || todayYMD,
    };
  }
  return { start: todayYMD, end: todayYMD };
}

export function shiftDateBounds(bounds: DateBounds, dir: "prev" | "next"): DateBounds {
  const s = new Date(bounds.start);
  const e = new Date(bounds.end);
  const diffDays = Math.max(1, Math.round((e.getTime() - s.getTime()) / (1000 * 3600 * 24)) + 1);
  const delta = dir === "next" ? diffDays : -diffDays;

  s.setDate(s.getDate() + delta);
  e.setDate(e.getDate() + delta);
  return { start: toYMD(s), end: toYMD(e) };
}

