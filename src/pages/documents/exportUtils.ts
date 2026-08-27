import type { Document } from "./types";
import { toast } from "@/components/Toast";

export function formatSize(kb: number | null): string {
  if (!kb) return "—";
  if (kb >= 1024) return `${(kb / 1024).toFixed(1)} MB`;
  return `${kb} KB`;
}

export function cleanFileName(name: string | null): string {
  if (!name) return "document.pdf";
  return name.replace(/^\d+_/, "");
}

export function exportDocumentsCSV(documents: Document[]) {
  const headers = [
    "Title",
    "Category",
    "Subcategory",
    "File Type",
    "Size KB",
    "Version",
    "Visibility",
    "Status",
    "Author",
    "Downloads",
    "Is Template",
    "Created Date",
  ];
  const rows = documents.map((d) => [
    `"${d.title.replace(/"/g, '""')}"`,
    `"${d.category}"`,
    `"${d.subcategory || ""}"`,
    `"${d.file_type}"`,
    d.file_size_kb || 0,
    `"${d.version}"`,
    `"${d.visibility}"`,
    `"${d.status}"`,
    `"${d.author_name}"`,
    d.download_count || 0,
    d.is_template ? "Yes" : "No",
    `"${d.created_at}"`,
  ]);
  const csv = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const uri = encodeURI(csv);
  const link = document.createElement("a");
  link.setAttribute("href", uri);
  link.setAttribute("download", `documents_export_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  toast("Export Complete", `Exported ${documents.length} documents.`, "success");
}
