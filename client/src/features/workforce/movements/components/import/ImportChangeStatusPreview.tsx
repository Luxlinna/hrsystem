import React from "react";
import type { ParsedMovementRow } from "./importChangeStatusParser";

interface ImportChangeStatusPreviewProps {
  fileName?: string;
  parsedRows: ParsedMovementRow[];
  validCount: number;
  invalidCount: number;
  onReset: () => void;
}

export const ImportChangeStatusPreview: React.FC<ImportChangeStatusPreviewProps> = ({
  fileName,
  parsedRows,
  validCount,
  invalidCount,
  onReset,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between bg-slate-50 p-3 rounded border border-slate-200">
        <div className="flex items-center gap-3">
          <span className="font-medium text-slate-700">File: {fileName}</span>
          <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold text-[11px]">
            ✓ {validCount} Ready to Import
          </span>
          {invalidCount > 0 && (
            <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-semibold text-[11px]">
              ⚠ {invalidCount} Skipped / Existing
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={onReset}
          className="text-slate-500 hover:text-slate-800 text-xs underline cursor-pointer"
        >
          Upload different file
        </button>
      </div>

      <div className="w-full overflow-x-auto border border-slate-200 max-h-[50vh]">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-100 sticky top-0 border-b border-slate-200 text-slate-700 font-semibold">
            <tr>
              <th className="py-2 px-2.5 w-10 text-center">No.</th>
              <th className="py-2 px-2.5">Validation</th>
              <th className="py-2 px-2.5">Effective Date</th>
              <th className="py-2 px-2.5">Status Type</th>
              <th className="py-2 px-2.5">Employee</th>
              <th className="py-2 px-2.5">Position</th>
              <th className="py-2 px-2.5">Division</th>
              <th className="py-2 px-2.5">Department</th>
              <th className="py-2 px-2.5">Contract</th>
              <th className="py-2 px-2.5">Rate</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {parsedRows.map((r) => (
              <tr
                key={r.rowNumber}
                className={`text-xs ${
                  r.isValid ? "hover:bg-slate-50" : r.isDuplicate ? "bg-amber-50/40 hover:bg-amber-50/60" : "bg-rose-50/50 hover:bg-rose-50"
                }`}
              >
                <td className="py-2 px-2.5 text-center text-slate-400">{r.rowNumber}</td>
                <td className="py-2 px-2.5">
                  {r.isValid ? (
                    <span className="text-emerald-600 font-semibold text-[11px] flex items-center gap-1">
                      <i className="ri-checkbox-circle-fill" />
                      Ready
                    </span>
                  ) : r.isDuplicate ? (
                    <span className="text-amber-600 font-semibold text-[11px] flex items-center gap-1" title="Record already exists">
                      <i className="ri-time-line" />
                      Already Exists
                    </span>
                  ) : (
                    <span
                      className="text-rose-600 font-semibold text-[11px] flex items-center gap-1"
                      title={r.errors.join("; ")}
                    >
                      <i className="ri-error-warning-fill" />
                      {r.errors[0]}
                    </span>
                  )}
                </td>
                <td className="py-2 px-2.5 whitespace-nowrap">{r.effectiveDate}</td>
                <td className="py-2 px-2.5 whitespace-nowrap font-medium">{r.statusType}</td>
                <td className="py-2 px-2.5">
                  <p className="font-semibold text-slate-800">{r.employeeName}</p>
                  <span className="text-[10px] text-slate-400 font-mono">{r.employeeCode}</span>
                </td>
                <td className="py-2 px-2.5">{r.position}</td>
                <td className="py-2 px-2.5">{r.division}</td>
                <td className="py-2 px-2.5 font-medium">{r.department}</td>
                <td className="py-2 px-2.5">{r.contractType}</td>
                <td className="py-2 px-2.5 font-mono">{r.rate || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
