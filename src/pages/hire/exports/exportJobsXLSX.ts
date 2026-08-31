import type { Job } from "../types";

const getXLSX = async () => {
  return await import("xlsx");
};

export async function exportJobsXLSX(jobs: Job[]): Promise<boolean> {
  const data = jobs.length > 0
    ? jobs.map((j) => ({
        "Job ID": j.id,
        "Job Title": j.title,
        Department: j.department,
        Branch: j.branches?.name || j.location || "All Branches",
        "Employment Type": j.type,
        "Min Salary": j.salary_min || 0,
        "Max Salary": j.salary_max || 0,
        Status: (j.status || "draft").toUpperCase(),
        "Posted Date": j.posted_at ? new Date(j.posted_at).toLocaleDateString() : "—",
        "Closing Date": j.closing_date ? new Date(j.closing_date).toLocaleDateString() : "—",
      }))
    : [{ "Job ID": "—", "Job Title": "No jobs found", Department: "—", Branch: "—", "Employment Type": "—", "Min Salary": 0, "Max Salary": 0, Status: "—", "Posted Date": "—", "Closing Date": "—" }];

  const XLSX = await getXLSX();
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Job Postings");
  XLSX.writeFile(wb, `job_postings_${new Date().toISOString().slice(0, 10)}.xlsx`);
  return true;
}
