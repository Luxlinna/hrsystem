import { memo, useState } from "react";
import { toast } from "@/components/Toast";
import type { ImportEmployeesModalProps, ParsedEmployeeRow } from "./import/types";
import { downloadEmployeeTemplate, parseEmployeeFile } from "./import/excelUtils";
import { commitEmployeeImport } from "./import/importActions";
import { ImportDropzone } from "./import/ImportDropzone";
import { ImportPreviewTable } from "./import/ImportPreviewTable";

export const ImportEmployeesModal = memo(function ImportEmployeesModal({
  isOpen,
  branches = [],
  actorName = "Admin",
  roleName = "Staff",
  onClose,
  onSuccess,
}: ImportEmployeesModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [parsedRows, setParsedRows] = useState<ParsedEmployeeRow[]>([]);

  if (!isOpen) return null;

  const handleDownload = () => downloadEmployeeTemplate(branches);

  const handleFileSelected = async (f: File) => {
    setFile(f);
    setParsing(true);
    try {
      const rows = await parseEmployeeFile(f);
      setParsedRows(rows);
      if (rows.length > 0) {
        toast("File Loaded", `Parsed ${rows.length} rows (${rows.filter((r) => r.isValid).length} ready)`, "success");
      }
    } catch (err) {
      console.error(err);
      toast("Parse Error", "Failed to parse file. Please verify it is a valid Excel or CSV sheet.", "error");
    } finally {
      setParsing(false);
    }
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
      toast("Import Failed", err?.message || "Could not insert records into employees table.", "error");
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
                Import Employees (Excel / CSV)
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Bulk upload staff records directly into the employee directory
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 hover:border-[#253C7D] text-[#253C7D] dark:text-[#7ba3d4] text-xs font-medium rounded shadow-2xs transition-colors cursor-pointer"
              title="Download standardized Excel template"
            >
              <i className="ri-download-2-line text-xs" />
              <span>Download Template (.xlsx)</span>
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

        {/* Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          <ImportDropzone file={file} onFileSelected={handleFileSelected} />

          {parsing && (
            <div className="py-6 text-center">
              <div className="w-6 h-6 border-2 border-[#253C7D] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs text-slate-500">Reading and validating spreadsheet data...</p>
            </div>
          )}

          {!parsing && parsedRows.length > 0 && <ImportPreviewTable rows={parsedRows} />}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            disabled={importing}
            className="px-3.5 py-1.5 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700 rounded transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleCommit}
            disabled={importing || validCount === 0}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-[#253C7D] hover:bg-[#1E3064] text-white text-xs font-medium rounded shadow-2xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {importing ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Importing {validCount} Employees...</span>
              </>
            ) : (
              <>
                <i className="ri-check-double-line text-xs" />
                <span>Import {validCount} Employees</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
});
