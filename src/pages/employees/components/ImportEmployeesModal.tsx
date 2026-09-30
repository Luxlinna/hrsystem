import { memo, useState } from "react";
import { toast } from "@/components/Toast";
import type { ImportEmployeesModalProps, ParsedEmployeeRow, ColumnMappingState } from "./import/types";
import { downloadEmployeeTemplate, scanSpreadsheetFile, transformRowsWithMapping } from "./import/excelUtils";
import { detectColumnMappings, extractColumnSampleValues } from "./import/columnMatcher";
import { commitEmployeeImport } from "./import/importActions";
import { ImportDropzone } from "./import/ImportDropzone";
import { ImportColumnMapper } from "./import/ImportColumnMapper";
import { ImportPreviewTable } from "./import/ImportPreviewTable";

type ImportStep = "upload" | "mapping" | "preview";

export const ImportEmployeesModal = memo(function ImportEmployeesModal({
  isOpen,
  branches = [],
  actorName = "Admin",
  roleName = "Staff",
  onClose,
  onSuccess,
}: ImportEmployeesModalProps) {
  const [step, setStep] = useState<ImportStep>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [detectedHeaders, setDetectedHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<Record<string, any>[]>([]);
  const [sampleValues, setSampleValues] = useState<Record<string, string>>({});
  const [mapping, setMapping] = useState<ColumnMappingState>({});
  const [parsedRows, setParsedRows] = useState<ParsedEmployeeRow[]>([]);
  const [scanning, setScanning] = useState(false);
  const [importing, setImporting] = useState(false);

  if (!isOpen) return null;

  const handleDownload = () => downloadEmployeeTemplate(branches);

  const handleFileSelected = async (f: File) => {
    setFile(f);
    setScanning(true);
    try {
      const { headers, rawRows: rows } = await scanSpreadsheetFile(f);
      if (headers.length === 0 || rows.length === 0) return;

      const samples = extractColumnSampleValues(rows, headers);
      const autoMapping = detectColumnMappings(headers);

      setDetectedHeaders(headers);
      setRawRows(rows);
      setSampleValues(samples);
      setMapping(autoMapping);

      const parsed = transformRowsWithMapping(rows, autoMapping);
      setParsedRows(parsed);
      setStep("mapping");
      toast("File Scanned", `Detected ${headers.length} columns and ${rows.length} rows.`, "success");
    } catch (err) {
      console.error(err);
      toast("Scan Failed", "Could not scan spreadsheet.", "error");
    } finally {
      setScanning(false);
    }
  };

  const handleUpdateMapping = (fieldKey: string, headerName: string) => {
    const updated = { ...mapping, [fieldKey]: headerName };
    setMapping(updated);
    setParsedRows(transformRowsWithMapping(rawRows, updated));
  };

  const handleResetAutoMatch = () => {
    const autoMapping = detectColumnMappings(detectedHeaders);
    setMapping(autoMapping);
    setParsedRows(transformRowsWithMapping(rawRows, autoMapping));
    toast("Reset", "Restored auto-detected column matches.", "info");
  };

  const handleCommit = async () => {
    const validRows = parsedRows.filter((r) => r.isValid);
    if (validRows.length === 0) {
      toast("No Valid Records", "No records passed validation.", "error");
      return;
    }
    setImporting(true);
    try {
      await commitEmployeeImport({
        validRows,
        actorName,
        roleName,
        fileName: file?.name,
        onSuccess,
        onClose,
      });
    } catch (err: any) {
      console.error("Import error:", err);
      toast("Import Failed", err?.message || "Could not insert records.", "error");
    } finally {
      setImporting(false);
    }
  };

  const validCount = parsedRows.filter((r) => r.isValid).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-800 rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden text-xs">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-[#253C7D] text-white flex items-center justify-center text-sm shadow-2xs">
              <i className="ri-file-excel-2-line text-base" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm">
                Import Employees &bull; {step === "upload" ? "Upload File" : step === "mapping" ? "Column Mapping" : "Preview & Verify"}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Scan spreadsheet, match columns with system schema, and batch insert
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 hover:border-[#253C7D] text-[#253C7D] dark:text-[#7ba3d4] text-xs font-medium rounded shadow-2xs transition-colors cursor-pointer"
            >
              <i className="ri-download-2-line text-xs" />
              <span>Template (.xlsx)</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-7 h-7 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center transition-colors cursor-pointer"
            >
              <i className="ri-close-line text-base" />
            </button>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="px-5 py-2 bg-slate-100/70 dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-700 flex items-center gap-4 text-xs font-medium text-slate-500">
          <span className={`flex items-center gap-1.5 ${step === "upload" ? "text-[#253C7D] dark:text-[#7ba3d4] font-semibold" : ""}`}>
            <span className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-700 text-[10px] flex items-center justify-center">1</span>
            Upload Spreadsheet
          </span>
          <i className="ri-arrow-right-s-line text-slate-400" />
          <span className={`flex items-center gap-1.5 ${step === "mapping" ? "text-[#253C7D] dark:text-[#7ba3d4] font-semibold" : ""}`}>
            <span className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-700 text-[10px] flex items-center justify-center">2</span>
            Scan & Map Columns
          </span>
          <i className="ri-arrow-right-s-line text-slate-400" />
          <span className={`flex items-center gap-1.5 ${step === "preview" ? "text-[#253C7D] dark:text-[#7ba3d4] font-semibold" : ""}`}>
            <span className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-700 text-[10px] flex items-center justify-center">3</span>
            Preview & Confirm
          </span>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {step === "upload" && (
            <ImportDropzone file={file} onFileSelected={handleFileSelected} />
          )}

          {scanning && (
            <div className="py-6 text-center">
              <div className="w-6 h-6 border-2 border-[#253C7D] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs text-slate-500">Scanning spreadsheet headers and rows...</p>
            </div>
          )}

          {step === "mapping" && (
            <ImportColumnMapper
              detectedHeaders={detectedHeaders}
              sampleValues={sampleValues}
              mapping={mapping}
              onUpdateMapping={handleUpdateMapping}
              onResetAutoMatch={handleResetAutoMatch}
            />
          )}

          {step === "preview" && <ImportPreviewTable rows={parsedRows} />}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 flex items-center justify-between">
          <div>
            {step === "mapping" && (
              <button
                type="button"
                onClick={() => setStep("upload")}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200/60 rounded transition-colors cursor-pointer"
              >
                &larr; Choose Different File
              </button>
            )}
            {step === "preview" && (
              <button
                type="button"
                onClick={() => setStep("mapping")}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200/60 rounded transition-colors cursor-pointer"
              >
                &larr; Back to Column Mapping
              </button>
            )}
            {step === "upload" && (
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-200/60 rounded transition-colors cursor-pointer"
              >
                Cancel
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {step === "mapping" && (
              <button
                type="button"
                onClick={() => setStep("preview")}
                className="px-4 py-1.5 bg-[#253C7D] hover:bg-[#1E3064] text-white text-xs font-medium rounded shadow-2xs transition-colors cursor-pointer"
              >
                Review & Preview ({parsedRows.length} Rows) &rarr;
              </button>
            )}

            {step === "preview" && (
              <button
                type="button"
                onClick={handleCommit}
                disabled={importing || validCount === 0}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-[#253C7D] hover:bg-[#1E3064] text-white text-xs font-medium rounded shadow-2xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {importing ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Importing...</span>
                  </>
                ) : (
                  <>
                    <i className="ri-check-double-line text-xs" />
                    <span>Confirm & Import ({validCount} Valid)</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});
