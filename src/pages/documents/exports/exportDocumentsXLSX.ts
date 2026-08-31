import type { Document } from "../types";

const getXLSX = async () => {
  return await import("xlsx");
};

export async function exportDocumentsXLSX(documents: Document[]): Promise<boolean> {
  const data = documents.length > 0
    ? documents.map((d) => ({
        "Document ID": d.id,
        Title: d.title,
        Category: d.category,
        Subcategory: d.subcategory || "",
        "File Type": d.file_type.toUpperCase(),
        "Size (KB)": d.file_size_kb || 0,
        Version: d.version || "v1.0",
        Visibility: d.visibility.toUpperCase(),
        Status: d.status.toUpperCase(),
        Author: d.author_name || "—",
        Downloads: d.download_count || 0,
        "Is Template": d.is_template ? "YES" : "NO",
        "Uploaded Date": d.created_at ? new Date(d.created_at).toLocaleDateString() : "—",
        Description: d.description || "",
      }))
    : [{
        "Document ID": "—",
        Title: "No documents found",
        Category: "—",
        Subcategory: "—",
        "File Type": "—",
        "Size (KB)": 0,
        Version: "—",
        Visibility: "—",
        Status: "—",
        Author: "—",
        Downloads: 0,
        "Is Template": "—",
        "Uploaded Date": "—",
        Description: "—",
      }];

  const XLSX = await getXLSX();
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Documents");
  XLSX.writeFile(wb, `documents_catalog_${new Date().toISOString().slice(0, 10)}.xlsx`);
  return true;
}
