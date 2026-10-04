import type { Interview } from "../types";

const getXLSX = async () => {
  return await import("xlsx");
};

export async function exportInterviewsXLSX(interviews: Interview[]): Promise<boolean> {
  const data = interviews.length > 0
    ? interviews.map((i) => ({
        "Interview ID": i.id,
        Candidate: i.candidates?.full_name || "—",
        Position: i.candidates?.job_postings?.title || "—",
        "Scheduled Date": i.scheduled_at ? new Date(i.scheduled_at).toLocaleString() : "—",
        "Duration (Min)": i.duration_minutes || 45,
        Type: i.type,
        Status: (i.status || "scheduled").toUpperCase(),
        Score: i.score ? `${i.score}/5` : "—",
        Notes: i.notes || "",
      }))
    : [{ "Interview ID": "—", Candidate: "No interviews found", Position: "—", "Scheduled Date": "—", "Duration (Min)": 0, Type: "—", Status: "—", Score: "—", Notes: "—" }];

  const XLSX = await getXLSX();
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Interviews");
  XLSX.writeFile(wb, `interview_sessions_${new Date().toISOString().slice(0, 10)}.xlsx`);
  return true;
}
