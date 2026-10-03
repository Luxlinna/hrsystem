import { useState, useRef, memo } from "react";
import { read, downloadXlsx, utils } from "@/lib/xlsx";
import { toast } from "@/components/Toast";
import type { Position } from "../../types";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onImport: (items: Array<{ name: string; status?: string; sort_order?: number }>) => Promise<boolean>;
  existingPositions?: Position[];
}

interface ParsedRow {
  rowNumber: number;
  name: string;
  status: "active" | "disabled";
  sort_order?: number;
  isValid: boolean;
  error?: string;
}

export const ImportPositionsModal = memo(function ImportPositionsModal({
  isOpen,
  onClose,
  onImport,
  existingPositions = [],
}: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [drag, setDrag] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleDownloadTemplate = () => {
    const sample = [
      { "Position Name": "Senior Software Engineer", "Status": "active" },
      { "Position Name": "HR Operations Specialist", "Status": "active" },
      { "Position Name": "Financial Controller", "Status": "active" },
    ];
    const ws = utils.json_to_sheet(sample);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, "Positions Template");
    downloadXlsx(wb, "positions_import_template.xlsx");
    toast("Template downloaded", "success");
  };

  const processFile = async (f: File) => {
    setFile(f);
    setParsing(true);
    setRows([]);
    try {
      const buffer = await f.arrayBuffer();
      const wb = await read(buffer);
      const rawJson = utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
      if (!rawJson?.length) return toast("No data found in uploaded file", "error");

      const existing = new Set(existingPositions.map((p) => (p.name || "").trim().toLowerCase()));
      const seen = new Set<string>();

      const parsed: ParsedRow[] = rawJson.map((r: any, i: number) => {
        const name = String(r["Position Name"] ?? r["Position"] ?? r["Name"] ?? r["Title"] ?? "").trim();
        const status = String(r["Status"] ?? "active").toLowerCase().includes("disab") ? "disabled" : "active";
        const sort = r["Sort Order"] ?? r["Order"] ?? i + 1;

        let isValid = true;
        let error = "";
        if (!name) { isValid = false; error = "Missing name"; }
        else if (seen.has(name.toLowerCase())) { isValid = false; error = "Duplicate in file"; }
        else if (existing.has(name.toLowerCase())) { isValid = false; error = "Already exists"; }
        else seen.add(name.toLowerCase());

        return { rowNumber: i + 1, name, status, sort_order: typeof sort === "number" ? sort : i + 1, isValid, error };
      });

      setRows(parsed);
      toast(`Scanned ${parsed.length} rows (${parsed.filter((r) => r.isValid).length} valid)`, "info");
    } catch (err: any) {
      toast(err.message || "Failed to parse spreadsheet file", "error");
    } finally {
      setParsing(false);
    }
  };

  const handleCommit = async () => {
    const valid = rows.filter((r) => r.isValid);
    if (!valid.length) return toast("No valid rows to import", "error");
    setImporting(true);
    try {
      const ok = await onImport(valid.map((r) => ({ name: r.name, status: r.status, sort_order: r.sort_order })));
      if (ok) { setFile(null); setRows([]); onClose(); }
    } finally {
      setImporting(false);
    }
  };

  const validCount = rows.filter((r) => r.isValid).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#0088cc]/10 text-[#0088cc] flex items-center justify-center font-bold">
              <i className="ri-file-upload-line text-lg" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Import Positions</h3>
              <p className="text-[11px] text-slate-500">Upload an Excel or CSV file to import positions in bulk</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
            <i className="ri-close-line text-base" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 text-xs">
          <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
            <span className="text-slate-600 dark:text-slate-300">Need the spreadsheet template?</span>
            <button type="button" onClick={handleDownloadTemplate} className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 text-[#0088cc] font-semibold rounded-lg shadow-2xs hover:border-[#0088cc] cursor-pointer inline-flex items-center gap-1.5">
              <i className="ri-download-2-line text-xs" /> Download Template
            </button>
          </div>

          {!file && (
            <div
              onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
              onDragLeave={() => setDrag(false)}
              onDrop={(e) => { e.preventDefault(); setDrag(false); if (e.dataTransfer.files?.[0]) processFile(e.dataTransfer.files[0]); }}
              onClick={() => fileRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all flex flex-col items-center gap-2 ${drag ? "border-[#0088cc] bg-blue-50/50" : "border-slate-300 hover:border-[#0088cc]"}`}
            >
              <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])} className="hidden" />
              <i className="ri-upload-cloud-2-line text-3xl text-[#0088cc]" />
              <p className="font-semibold text-slate-800 dark:text-slate-200">Click to browse or drag and drop spreadsheet (.xlsx, .csv)</p>
            </div>
          )}

          {parsing && <div className="py-6 text-center text-slate-400"><i className="ri-loader-4-line animate-spin text-lg" /> Scanning file...</div>}

          {file && !parsing && (
            <div className="space-y-2">
              <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                <span className="font-bold text-slate-800 truncate">{file.name} ({(file.size / 1024).toFixed(1)} KB)</span>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded font-semibold">{validCount} Valid</span>
                  <button type="button" onClick={() => { setFile(null); setRows([]); }} className="text-slate-400 hover:text-slate-700 underline cursor-pointer">Change</button>
                </div>
              </div>
              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-52 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-semibold sticky top-0">
                    <tr>
                      <th className="py-2 px-3 w-10">#</th>
                      <th className="py-2 px-3">Position Name</th>
                      <th className="py-2 px-3">Status</th>
                      <th className="py-2 px-3">Validation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rows.map((r) => (
                      <tr key={r.rowNumber} className={r.isValid ? "hover:bg-slate-50" : "bg-rose-50/50 text-rose-900"}>
                        <td className="py-1.5 px-3 text-slate-400">{r.rowNumber}</td>
                        <td className="py-1.5 px-3 font-medium">{r.name || "Missing"}</td>
                        <td className="py-1.5 px-3"><span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 uppercase">{r.status}</span></td>
                        <td className="py-1.5 px-3 font-medium">{r.isValid ? <span className="text-emerald-600">✓ Valid</span> : <span className="text-rose-600">✕ {r.error}</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 flex items-center justify-between shrink-0 bg-slate-50/50">
          <button type="button" onClick={onClose} className="px-4 py-2 bg-white text-slate-700 font-semibold rounded-lg border border-slate-300 hover:bg-slate-100 cursor-pointer">Cancel</button>
          <button type="button" onClick={handleCommit} disabled={!validCount || importing} className="px-5 py-2 bg-[#0088cc] hover:bg-[#0077b3] disabled:opacity-40 text-white font-semibold rounded-lg shadow-sm cursor-pointer">
            {importing ? "Importing..." : `Import ${validCount > 0 ? `${validCount} Position${validCount > 1 ? "s" : ""}` : ""}`}
          </button>
        </div>
      </div>
    </div>
  );
});
