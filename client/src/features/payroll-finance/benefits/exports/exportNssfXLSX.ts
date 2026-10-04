import type { NssfEmployee } from "../types";

const getXLSX = async () => {
  return await import("xlsx");
};

export async function exportNssfXLSX(employees: NssfEmployee[]): Promise<boolean> {
  const data =
    employees.length > 0
      ? employees.map((e, idx) => ({
          No: idx + 1,
          "Employee ID": e.id,
          "NSSF Number": e.nssf_number || "—",
          "Name (English)": `${e.first_name} ${e.last_name}`,
          "Name (Khmer)": e.kh_name || "—",
          Gender: e.gender || "—",
          Nationality: e.nationality || "Cambodian",
          "Date of Birth": e.date_of_birth || "—",
          "Join Date": e.join_date || "—",
          "Basic Salary (USD)": e.basic_salary ?? "—",
          Status: e.status || "Active",
          Department: e.department || "—",
          Branch: e.branch || "—",
        }))
      : [
          {
            No: "—",
            "Employee ID": "No employees found",
            "NSSF Number": "—",
            "Name (English)": "—",
            "Name (Khmer)": "—",
            Gender: "—",
            Nationality: "—",
            "Date of Birth": "—",
            "Join Date": "—",
            "Basic Salary (USD)": "—",
            Status: "—",
            Department: "—",
            Branch: "—",
          },
        ];

  const XLSX = await getXLSX();
  const ws = XLSX.utils.json_to_sheet(data);
  // Set column widths
  ws["!cols"] = [
    { wch: 5 }, { wch: 16 }, { wch: 16 }, { wch: 24 }, { wch: 24 },
    { wch: 10 }, { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 18 },
    { wch: 10 }, { wch: 18 }, { wch: 18 },
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "NSSF Report");
  XLSX.writeFile(wb, `nssf_report_${new Date().toISOString().slice(0, 10)}.xlsx`);
  return true;
}
