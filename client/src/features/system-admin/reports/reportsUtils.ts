import { toYMD } from "@/lib/date";
import { COLUMN_KEY_MAP } from "./constants";
import type { ReportConfig } from "./types";

export const getWeekRange = () => {
  const now = new Date();
  const day = now.getDay();
  const diffToMon = (day === 0 ? -6 : 1) - day;
  const mon = new Date(now);
  mon.setDate(now.getDate() + diffToMon);
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  return { from: toYMD(mon), to: toYMD(sun) };
};

export const getMonthRange = () => {
  const n = new Date();
  return {
    from: toYMD(new Date(n.getFullYear(), n.getMonth(), 1)),
    to: toYMD(new Date(n.getFullYear(), n.getMonth() + 1, 0)),
  };
};

export const cellValue = (row: any, col: string) =>
  row[COLUMN_KEY_MAP[col] || col.toLowerCase()];

export const reportFileName = (moduleLabel: string) =>
  `${moduleLabel.toLowerCase().replace(/ /g, "-")}-${new Date().toISOString().substring(0, 10)}`;

export const matchesEmployeeFilters = (
  row: { employee?: string; department?: string; branch?: string; deleted_at?: string | null; status?: string },
  config: ReportConfig
) => {
  if (config.recordStatus === "active" && (row.deleted_at || row.status === "deleted")) return false;
  if (config.recordStatus === "deleted" && !row.deleted_at && row.status !== "deleted") return false;
  if (config.employeeSearch && !row.employee?.toLowerCase().includes(config.employeeSearch.toLowerCase())) return false;
  if (config.departmentFilter && row.department !== config.departmentFilter) return false;
  if (config.branchFilter && row.branch !== config.branchFilter) return false;
  return true;
};

export const formatDateTime = (iso: string | null | undefined) => {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return iso;
  }
};

export const formatClock = (t: string | null | undefined) => {
  if (!t) return "—";
  const [h, m] = t.split(":");
  const hour = parseInt(h, 10);
  if (isNaN(hour)) return t;
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${hour12}:${m} ${hour >= 12 ? "PM" : "AM"}`;
};

export const workedHours = (clockIn: string | null, clockOut: string | null) => {
  if (!clockIn || !clockOut) return 0;
  const [ih, im] = clockIn.split(":").map(Number);
  const [oh, om] = clockOut.split(":").map(Number);
  let mins = oh * 60 + om - (ih * 60 + im);
  if (mins < 0) mins += 24 * 60; // overnight shift
  return +(mins / 60).toFixed(1);
};
