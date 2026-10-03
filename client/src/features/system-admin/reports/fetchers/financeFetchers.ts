import { supabase } from "@/lib/supabase";
import type { ReportConfig } from "../types";
import { matchesEmployeeFilters, formatDateTime } from "../reportsUtils";
import type { ReportResult } from "./reportTypes";

export const fetchExpensesReport = async (config: ReportConfig): Promise<ReportResult> => {
  let q = supabase
    .from("expense_records")
    .select("id, description, category, amount, submitted_by, status, created_at, deleted_at, deleted_by")
    .order("created_at", { ascending: false });

  if (config.dateFrom) q = q.gte("created_at", config.dateFrom);
  if (config.dateTo) q = q.lte("created_at", config.dateTo + "T23:59:59");
  const { data } = await q;

  const mapped = (data || [])
    .map((r: any) => {
      const isDeleted = Boolean(r.deleted_at);
      return {
        id: r.id,
        description: r.description,
        category: r.category,
        amount: r.amount,
        submitted_by: r.submitted_by,
        status: isDeleted ? "deleted" : r.status,
        date: r.created_at?.substring(0, 10) || "",
        deleted_at: r.deleted_at || null,
        deleted_by: r.deleted_by || "—",
        deleted_at_formatted: formatDateTime(r.deleted_at),
      };
    })
    .filter((r) => matchesEmployeeFilters(r, config));

  const cols = ["Description", "Category", "Amount", "Submitted By", "Date", "Status", "Deleted By", "Deleted Date & Time"];

  const total = mapped.filter((r) => r.status !== "deleted").reduce((s, r) => s + Number(r.amount), 0);
  const paid = mapped.filter((r) => r.status === "paid").reduce((s, r) => s + Number(r.amount), 0);
  const pending = mapped.filter((r) => r.status === "pending").length;
  const deletedCount = mapped.filter((r) => r.status === "deleted" || Boolean(r.deleted_at)).length;

  const summary: Record<string, string | number> = {
    "Total Records": mapped.length,
    "Total Amount": `$${total.toLocaleString()}`,
    "Amount Paid": `$${paid.toLocaleString()}`,
    "Pending Approval": pending,
    ...(deletedCount > 0 ? { "Deleted Records": deletedCount } : {}),
  };

  return { rows: mapped, columns: cols, summary };
};

export const fetchHireReport = async (config: ReportConfig): Promise<ReportResult> => {
  let q = supabase
    .from("candidates")
    .select("id, full_name, stage, applied_at, deleted_at, deleted_by, job_postings(title)")
    .order("applied_at", { ascending: false });

  if (config.dateFrom) q = q.gte("applied_at", config.dateFrom);
  if (config.dateTo) q = q.lte("applied_at", config.dateTo + "T23:59:59");
  const { data } = await q;

  const mapped = (data || [])
    .map((r: any) => {
      const isDeleted = Boolean(r.deleted_at);
      return {
        id: r.id,
        name: r.full_name || "",
        position: r.job_postings?.title || "—",
        stage: r.stage,
        status: isDeleted ? "deleted" : r.stage,
        applied_date: r.applied_at?.substring(0, 10) || "",
        deleted_at: r.deleted_at || null,
        deleted_by: r.deleted_by || "—",
        deleted_at_formatted: formatDateTime(r.deleted_at),
      };
    })
    .filter((r) => matchesEmployeeFilters(r, config));

  const cols = ["Candidate", "Position", "Stage", "Status", "Applied Date", "Deleted By", "Deleted Date & Time"];

  const hired = mapped.filter((r) => r.status === "hired").length;
  const inProgress = mapped.filter((r) => !["hired", "rejected", "deleted"].includes(r.status)).length;
  const rejected = mapped.filter((r) => r.status === "rejected").length;
  const deletedCount = mapped.filter((r) => r.status === "deleted" || Boolean(r.deleted_at)).length;

  const summary: Record<string, string | number> = {
    "Total Candidates": mapped.length,
    Hired: hired,
    "In Progress": inProgress,
    Rejected: rejected,
    ...(deletedCount > 0 ? { "Deleted Candidates": deletedCount } : {}),
  };

  return { rows: mapped, columns: cols, summary };
};
