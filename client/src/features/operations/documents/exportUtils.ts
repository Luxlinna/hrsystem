import type { Document } from "./types";
import { exportDocumentsCSV } from "./exports";

export function formatSize(kb: number | null): string {
  if (!kb) return "—";
  if (kb >= 1024) return `${(kb / 1024).toFixed(1)} MB`;
  return `${kb} KB`;
}

export function cleanFileName(name: string | null): string {
  if (!name) return "document.pdf";
  return name.replace(/^\d+_/, "");
}

export {
  exportDocumentsPDF,
  exportDocumentsXLSX,
  exportDocumentsCSV,
} from "./exports";
