export const MODULE_COLORS: Record<string, string> = {
  hire: "bg-violet-100 text-violet-700",
  leave: "bg-amber-100 text-amber-700",
  payroll: "bg-emerald-100 text-emerald-700",
  onboarding: "bg-sky-100 text-sky-700",
  employees: "bg-indigo-100 text-indigo-700",
  offboard: "bg-red-100 text-red-700",
  it: "bg-slate-100 text-slate-700",
  finance: "bg-teal-100 text-teal-700",
  benefits: "bg-pink-100 text-pink-700",
  tools: "bg-orange-100 text-orange-700",
  unity: "bg-cyan-100 text-cyan-700",
  branches: "bg-lime-100 text-lime-700",
  settings: "bg-gray-100 text-gray-700",
};

export const ACTION_ICONS: Record<string, string> = {
  created: "ri-add-circle-line",
  updated: "ri-edit-line",
  approved: "ri-checkbox-circle-line",
  rejected: "ri-close-circle-line",
  deleted: "ri-delete-bin-line",
  processed: "ri-refresh-line",
};

export const ACTION_COLORS: Record<string, string> = {
  created: "text-emerald-500",
  updated: "text-sky-500",
  approved: "text-emerald-500",
  rejected: "text-red-500",
  deleted: "text-red-500",
  processed: "text-teal-500",
};

export const MODULES = [
  "all",
  "hire",
  "leave",
  "payroll",
  "onboarding",
  "employees",
  "offboard",
  "it",
  "finance",
  "benefits",
  "tools",
  "unity",
  "branches",
  "settings",
] as const;

export function formatTime(ts: string): string {
  const d = new Date(ts);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60000) return "just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
