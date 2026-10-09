import { memo, useState, useRef } from "react";
import type { ComplaintSuggestion, ComplaintStatus } from "../types";
import { COMPLAINT_STATUS_CONFIG } from "../constants";
import { formatDMY } from "@/features/workforce/employees/dateUtils";
import { formatKhmerFullName } from "@/features/workforce/employees/nameUtils";
import { ComplaintRowMenu } from "./ComplaintRowMenu";

interface ComplaintTableRowProps {
  r: ComplaintSuggestion;
  index: number;
  onSelect: (item: ComplaintSuggestion) => void;
  onEdit: (record: ComplaintSuggestion) => void;
  onDelete: (id: string) => void;
  onUpdateStatus: (id: string, status: ComplaintStatus) => void;
  onPreview: (url: string, name: string) => void;
}

export const ComplaintTableRow = memo(function ComplaintTableRow({
  r,
  index,
  onSelect,
  onEdit,
  onDelete,
  onUpdateStatus,
  onPreview,
}: ComplaintTableRowProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const statusCfg = COMPLAINT_STATUS_CONFIG[r.status] ?? COMPLAINT_STATUS_CONFIG.pending;

  const filedBy =
    r.show_identity === false
      ? "Anonymous"
      : r.employees
      ? formatKhmerFullName(r.employees) || "—"
      : "—";

  return (
    <tr className="hover:bg-slate-50/70 transition-colors group">
      {/* 1. No. */}
      <td className="py-2.5 px-3 text-slate-500 font-medium">{index}</td>

      {/* 2. Filing Date */}
      <td className="py-2.5 px-3 whitespace-nowrap text-slate-700 font-mono">
        {formatDMY(r.entry_date)}
      </td>

      {/* 3. Filed by */}
      <td className="py-2.5 px-3">
        <span className={`font-medium ${r.show_identity === false ? "text-amber-600 italic" : "text-slate-800"}`}>
          {filedBy}
        </span>
      </td>

      {/* 4. Subject */}
      <td className="py-2.5 px-3 max-w-[240px]">
        <button
          type="button"
          onClick={() => onSelect(r)}
          className="text-left font-medium text-slate-900 hover:text-[#253C7D] truncate block w-full cursor-pointer"
          title={r.subject}
        >
          {r.subject || "—"}
        </button>
      </td>

      {/* 5. Complaint/Suggestion To */}
      <td className="py-2.5 px-3 max-w-[200px] text-slate-700 truncate" title={r.target_to}>
        {r.target_to || "—"}
      </td>

      {/* 6. Status */}
      <td className="py-2.5 px-3 whitespace-nowrap">
        <div className="relative inline-block">
          <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}>
            <i className={`${statusCfg.icon} text-[10px]`} />
            {statusCfg.label}
          </span>
          <select
            value={r.status}
            onChange={(e) => onUpdateStatus(r.id, e.target.value as ComplaintStatus)}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            title="Change status"
          >
            <option value="pending">Pending Review</option>
            <option value="in_review">Under Review</option>
            <option value="resolved">Resolved</option>
            <option value="dismissed">Dismissed</option>
          </select>
        </div>
      </td>

      {/* 7. Comment */}
      <td className="py-2.5 px-3 max-w-[220px]">
        <span className="text-slate-600 truncate block" title={r.remark || r.details}>
          {r.remark || r.details?.replace(/<[^>]*>?/gm, "") || "—"}
        </span>
      </td>

      {/* 8. Settings Action Menu (Always Visible) */}
      <td className="py-2.5 px-3 text-center whitespace-nowrap w-14 relative" onClick={(e) => e.stopPropagation()}>
        <button
          ref={buttonRef}
          type="button"
          onClick={() => setMenuOpen(!menuOpen)}
          className={`h-6 w-11 rounded-[3px] inline-flex items-center justify-center gap-1 cursor-pointer transition-colors shadow-2xs ${
            menuOpen
              ? "bg-[#253C7D] text-white border border-[#253C7D]"
              : "bg-white text-[#253C7D] border border-[#253C7D] hover:bg-slate-50"
          }`}
          title="Row Options"
        >
          <i className="ri-settings-3-fill text-xs" />
          <i className="ri-arrow-down-s-line text-[11px]" />
        </button>

        <ComplaintRowMenu
          isOpen={menuOpen}
          onClose={() => setMenuOpen(false)}
          buttonRef={buttonRef}
          record={r}
          onView={onSelect}
          onEdit={onEdit}
          onDelete={onDelete}
          onPreview={onPreview}
        />
      </td>
    </tr>
  );
});
