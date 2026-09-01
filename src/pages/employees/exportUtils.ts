import type { Employee, AccountStatus } from "./types";
import { toast } from "@/components/Toast";

export function exportEmployeesCSV(
  employees: Employee[],
  accountStatus: Record<string, AccountStatus> = {}
) {
  const headers = [
    "First Name",
    "Last Name",
    "Email",
    "Phone",
    "Role",
    "Department",
    "Branch",
    "Status",
    "Join Date",
    "Account Status",
  ];
  const rows = employees.map((e) => {
    const acc = accountStatus[e.email];
    const accountStatusValue = acc?.hasAccount ? "Active" : acc?.invited ? "Invited" : "No Account";
    return [
      e.first_name,
      e.last_name,
      e.email,
      e.phone || "",
      e.role || "",
      e.department || "",
      e.branches?.name || "Headquarters",
      e.status,
      e.join_date || "",
      accountStatusValue,
    ]
      .map((field) => `"${String(field).replace(/"/g, '""')}"`)
      .join(",");
  });

  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `employees_${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);

  toast("Export complete", `${employees.length} employee(s) exported to CSV`, "success");
}
