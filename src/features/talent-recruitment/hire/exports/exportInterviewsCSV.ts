import type { Interview } from "../types";

export function exportInterviewsCSV(interviews: Interview[]): boolean {
  const headers = ["Candidate", "Position Applied", "Scheduled Date & Time", "Duration (Min)", "Type", "Status", "Score", "Notes"];
  const rows = interviews.map((i) => [
    `"${(i.candidates?.full_name || "—").replace(/"/g, '""')}"`,
    `"${(i.candidates?.job_postings?.title || "—").replace(/"/g, '""')}"`,
    `"${i.scheduled_at ? new Date(i.scheduled_at).toLocaleString() : "—"}"`,
    i.duration_minutes || 45,
    `"${i.type.replace(/"/g, '""')}"`,
    `"${(i.status || "scheduled").toUpperCase()}"`,
    `"${i.score ? `${i.score}/5` : "—"}"`,
    `"${(i.notes || "").replace(/"/g, '""')}"`,
  ].join(","));

  const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `interviews_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  return true;
}
