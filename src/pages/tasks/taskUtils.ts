import { notify } from "@/lib/notify";
import type { Task, TaskActivity, Employee } from "./types";

export const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export const isOverdue = (t: Task) => Boolean(t.due_date && t.due_date < today() && t.status !== "done");

export const prettyValue = (v: string | null) =>
  v ? v.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "";

export const formatRelative = (ts: string) => {
  const diff = Date.now() - new Date(ts).getTime();
  if (diff < 60000) return "just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

export const formatExact = (ts: string) =>
  new Date(ts).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

export const initials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();

export const formatDueDate = (v: string | null) => {
  if (!v) return "";
  const d = new Date(`${v}T00:00:00`);
  if (isNaN(d.getTime())) return v;
  const todayStr = today();
  if (v === todayStr) return "Today";
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, "0")}-${String(tomorrow.getDate()).padStart(2, "0")}`;
  if (v === tomStr) return "Tomorrow";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

export const formatShortDate = (ts: string) =>
  new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

export const fmtDuration = (from: string, to: string | null) => {
  const ms = (to ? new Date(to).getTime() : Date.now()) - new Date(from).getTime();
  if (ms < 0) return "—";
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "<1m";
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
};

export const activityText = (a: TaskActivity) => {
  switch (a.action) {
    case "created":
      return "created this task";
    case "status_changed":
      return a.old_value
        ? `changed status from ${prettyValue(a.old_value)} to ${prettyValue(a.new_value)}`
        : `moved task to ${prettyValue(a.new_value)}`;
    case "assigned":
      return a.old_value
        ? `reassigned task from ${a.old_value} to ${a.new_value || "an employee"}`
        : `assigned task to ${a.new_value || "an employee"}`;
    default:
      switch (a.field) {
        case "title":
          return "updated title";
        case "description":
          return "updated description";
        case "priority":
          return a.old_value
            ? `changed priority from ${prettyValue(a.old_value)} to ${prettyValue(a.new_value)}`
            : `set priority to ${prettyValue(a.new_value)}`;
        case "due_date":
          return a.new_value ? `changed deadline to ${formatDueDate(a.new_value)}` : "removed deadline";
        default:
          return `updated ${a.field.replace(/_/g, " ")}`;
      }
  }
};

export async function notifyTaskAssignees(params: {
  employeeIds: string[];
  employees: Employee[];
  actorUserId?: string | null;
  title: string;
  message: string;
  entityId?: string | null;
}) {
  const targets = params.employees.filter((e) => params.employeeIds.includes(e.id) && e.email);
  if (targets.length === 0) return;

  await Promise.allSettled(
    targets.map((emp) =>
      notify({
        user_id: emp.id,
        actor_id: params.actorUserId || null,
        type: "task_assigned",
        title: params.title,
        message: params.message,
        link: "/tasks",
        entity_id: params.entityId || null,
      })
    )
  );
}
