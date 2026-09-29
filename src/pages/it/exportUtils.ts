export {
  exportITAssetsPDF,
  exportITAssetsXLSX,
  exportITAssetsCSV,
  exportITTicketsPDF,
  exportITTicketsXLSX,
  exportITTicketsCSV,
} from "./exports";

export { exportITAssetsCSV as exportAssetsToCSV } from "./exports/exportITAssetsCSV";
export { exportITAssetsXLSX as exportAssetsToExcel } from "./exports/exportITAssetsXLSX";

export const exportToJSON = (data: unknown, filename = "export") => {
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
