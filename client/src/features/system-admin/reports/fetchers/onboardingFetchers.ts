import { supabase } from "@/lib/supabase";
import type { ReportConfig } from "../types";
import { matchesEmployeeFilters, formatDateTime } from "../reportsUtils";
import type { ReportResult } from "./reportTypes";

export const fetchOnboardingReport = async (config: ReportConfig): Promise<ReportResult> => {
  let q = supabase
    .from("onboarding_requests")
    .select("id, stage, status, day_count, requested_by, created_at, deleted_at, deleted_by, employees(id, first_name, last_name, role, department, branches(name)), onboarding_documents(id, status)")
    .order("created_at", { ascending: false });

  if (config.dateFrom) q = q.gte("created_at", config.dateFrom);
  if (config.dateTo) q = q.lte("created_at", config.dateTo + "T23:59:59");

  const { data, error } = await q;
  if (error) console.error("fetchOnboarding error:", error);

  const STAGE_LABELS: Record<string, string> = {
    document: "Document Collection",
    it_setup: "IT & Equipment Setup",
    training: "Training & Orientation",
    complete: "Final Sign-off",
  };

  const mapped = (data || [])
    .map((r: any) => {
      const empName = `${r.employees?.first_name || ""} ${r.employees?.last_name || ""}`.trim();
      const totalDocs = r.onboarding_documents?.length || 0;
      const verifiedDocs = (r.onboarding_documents || []).filter((d: any) => d.status === "complete").length;
      const docProgress = totalDocs > 0 ? `${verifiedDocs}/${totalDocs} verified` : "0 verified";
      const isDeleted = Boolean(r.deleted_at);

      return {
        id: r.id,
        employee: empName || "Unknown Candidate",
        role: r.employees?.role || "—",
        department: r.employees?.department || "—",
        branch: r.employees?.branches?.name || "—",
        stage: STAGE_LABELS[r.stage] || r.stage || "Document Collection",
        status: isDeleted ? "deleted" : (r.status || "pending"),
        verified_docs: docProgress,
        requested_by: r.requested_by || "Admin",
        started_date: r.created_at?.substring(0, 10) || "—",
        deleted_at: r.deleted_at || null,
        deleted_by: r.deleted_by || "—",
        deleted_at_formatted: formatDateTime(r.deleted_at),
      };
    })
    .filter((r) => matchesEmployeeFilters(r, config));

  const cols = ["Employee", "Role", "Department", "Branch", "Stage", "Status", "Verified Docs", "Requested By", "Started Date", "Deleted By", "Deleted Date & Time"];

  const completed = mapped.filter((r) => r.status === "completed").length;
  const approved = mapped.filter((r) => r.status === "approved" || r.status === "in_progress").length;
  const pending = mapped.filter((r) => r.status === "pending").length;
  const deletedCount = mapped.filter((r) => r.status === "deleted" || Boolean(r.deleted_at)).length;

  const summary: Record<string, string | number> = {
    "Total Onboarding": mapped.length,
    "Approved & Active": approved,
    "Completed / Graduated": completed,
    "Pending Approval": pending,
    ...(deletedCount > 0 ? { "Deleted Onboarding": deletedCount } : {}),
  };

  return { rows: mapped, columns: cols, summary };
};

export const fetchOnboardingTasksReport = async (config: ReportConfig): Promise<ReportResult> => {
  let q = supabase
    .from("onboarding_checklist_tasks")
    .select("id, task_name, description, category, priority, assigned_to, assigned_to_role, due_date, completed, completed_by, completed_at, deleted_at, deleted_by, sort_order, onboarding_requests(id, stage, status, employees(id, first_name, last_name, department, branches(name)))")
    .order("sort_order", { ascending: true });

  if (config.dateFrom) q = q.gte("due_date", config.dateFrom);
  if (config.dateTo) q = q.lte("due_date", config.dateTo);

  const { data, error } = await q;
  if (error) console.error("fetchOnboardingTasks error:", error);

  const CATEGORY_LABELS: Record<string, string> = {
    documents: "Documents",
    it_setup: "IT Setup",
    training: "Training",
    general: "General & Culture",
  };

  const mapped = (data || [])
    .map((r: any) => {
      const emp = r.onboarding_requests?.employees;
      const candidateName = emp ? `${emp.first_name || ""} ${emp.last_name || ""}`.trim() : "—";
      const isDone = Boolean(r.completed);
      const isDeleted = Boolean(r.deleted_at);

      return {
        id: r.id,
        task_name: r.task_name,
        candidate: candidateName,
        employee: candidateName,
        department: emp?.department || "—",
        branch: emp?.branches?.name || "—",
        category: CATEGORY_LABELS[r.category] || r.category || "General",
        priority: r.priority || "medium",
        assigned_to: r.assigned_to ? `${r.assigned_to}${r.assigned_to_role ? ` (${r.assigned_to_role})` : ""}` : "Unassigned",
        due_date: r.due_date || "No deadline",
        status: isDeleted ? "deleted" : (isDone ? "completed" : "pending"),
        completed_by: r.completed_by || "—",
        completed_at: r.completed_at ? r.completed_at.substring(0, 10) : "—",
        verified_at: formatDateTime(r.completed_at),
        deleted_at: r.deleted_at || null,
        deleted_by: r.deleted_by || "—",
        deleted_at_formatted: formatDateTime(r.deleted_at),
      };
    })
    .filter((r) => matchesEmployeeFilters(r, config));

  const cols = ["Task Name", "Candidate", "Department", "Branch", "Category", "Priority", "Assigned To", "Due Date", "Status", "Verified By", "Verified Date & Time", "Deleted By", "Deleted Date & Time"];

  const todayStr = new Date().toISOString().substring(0, 10);
  const completedCount = mapped.filter((r) => r.status === "completed").length;
  const pendingCount = mapped.filter((r) => r.status === "pending").length;
  const overdueCount = mapped.filter((r) => r.status === "pending" && r.due_date !== "No deadline" && r.due_date < todayStr).length;
  const deletedCount = mapped.filter((r) => r.status === "deleted" || Boolean(r.deleted_at)).length;

  const summary: Record<string, string | number> = {
    "Total Tasks": mapped.length,
    "Completed / Verified": completedCount,
    "Pending Tasks": pendingCount,
    "Overdue Tasks": overdueCount,
    ...(deletedCount > 0 ? { "Deleted Tasks": deletedCount } : {}),
  };

  return { rows: mapped, columns: cols, summary };
};
