import type { AnalyticsTabKey, ExportFormat } from "./types";

export const COLORS = [
  "#253C7D",
  "#29ABE2",
  "#74C8EC",
  "#B8C5E8",
  "#6C63FF",
  "#94A3B8",
  "#3d9970",
  "#27ae60",
] as const;

export const TABS: { key: AnalyticsTabKey; label: string }[] = [
  { key: "overview", label: "Workforce" },
  { key: "leave", label: "Leave" },
  { key: "payroll", label: "Payroll" },
  { key: "hiring", label: "Hiring" },
  { key: "offboarding", label: "Offboarding" },
  { key: "it", label: "IT & Assets" },
  { key: "finance", label: "Finance" },
  { key: "benefits", label: "Benefits" },
];

export const EXPORT_OPTIONS: {
  fmt: ExportFormat;
  label: string;
  hint: string;
  icon: string;
  desc: string;
  color: string;
}[] = [
  { fmt: "pdf", label: "PDF Document", hint: ".pdf", icon: "ri-file-pdf-line", desc: "Print-ready report", color: "text-red-500" },
  { fmt: "csv", label: "CSV Spreadsheet", hint: ".csv", icon: "ri-file-text-line", desc: "Comma-separated values", color: "text-emerald-600" },
  { fmt: "xlsx", label: "Excel Workbook", hint: ".xlsx", icon: "ri-file-excel-2-line", desc: "Microsoft Excel format", color: "text-green-600" },
];
