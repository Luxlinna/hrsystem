import type { Employee, LeaveRequest } from "../types";

const getXLSX = async () => {
  return await import("xlsx");
};

export async function exportSelfLeaveXLSX(
  leaves: LeaveRequest[],
  employee: Employee | null
): Promise<boolean> {
  const empName = employee ? `${employee.first_name} ${employee.last_name}` : "Employee";

  const data = leaves.length > 0
    ? leaves.map((l) => ({
        Employee: empName,
        "Leave Type": (l.leave_type || "Vacation").toUpperCase(),
        "Start Date": l.start_date ? new Date(l.start_date).toLocaleDateString() : "—",
        "End Date": l.end_date ? new Date(l.end_date).toLocaleDateString() : "—",
        "Days Count": Number(l.days || 1),
        Reason: l.reason || "",
        Status: (l.status || "pending").toUpperCase(),
        "Submitted Date": l.created_at ? new Date(l.created_at).toLocaleDateString() : "—",
      }))
    : [{
        Employee: empName,
        "Leave Type": "No records",
        "Start Date": "—",
        "End Date": "—",
        "Days Count": 0,
        Reason: "—",
        Status: "—",
        "Submitted Date": "—",
      }];

  const XLSX = await getXLSX();
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "MyLeaveRequests");
  XLSX.writeFile(wb, `my_leave_requests_${new Date().toISOString().slice(0, 10)}.xlsx`);
  return true;
}
