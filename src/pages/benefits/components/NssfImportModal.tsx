import { useState, useRef, useCallback } from "react";
import type { NssfEmployee } from "../types";

interface NssfImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (rows: Partial<NssfEmployee>[]) => Promise<void>;
  saving: boolean;
}

type ImportRow = {
  id?: string;
  nssf_number?: string;
  kh_name?: string;
  nationality?: string;
  gender?: string;
  date_of_birth?: string;
  basic_salary?: number;
  _name?: string;
};

const EXPECTED_HEADERS = [
  "Employee ID",
  "NSSF Number",
  "Name (Khmer)",
  "Nationality",
  "Gender",
  "Date of Birth",
  "Basic Salary (USD)",
];

export function NssfImportModal({ isOpen, onClose, onImport, saving }: NssfImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ImportRow[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseFile = useCallback(async (f: File) => {
    setParseError(null);
    setPreview([]);

    const isCSV  = f.name.endsWith(".csv");
    const isXLSX = f.name.endsWith(".xlsx") || f.name.endsWith(".xls");

    if (!isCSV && !isXLSX) {
      setParseError("Only .csv, .xlsx, or .xls files are supported.");
      return;
    }

    try {
      let raw: Record<string, string | number>[] = [];

      if (isCSV) {
        // ── Manual CSV parse (handles BOM + quoted fields) ──────────────────
        const text = (await f.text()).replace(/^\uFEFF/, ""); // strip BOM
        const lines = text.split(/\r?\n/).filter((l) => l.trim() !== "");
        if (lines.length < 2) {
          setParseError("The CSV file appears to be empty or has only a header row.");
          return;
        }

        // Simple CSV tokeniser — handles quoted commas
        const tokenise = (line: string): string[] => {
          const result: string[] = [];
          let cur = "";
          let inQuote = false;
          for (let i = 0; i < line.length; i++) {
            const ch = line[i];
            if (ch === '"') {
              if (inQuote && line[i + 1] === '"') { cur += '"'; i++; }
              else inQuote = !inQuote;
            } else if (ch === "," && !inQuote) {
              result.push(cur.trim()); cur = "";
            } else {
              cur += ch;
            }
          }
          result.push(cur.trim());
          return result;
        };

        const headers = tokenise(lines[0]);
        raw = lines.slice(1).map((line) => {
          const vals = tokenise(line);
          const row: Record<string, string> = {};
          headers.forEach((h, i) => { row[h] = vals[i] ?? ""; });
          return row;
        });

      } else {
        // ── XLSX / XLS binary ────────────────────────────────────────────────
        const XLSX = await import("xlsx");
        const buf  = await f.arrayBuffer();
        const wb   = XLSX.read(buf, { type: "array" });

        // Use Object.keys(Sheets) as fallback — more reliable than SheetNames
        const sheetKeys = Object.keys(wb.Sheets ?? {});
        const wsName = (wb.SheetNames?.[0]) || sheetKeys[0];
        if (!wsName || !wb.Sheets[wsName]) {
          setParseError("Could not read the Excel file — no sheets found.");
          return;
        }
        raw = XLSX.utils.sheet_to_json(wb.Sheets[wsName], { defval: "" }) as Record<string, any>[];
      }

      if (raw.length === 0) {
        setParseError("The file appears to be empty.");
        return;
      }

      // Flexible column lookup — case-insensitive, strips BOM from key names
      const get = (row: Record<string, any>, ...keys: string[]): string => {
        for (const k of keys) {
          const found = Object.keys(row).find(
            (rk) => rk.replace(/^\uFEFF/, "").trim().toLowerCase() === k.toLowerCase()
          );
          if (found !== undefined && row[found] !== "" && row[found] != null)
            return String(row[found]).trim();
        }
        return "";
      };

      const rows: ImportRow[] = raw.map((r) => ({
        id:           get(r, "Employee ID","employee_id","ID","emp_id") || undefined,
        nssf_number:  get(r, "NSSF Number","nssf_number","NSSF No.","NSSF") || undefined,
        kh_name:      get(r, "Name (Khmer)","kh_name","Khmer Name","Name KH") || undefined,
        nationality:  get(r, "Nationality","nationality") || undefined,
        gender:       get(r, "Gender","gender","Sex") || undefined,
        date_of_birth: (() => {
          const v = get(r, "Date of Birth","date_of_birth","DOB","DateOfBirth","Birthday");
          if (!v) return undefined;
          const d = new Date(v);
          return isNaN(d.getTime()) ? v : d.toISOString().slice(0, 10);
        })(),
        basic_salary: (() => {
          const v = get(r, "Basic Salary (USD)","basic_salary","Salary","Basic Salary");
          return v !== "" ? (Number(v) || undefined) : undefined;
        })(),
        _name: get(r, "Name (English)","Name","Full Name","English Name","first_name") || undefined,
      }));

      const validRows = rows.filter((r) => r.id || r.nssf_number);
      if (validRows.length === 0) {
        const firstRow = raw[0];
        const found = firstRow
          ? Object.keys(firstRow).map((k) => k.replace(/^\uFEFF/, "")).join(", ")
          : "(none)";
        setParseError(
          `No valid rows found. Columns detected: [${found}]. ` +
          `File must contain an "Employee ID" or "NSSF Number" column.`
        );
        return;
      }

      setPreview(validRows);
    } catch (err: any) {
      setParseError(`Parse error: ${err?.message ?? "Unknown error — please check the file format."}`);
    }
  }, []);




  const handleFileChange = (f: File | null) => {
    setFile(f);
    if (f) parseFile(f);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFileChange(f);
  };

  const handleSubmit = async () => {
    if (preview.length === 0) return;
    await onImport(preview);
    setFile(null);
    setPreview([]);
    onClose();
  };

  const downloadTemplate = async () => {
    const XLSX = await import("xlsx");
    const sampleData = [
      {
        "Employee ID": "EMP001",
        "NSSF Number": "NSS123456",
        "Name (English)": "John Doe",
        "Name (Khmer)": "ចន ដូ",
        Nationality: "Cambodian",
        Gender: "Male",
        "Date of Birth": "1990-01-15",
        "Basic Salary (USD)": 350,
      },
    ];
    const ws = XLSX.utils.json_to_sheet(sampleData);
    ws["!cols"] = EXPECTED_HEADERS.map(() => ({ wch: 20 }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "NSSF Import Template");
    XLSX.writeFile(wb, "nssf_import_template.xlsx");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#253C7D]/10 flex items-center justify-center">
              <i className="ri-upload-cloud-2-line text-[#253C7D] text-lg" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900">Import NSSF Data</h2>
              <p className="text-xs text-gray-500">Upload Excel or CSV file to update employee NSSF records</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer">
            <i className="ri-close-line text-gray-500 text-lg" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-6 space-y-4">
          {/* Template Download */}
          <div className="flex items-center justify-between bg-blue-50 border border-blue-100 rounded-xl p-3">
            <div className="flex items-center gap-2.5">
              <i className="ri-file-excel-2-line text-green-600 text-lg" />
              <div>
                <p className="text-xs font-semibold text-gray-800">Download Import Template</p>
                <p className="text-[11px] text-gray-500">Use this template to format your data correctly</p>
              </div>
            </div>
            <button
              onClick={downloadTemplate}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-xs font-semibold text-gray-700 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer shadow-xs"
            >
              <i className="ri-download-line" />
              Template
            </button>
          </div>

          {/* Required Columns */}
          <div className="bg-gray-50 rounded-xl border border-gray-200 p-3">
            <p className="text-[11px] font-bold text-gray-600 mb-2 uppercase tracking-wide">Required Columns</p>
            <div className="flex flex-wrap gap-1.5">
              {EXPECTED_HEADERS.map((h) => (
                <span key={h} className="text-[11px] bg-white border border-gray-200 text-gray-700 px-2 py-0.5 rounded-md font-medium">
                  {h}
                </span>
              ))}
            </div>
          </div>

          {/* Drop Zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
              dragOver ? "border-[#253C7D] bg-[#253C7D]/5" : "border-gray-200 hover:border-[#253C7D]/50 hover:bg-gray-50"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              className="hidden"
              onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
            />
            <div className="flex flex-col items-center gap-2">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${dragOver ? "bg-[#253C7D]/10" : "bg-gray-100"}`}>
                <i className={`ri-cloud-upload-line text-2xl ${dragOver ? "text-[#253C7D]" : "text-gray-400"}`} />
              </div>
              {file ? (
                <div>
                  <p className="text-sm font-semibold text-gray-800">{file.name}</p>
                  <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
              ) : (
                <div>
                  <p className="text-sm font-semibold text-gray-700">Drop file here or click to browse</p>
                  <p className="text-xs text-gray-400 mt-0.5">Supports .csv, .xlsx, .xls</p>
                </div>
              )}
            </div>
          </div>

          {/* Error */}
          {parseError && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3">
              <i className="ri-error-warning-line text-red-500 mt-0.5" />
              <p className="text-xs text-red-700">{parseError}</p>
            </div>
          )}

          {/* Preview Table */}
          {preview.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold text-gray-700">
                  Preview — {preview.length} row{preview.length !== 1 ? "s" : ""} ready to import
                </p>
                <span className="text-[11px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">
                  ✓ Valid
                </span>
              </div>
              <div className="overflow-x-auto border border-gray-200 rounded-xl">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-3 py-2 text-left font-semibold text-gray-600">Emp ID</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-600">NSSF No.</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-600">Name (KH)</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-600">Gender</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-600">DOB</th>
                      <th className="px-3 py-2 text-left font-semibold text-gray-600">Salary</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.slice(0, 8).map((r, i) => (
                      <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
                        <td className="px-3 py-1.5 text-gray-800 font-medium">{r.id || "—"}</td>
                        <td className="px-3 py-1.5 text-gray-600">{r.nssf_number || "—"}</td>
                        <td className="px-3 py-1.5 text-gray-600">{r.kh_name || "—"}</td>
                        <td className="px-3 py-1.5 text-gray-600">{r.gender || "—"}</td>
                        <td className="px-3 py-1.5 text-gray-600">{r.date_of_birth || "—"}</td>
                        <td className="px-3 py-1.5 text-gray-600">{r.basic_salary ?? "—"}</td>
                      </tr>
                    ))}
                    {preview.length > 8 && (
                      <tr>
                        <td colSpan={6} className="px-3 py-2 text-center text-gray-400 text-[11px]">
                          + {preview.length - 8} more rows
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-gray-100 bg-gray-50/50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={preview.length === 0 || saving}
            className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-[#253C7D] rounded-xl hover:bg-[#1e3167] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <i className="ri-check-line" />
                Import {preview.length > 0 ? `${preview.length} Records` : ""}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
