import type { Document, DocumentFolder } from "../types";

export function exportDocumentsCSV(documents: Document[], _folders?: DocumentFolder[]): boolean {
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

  const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `documents_export_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  return true;
}
