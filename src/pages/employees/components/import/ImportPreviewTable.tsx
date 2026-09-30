import { memo } from "react";
import type { ParsedEmployeeRow } from "./types";

interface ImportPreviewTableProps {
  rows: ParsedEmployeeRow[];
}

export const ImportPreviewTable = memo(function ImportPreviewTable({
  rows,
}: ImportPreviewTableProps) {
  const validCount = rows.filter((r) => r.isValid).length;
  const invalidCount = rows.length - validCount;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-900/60 rounded border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            Total: <strong className="text-slate-900 dark:text-slate-100">{rows.length}</strong>
          </span>
          <span className="font-medium text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
            <i className="ri-checkbox-circle-fill text-xs" />
            Valid: <strong>{validCount}</strong>
          </span>
          {invalidCount > 0 && (
            <span className="font-medium text-rose-600 dark:text-rose-400 flex items-center gap-1">
              <i className="ri-error-warning-fill text-xs" />
              Errors: <strong>{invalidCount}</strong>
            </span>
          )}
        </div>
        <span className="text-[11px] text-slate-400">Previewing employee records</span>
      </div>

      <div className="border border-slate-200 dark:border-slate-700 rounded overflow-hidden">
        <div className="overflow-x-auto max-h-64">
          <table className="w-full text-left border-collapse text-[11px]">
            <thead className="bg-slate-100 dark:bg-slate-700/60 sticky top-0 z-10 text-slate-700 dark:text-slate-200 font-semibold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="p-2 whitespace-nowrap">Status</th>
                <th className="p-2 whitespace-nowrap">Row</th>
                <th className="p-2 whitespace-nowrap">Full Name</th>
                <th className="p-2 whitespace-nowrap">Khmer Name</th>
                <th className="p-2 whitespace-nowrap">Gender</th>
                <th className="p-2 whitespace-nowrap">Phone</th>
                <th className="p-2 whitespace-nowrap">Email</th>
                <th className="p-2 whitespace-nowrap">Business Unit</th>
                <th className="p-2 whitespace-nowrap">Site</th>
                <th className="p-2 whitespace-nowrap">Department</th>
                <th className="p-2 whitespace-nowrap">Position</th>
                <th className="p-2 whitespace-nowrap">Join Date</th>
                <th className="p-2 whitespace-nowrap">Basic Salary</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50 bg-white dark:bg-slate-800">
              {rows.map((r) => (
                <tr
                  key={r.rowNumber}
                  className={r.isValid ? "hover:bg-slate-50 dark:hover:bg-slate-700/40" : "bg-rose-50/40 dark:bg-rose-950/20"}
                >
                  <td className="p-2 whitespace-nowrap">
                    {r.isValid ? (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Ready
                      </span>
                    ) : (
                      <span
                        className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-rose-50 text-rose-700 border border-rose-200"
                        title={r.errors.join(", ")}
                      >
                        {r.errors[0]}
                      </span>
                    )}
                  </td>
                  <td className="p-2 text-slate-400 font-mono">#{r.rowNumber}</td>
                  <td className="p-2 font-semibold text-slate-800 dark:text-slate-100 whitespace-nowrap">{r.fullName}</td>
                  <td className="p-2 text-slate-600 dark:text-slate-300 whitespace-nowrap">{r.khName || "—"}</td>
                  <td className="p-2 text-slate-600 dark:text-slate-300 whitespace-nowrap">{r.gender}</td>
                  <td className="p-2 text-slate-600 dark:text-slate-300 whitespace-nowrap font-mono">{r.phone || "—"}</td>
                  <td className="p-2 text-slate-600 dark:text-slate-300 whitespace-nowrap">{r.email || "—"}</td>
                  <td className="p-2 text-slate-600 dark:text-slate-300 whitespace-nowrap">{r.buName || "—"}</td>
                  <td className="p-2 text-slate-600 dark:text-slate-300 whitespace-nowrap">{r.siteName || "—"}</td>
                  <td className="p-2 text-slate-600 dark:text-slate-300 whitespace-nowrap">{r.department || "—"}</td>
                  <td className="p-2 text-slate-600 dark:text-slate-300 whitespace-nowrap">{r.position || "—"}</td>
                  <td className="p-2 text-slate-600 dark:text-slate-300 whitespace-nowrap">{r.joinDate || "—"}</td>
                  <td className="p-2 text-slate-800 dark:text-slate-200 font-mono whitespace-nowrap">
                    {r.basicSalary != null ? `$${r.basicSalary}` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
});
