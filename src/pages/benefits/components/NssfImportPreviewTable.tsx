import type { ImportRow } from "./nssfImportParser";

interface NssfImportPreviewTableProps {
  preview: ImportRow[];
}

export function NssfImportPreviewTable({ preview }: NssfImportPreviewTableProps) {
  if (preview.length === 0) return null;

  return (
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
  );
}
