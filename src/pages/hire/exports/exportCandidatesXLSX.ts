import type { Candidate } from "../types";

const getXLSX = async () => {
  return await import("xlsx");
};

export async function exportCandidatesXLSX(candidates: Candidate[]): Promise<boolean> {
  const data = candidates.length > 0
    ? candidates.map((c) => ({
        "Candidate ID": c.id,
        "Full Name": c.full_name,
        Email: c.email,
        Phone: c.phone || "—",
        Position: c.job_postings?.title || "General Application",
        Department: c.job_postings?.department || "—",
        Stage: (c.stage || "applied").toUpperCase(),
        Rating: c.rating ? `${c.rating}/5` : "—",
        Source: c.source || "Direct",
        "Applied Date": c.applied_at ? new Date(c.applied_at).toLocaleDateString() : "—",
        Notes: c.notes || "",
      }))
    : [{ "Candidate ID": "—", "Full Name": "No candidates found", Email: "—", Phone: "—", Position: "—", Department: "—", Stage: "—", Rating: "—", Source: "—", "Applied Date": "—", Notes: "—" }];

  const XLSX = await getXLSX();
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Candidates");
  XLSX.writeFile(wb, `candidates_roster_${new Date().toISOString().slice(0, 10)}.xlsx`);
  return true;
}
