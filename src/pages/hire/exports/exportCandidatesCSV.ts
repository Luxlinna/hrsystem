import type { Candidate } from "../types";

export function exportCandidatesCSV(candidates: Candidate[]): boolean {
  const headers = ["Full Name", "Email", "Phone", "Position Applied", "Department", "Source", "Stage", "Rating", "Applied Date"];
  const rows = candidates.map((c) => [
    `"${c.full_name.replace(/"/g, '""')}"`,
    `"${c.email.replace(/"/g, '""')}"`,
    `"${(c.phone || "—").replace(/"/g, '""')}"`,
    `"${(c.job_postings?.title || "General Application").replace(/"/g, '""')}"`,
    `"${(c.job_postings?.department || "—").replace(/"/g, '""')}"`,
    `"${(c.source || "Direct").replace(/"/g, '""')}"`,
    `"${(c.stage || "applied").toUpperCase()}"`,
    `"${c.rating ? `${c.rating}/5` : "—"}"`,
    `"${c.applied_at ? new Date(c.applied_at).toLocaleDateString() : "—"}"`,
  ].join(","));

  const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `candidates_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  return true;
}
