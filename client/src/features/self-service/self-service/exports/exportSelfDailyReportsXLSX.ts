import type { Employee, WorkLog } from "../types";

const getXLSX = async () => {
  return await import("xlsx");
};

export async function exportSelfDailyReportsXLSX(
  logs: WorkLog[],
  employee: Employee | null
): Promise<boolean> {
  const empName = employee ? `${employee.first_name} ${employee.last_name}` : "Employee";

  const data = logs.length > 0
    ? logs.map((l) => ({
        Employee: empName,
        Date: l.log_date ? new Date(l.log_date).toLocaleDateString() : "—",
        "Start Time": l.start_time || "—",
        "End Time": l.end_time || "—",
        Activity: l.activity,
        Notes: l.notes || "",
      }))
    : [{
        Employee: empName,
        Date: "No daily reports",
        "Start Time": "—",
        "End Time": "—",
        Activity: "—",
        Notes: "—",
      }];

  const XLSX = await getXLSX();
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "MyDailyReports");
  XLSX.writeFile(wb, `my_daily_reports_${new Date().toISOString().slice(0, 10)}.xlsx`);
  return true;
}
