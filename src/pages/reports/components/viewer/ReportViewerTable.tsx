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
          <tr className="bg-gray-50 border-b border-gray-100 text-gray-400 font-bold uppercase tracking-wider text-[10px]">
            {columns.map((c) => (
              <th key={c} className={`px-4 ${py} whitespace-nowrap`}>
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50 text-gray-700 font-medium">
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
                      STATUS_COLOR[st] || "bg-gray-100 text-gray-600 border border-gray-200/70";
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

                  let display = val !== undefined && val !== null && val !== "" ? String(val) : "—";
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
                      className={`px-4 ${py} whitespace-nowrap text-gray-800 ${
                        col === "Employee" || col === "Candidate" || col === "Task Name"
                          ? "font-bold text-gray-900"
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
