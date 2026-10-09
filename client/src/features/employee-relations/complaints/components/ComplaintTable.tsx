import { memo, useState } from "react";
import type { ComplaintSuggestion, ComplaintStatus } from "../types";
import { ComplaintTableRow } from "./ComplaintTableRow";

interface ComplaintTableProps {
  records: ComplaintSuggestion[];
  loading: boolean;
  onSelect: (record: ComplaintSuggestion) => void;
  onEdit: (record: ComplaintSuggestion) => void;
  onDelete: (id: string) => void;
  onUpdateStatus: (id: string, status: ComplaintStatus) => void;
  onPreviewAttachment: (url: string, name: string) => void;
}

export const ComplaintTable = memo(function ComplaintTable({
  records,
  loading,
  onSelect,
  onEdit,
  onDelete,
  onUpdateStatus,
  onPreviewAttachment,
}: ComplaintTableProps) {
  const [sortField, setSortField] = useState<"entry_date" | "target_to" | null>("entry_date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const handleSort = (field: "entry_date" | "target_to") => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const sortedRecords = [...records].sort((a, b) => {
    if (!sortField) return 0;
    const valA = (a[sortField] || "").toLowerCase();
    const valB = (b[sortField] || "").toLowerCase();
    if (valA < valB) return sortDirection === "asc" ? -1 : 1;
    if (valA > valB) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  return (
    <div className="bg-white border-t border-slate-100 mt-2 min-h-[180px]">
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead className="bg-white border-b border-slate-200 text-slate-700 font-semibold text-[11.5px]">
            <tr>
              <th className="py-2.5 px-3 w-12 font-semibold">No.</th>
              <th
                onClick={() => handleSort("entry_date")}
                className="py-2.5 px-3 min-w-[110px] font-semibold cursor-pointer hover:text-[#253C7D] select-none"
              >
                <div className="flex items-center gap-1">
                  <span>Filing Date</span>
                  <i className="ri-arrow-up-down-line text-slate-400 text-xs" />
                </div>
              </th>
              <th className="py-2.5 px-3 min-w-[140px] font-semibold">Filed by</th>
              <th className="py-2.5 px-3 min-w-[180px] font-semibold">Subject</th>
              <th
                onClick={() => handleSort("target_to")}
                className="py-2.5 px-3 min-w-[180px] font-semibold cursor-pointer hover:text-[#253C7D] select-none"
              >
                <div className="flex items-center gap-1">
                  <span>Complaint/Suggestion To</span>
                  <i className="ri-arrow-up-down-line text-slate-400 text-xs" />
                </div>
              </th>
              <th className="py-2.5 px-3 min-w-[100px] font-semibold">Status</th>
              <th className="py-2.5 px-3 min-w-[150px] font-semibold">Comment</th>
              <th className="py-2.5 px-3 w-12 text-center select-none">
                <i className="ri-settings-3-line text-slate-400 text-sm" />
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {loading ? (
              <tr>
                <td colSpan={8} className="py-16 text-center text-xs text-slate-400">
                  <div className="w-6 h-6 border-2 border-[#253C7D] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  Loading records...
                </td>
              </tr>
            ) : sortedRecords.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-14 text-center text-sm font-bold text-slate-800">
                  No records found
                </td>
              </tr>
            ) : (
              sortedRecords.map((r, idx) => (
                <ComplaintTableRow
                  key={r.id}
                  r={r}
                  index={idx + 1}
                  onSelect={onSelect}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onUpdateStatus={onUpdateStatus}
                  onPreview={onPreviewAttachment}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
});
