import { memo, useState, useRef } from "react";
import { toast } from "@/components/Toast";
import { scanSpreadsheetFile } from "@/features/workforce/employees/components/import/excelUtils";
import { parseMovementRows, type ParsedMovementRow } from "./import/importChangeStatusParser";
import { ImportChangeStatusPreview } from "./import/ImportChangeStatusPreview";
import { useImportChangeStatus } from "./import/useImportChangeStatus";
import type { EmployeeMovement } from "../types";

interface ImportChangeStatusModalProps {
  isOpen: boolean;
  employees: any[];
  branches: { id: string; name: string }[];
  workLocations?: { id: string; name: string; branch_id?: string }[];
  movements?: EmployeeMovement[];
  onClose: () => void;
  onSuccess?: () => void;
}

export const ImportChangeStatusModal = memo(function ImportChangeStatusModal({
  isOpen,
  employees,
  branches,
  workLocations = [],
  movements = [],
  onClose,
  onSuccess,
}: ImportChangeStatusModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedMovementRow[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [step, setStep] = useState<"upload" | "preview">("upload");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { isImporting, commitImport } = useImportChangeStatus({
    branches,
    workLocations,
    onSuccess,
    onClose,
  });

  if (!isOpen) return null;

  const handleDownloadTemplate = async () => {
    const XLSX = await import("xlsx");
    const sampleRows = [
      {
        "No.": 1,
        "Effective Date": "19/02/2025",
        "Status Type": "Join",
        "Employee Name": employees[0]?.full_name || employees[0]?.display_name || "Mrs. Chea Tiengchanvathna",
        "Employee Code": employees[0]?.employee_code || "168",
        "Business Unit (BU)": branches[0]?.name || "UNI Holding",
        "Position": "HR & Admin Officer (G3)",
        "Division": "HR & ADMIN",
        "Department": "HR & ADMIN",
        "Site": "UNI Building",
        "Supervisor": "CEO Office",
        "Joining Date": "19/02/2025",
        "Contract Type": "2-Year FDC",
        "Contract Period": "19/02/2025 - 19/02/2027",
        "Rate": "USD 100.00 Gross",
        "Salary After Probation": "USD 150.00 Gross",
        "Status": "Recorded",
        "Remark": "Join Status",
      },
    ];

    const ws = XLSX.utils.json_to_sheet(sampleRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Change Status Template");
    XLSX.writeFile(wb, "employee_change_status_import_template.xlsx");
    toast("Template Downloaded", "Sample import template downloaded.", "success");
  };

  const processSpreadsheet = async (uploadedFile: File) => {
    setFile(uploadedFile);
    setIsScanning(true);
    try {
      const { rawRows } = await scanSpreadsheetFile(uploadedFile);
      if (!rawRows || rawRows.length === 0) {
        setIsScanning(false);
        return;
      }

      const parsed = parseMovementRows(rawRows, employees, movements);
      setParsedRows(parsed);
      setStep("preview");
      const valid = parsed.filter((p) => p.isValid && !p.isDuplicate).length;
      const dupes = parsed.filter((p) => p.isDuplicate).length;
      toast(
        "Spreadsheet Scanned",
        `Parsed ${parsed.length} rows (${valid} ready to import${dupes > 0 ? `, ${dupes} existing skipped` : ""}).`,
        "info"
      );
    } catch (err) {
      console.error("Spreadsheet scan error:", err);
      toast("Read Failed", "Failed to parse the uploaded file.", "error");
    } finally {
      setIsScanning(false);
    }
  };

  const validCount = parsedRows.filter((r) => r.isValid && !r.isDuplicate).length;
  const invalidCount = parsedRows.length - validCount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto animate-in fade-in-50">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-none shadow-2xl w-full max-w-4xl overflow-hidden my-auto flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-[#253C7D]/10 text-[#253C7D] flex items-center justify-center">
              <i className="ri-upload-cloud-2-line text-lg" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-800 dark:text-white">Import Employee Change Statuses</h2>
              <p className="text-[11px] text-slate-400">Upload spreadsheet (.xlsx, .csv). Existing records are automatically skipped.</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="w-7 h-7 rounded border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-50 flex items-center justify-center cursor-pointer">
            <i className="ri-close-line text-base" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-5 text-xs">
          {step === "upload" ? (
            <div className="space-y-4">
              <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-slate-300 hover:border-[#253C7D] rounded-lg p-10 text-center cursor-pointer transition-colors bg-slate-50/50 hover:bg-[#253C7D]/2">
                <input ref={fileInputRef} type="file" accept=".xlsx, .xls, .csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) processSpreadsheet(f); }} />
                <div className="w-12 h-12 rounded-full bg-[#253C7D]/10 text-[#253C7D] flex items-center justify-center mx-auto mb-3">
                  <i className="ri-file-excel-2-line text-2xl" />
                </div>
                <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm">{isScanning ? "Scanning file..." : "Click or drag spreadsheet here"}</h3>
                <p className="text-xs text-slate-400 mt-1">Supports .xlsx, .xls, or .csv exported from the Change Statuses list</p>
              </div>

              <div className="flex items-center justify-between p-3.5 bg-sky-50/60 border border-sky-200/80 rounded">
                <div className="flex items-center gap-2">
                  <i className="ri-information-line text-sky-600 text-base" />
                  <span className="text-slate-700 text-xs">Need a formatted template with all required columns?</span>
                </div>
                <button type="button" onClick={handleDownloadTemplate} className="px-3 py-1.5 rounded bg-white border border-sky-300 text-sky-700 hover:bg-sky-50 font-medium text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs">
                  <i className="ri-download-2-line" />
                  <span>Download Sample Template</span>
                </button>
              </div>
            </div>
          ) : (
            <ImportChangeStatusPreview
              fileName={file?.name}
              parsedRows={parsedRows}
              validCount={validCount}
              invalidCount={invalidCount}
              onReset={() => { setStep("upload"); setFile(null); setParsedRows([]); }}
            />
          )}
        </div>

        <div className="px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/40">
          <button type="button" onClick={onClose} className="px-4 py-1.5 rounded border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-medium cursor-pointer">Cancel</button>
          {step === "preview" && (
            <button type="button" disabled={validCount === 0 || isImporting} onClick={() => commitImport(parsedRows)} className="px-5 py-1.5 rounded bg-[#253C7D] hover:bg-[#1e3066] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-xs">
              {isImporting ? <> <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> <span>Importing Records...</span> </> : <> <i className="ri-check-line text-sm" /> <span>Confirm & Import ({validCount} Records)</span> </>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
});
