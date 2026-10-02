import type { Offboarding } from "../types";

const getXLSX = async () => {
  return await import("xlsx");
};

export async function exportOffboardingsXLSX(offboardings: Offboarding[]): Promise<boolean> {
  const data = offboardings.length > 0
    ? offboardings.map((o) => {
        const empName = `${o.employees?.first_name || ""} ${o.employees?.last_name || ""}`.trim() || "Employee";
        const dept = o.employees?.department || "—";
        const branch = o.employees?.branches?.name || "Main Branch";
        const role = o.employees?.role || "Staff";
        const tasks = o.tasks || [];
        const completedTasks = tasks.filter((t) => t.status === "completed").length;
        const progress = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

        return {
          "Employee Name": empName,
          Role: role,
          Department: dept,
          Branch: branch,
          "Last Working Day": o.last_day || "—",
          "Departure Reason": o.reason || "Departure",
          Status: (o.status || "initiated").replace(/_/g, " ").toUpperCase(),
          "Completed Tasks": completedTasks,
          "Total Tasks": tasks.length,
          "Clearance Progress (%)": `${progress}%`,
          "Created Date": o.created_at ? new Date(o.created_at).toLocaleDateString() : "—",
          Notes: o.notes || "",
        };
      })
    : [{
        "Employee Name": "No records found",
        Role: "—",
        Department: "—",
        Branch: "—",
        "Last Working Day": "—",
        "Departure Reason": "—",
        Status: "—",
        "Completed Tasks": 0,
        "Total Tasks": 0,
        "Clearance Progress (%)": "0%",
        "Created Date": "—",
        Notes: "—",
      }];

  const XLSX = await getXLSX();
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Offboarding Log");
  XLSX.writeFile(wb, `offboarding_departures_${new Date().toISOString().slice(0, 10)}.xlsx`);
  return true;
}
