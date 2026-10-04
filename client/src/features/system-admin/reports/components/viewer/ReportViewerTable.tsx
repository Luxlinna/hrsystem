import { memo } from "react";
import type { ReportRow } from "../../types";
import { cellValue } from "../../reportsUtils";
import { STATUS_COLOR } from "../../constants";

interface ReportViewerTableProps {
  columns: string[];
  pagedRows: ReportRow[];
  density: "comfortable" | "compact";
}

export const ReportViewerTable = memo(function ReportViewerTable({
  columns,
  pagedRows,
  density,
}: ReportViewerTableProps) {
  const py = density === "compact" ? "py-2" : "py-3";

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs border-collapse">
        <thead>
          <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
            {columns.map((c) => (
              <th key={c} className={`px-4 ${py} whitespace-nowrap`}>
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
          {pagedRows.map((row, idx) => {
            const rowKey = (row as any).id ? `${(row as any).id}-${idx}` : `row-${idx}`;
            const isDeletedRow =
              (row as any).status === "deleted" || Boolean((row as any).deleted_at);

            return (
              <tr
                key={rowKey}
                className={`hover:bg-slate-50/80 transition-colors ${
                  isDeletedRow ? "bg-rose-50/30" : ""
                }`}
              >
                {columns.map((col) => {
                  const val = cellValue(row, col);
                  const isStatusCol = col === "Status";

                  if (isStatusCol) {
                    const st = String(val || "").toLowerCase();
                    const badgeClass =
                      STATUS_COLOR[st] || "bg-slate-100 text-slate-600 border border-slate-200";
                    return (
                      <td key={col} className={`px-4 ${py} whitespace-nowrap`}>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${badgeClass}`}
                        >
                          {String(val || "—")}
                        </span>
                      </td>
                    );
                  }

                  const rawStr = String(val ?? "").trim();
                  if (rawStr.includes("(Open / Needs Staff)") || rawStr === "Needs Staff") {
                    return (
                      <td key={col} className={`px-4 ${py} whitespace-nowrap`}>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          <i className="ri-user-unfollow-line text-xs text-amber-500" />
                          <span>Open Slot</span>
                        </span>
                      </td>
                    );
                  }

                  if (val === undefined || val === null || val === "" || val === "—") {
                    return (
                      <td key={col} className={`px-4 ${py} whitespace-nowrap text-slate-300 font-normal`}>
                        —
                      </td>
                    );
                  }

                  let display = String(val);
                  if (
                    typeof val === "number" &&
                    (col.includes("Salary") ||
                      col.includes("Pay") ||
                      col.includes("Bonus") ||
                      col.includes("Deduct") ||
                      col === "Amount")
                  ) {
                    display = `$${Number(val).toLocaleString()}`;
                  }

                  return (
                    <td
                      key={col}
                      className={`px-4 ${py} whitespace-nowrap text-slate-800 ${
                        col === "Employee" || col === "Candidate" || col === "Task Name"
                          ? "font-semibold text-slate-900"
                          : ""
                      }`}
                    >
                      {display}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
});
