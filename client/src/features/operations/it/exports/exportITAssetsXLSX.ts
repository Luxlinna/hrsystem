import type { ITAsset } from "../types";

const getXLSX = async () => {
  return await import("xlsx");
};

export async function exportITAssetsXLSX(assets: ITAsset[]): Promise<boolean> {
  const data = assets.length > 0
    ? assets.map((a) => {
        const empName = a.employees ? `${a.employees.first_name} ${a.employees.last_name}` : "Unassigned";
        const dept = a.employees?.department || "—";

        return {
          "Asset ID": a.id,
          "Asset Name": a.name,
          "Asset Tag": a.asset_tag,
          Type: a.type.toUpperCase(),
          "Serial Number": a.serial_number || "—",
          Branch: a.branches?.name || "General",
          "Assigned Employee": empName,
          Department: dept,
          Status: (a.status || "active").toUpperCase(),
          "Registered At": a.created_at ? new Date(a.created_at).toLocaleDateString() : "—",
        };
      })
    : [{
        "Asset ID": "—",
        "Asset Name": "No IT assets found",
        "Asset Tag": "—",
        Type: "—",
        "Serial Number": "—",
        Branch: "—",
        "Assigned Employee": "—",
        Department: "—",
        Status: "—",
        "Registered At": "—",
      }];

  const XLSX = await getXLSX();
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "ITAssets");
  XLSX.writeFile(wb, `it_assets_${new Date().toISOString().slice(0, 10)}.xlsx`);
  return true;
}
