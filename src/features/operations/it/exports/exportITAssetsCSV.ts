import type { ITAsset } from "../types";

export function exportITAssetsCSV(assets: ITAsset[]): boolean {
  const headers = ["Asset Name", "Asset Tag", "Type", "Serial Number", "Branch", "Assigned Employee", "Department", "Status"];
  const rows = assets.map((a) => [
    `"${a.name.replace(/"/g, '""')}"`,
    `"${a.asset_tag}"`,
    `"${a.type}"`,
    `"${a.serial_number || ""}"`,
    `"${a.branches?.name || "General"}"`,
    `"${a.employees ? `${a.employees.first_name} ${a.employees.last_name}` : ""}"`,
    `"${a.employees?.department || ""}"`,
    `"${a.status}"`,
  ]);

  const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `it_assets_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  return true;
}
