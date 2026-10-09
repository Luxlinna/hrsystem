export const PRESETS = [
  { id: "all", label: "All Date" },
  { id: "today", label: "Today" },
  { id: "this_week", label: "This week" },
  { id: "last_week", label: "Last week" },
  { id: "this_month", label: "This month" },
  { id: "last_month", label: "Last month" },
  { id: "this_year", label: "This year" },
  { id: "last_year", label: "Last year" },
  { id: "custom", label: "Custom range" },
];

export const formatDisplayDate = (d?: string) => {
  if (!d) return "";
  const parts = d.split("-");
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return d;
};

export const getPresetDates = (presetId: string): { start: string; end: string } => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");

  if (presetId === "today") return { start: `${y}-${m}-${d}`, end: `${y}-${m}-${d}` };
  if (presetId === "this_week") {
    const start = new Date(now);
    start.setDate(now.getDate() - now.getDay());
    return { start: start.toISOString().split("T")[0], end: now.toISOString().split("T")[0] };
  }
  if (presetId === "this_month") {
    return { start: `${y}-${m}-01`, end: new Date(y, Number(m), 0).toISOString().split("T")[0] };
  }
  if (presetId === "this_year") return { start: `${y}-01-01`, end: `${y}-12-31` };
  if (presetId === "last_year") return { start: `${y - 1}-01-01`, end: `${y - 1}-12-31` };
  return { start: "2024-01-01", end: "2026-12-31" };
};
