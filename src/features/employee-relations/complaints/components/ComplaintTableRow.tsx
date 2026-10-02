import { memo } from "react";
import type { ComplaintSuggestion, ComplaintStatus } from "../types";
import { COMPLAINT_TYPE_CONFIG, COMPLAINT_STATUS_CONFIG } from "../constants";

interface ComplaintTableRowProps {
  r: ComplaintSuggestion;
  onSelect: (item: ComplaintSuggestion) => void;
  onEdit: (record: ComplaintSuggestion) => void;
  onDelete: (id: string) => void;
  onUpdateStatus: (id: string, status: ComplaintStatus) => void;
  onPreview: (url: string, name: string) => void;
}

export const ComplaintTableRow = memo(function ComplaintTableRow({
  r,
  onSelect,
  onEdit,
  onDelete,
  onUpdateStatus,
  onPreview,
}: ComplaintTableRowProps) {
  const typeCfg = COMPLAINT_TYPE_CONFIG[r.type] ?? COMPLAINT_TYPE_CONFIG.complaint;
  const statusCfg = COMPLAINT_STATUS_CONFIG[r.status] ?? COMPLAINT_STATUS_CONFIG.pending;

  return (
    <tr className="hover:bg-gray-50/70 transition-colors group">
      <td className="px-5 py-3.5 whitespace-nowrap">
        <span className="text-xs font-semibold text-gray-800">{r.entry_date}</span>
      </td>

      <td className="px-4 py-3.5 whitespace-nowrap">
        <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${typeCfg.bg} ${typeCfg.text} ${typeCfg.border}`}>
          <i className={`${typeCfg.icon} text-[10px]`} />
          {typeCfg.label}
        </span>
      </td>

      <td className="px-4 py-3.5 whitespace-nowrap">
        <div className="flex items-center gap-1.5">
          <i className="ri-user-shared-line text-xs text-gray-400" />
          <span className="text-xs font-semibold text-gray-900">{r.target_to}</span>
        </div>
        {r.show_identity === false ? (
          <p className="text-[10px] text-amber-600 font-medium mt-0.5 flex items-center gap-1">
            <i className="ri-shield-user-line text-[11px]" />
            Anonymous
          </p>
        ) : r.employees ? (
          <p className="text-[10px] text-gray-400 mt-0.5">
            By: {r.employees.first_name} {r.employees.last_name}
          </p>
        ) : null}
      </td>

      <td className="px-4 py-3.5 max-w-64 cursor-pointer" onClick={() => onSelect(r)}>
        <p className="text-xs font-bold text-gray-900 truncate hover:text-[#0284c7]">
          {r.subject}
        </p>
        <p className="text-[11px] text-gray-500 line-clamp-1 mt-0.5">
          {r.details.replace(/<[^>]*>?/gm, "")}
        </p>
      </td>

      <td className="px-4 py-3.5 max-w-44">
        <p className="text-xs text-gray-600 truncate">
          {r.suggestion ? r.suggestion.replace(/<[^>]*>?/gm, "") : <span className="text-gray-300">—</span>}
        </p>
      </td>

      <td className="px-4 py-3.5 whitespace-nowrap">
        <div className="relative inline-block">
          <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}>
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

      <td className="px-4 py-3.5 max-w-44">
        <p className="text-xs text-gray-600 truncate">{r.remark || <span className="text-gray-300">—</span>}</p>
      </td>

      <td className="px-4 py-3.5 whitespace-nowrap">
        {r.attachment_url ? (
          <button
            type="button"
            onClick={() => onPreview(r.attachment_url!, r.attachment_name || "Attachment")}
            className="inline-flex items-center gap-1.5 text-xs text-sky-700 hover:text-sky-900 font-semibold py-1 px-2.5 rounded-lg bg-sky-50 hover:bg-sky-100 transition-colors cursor-pointer"
            title="Click to view file"
          >
            <i className="ri-attachment-line text-xs" />
            <span className="max-w-24 truncate">{r.attachment_name || "File"}</span>
          </button>
        ) : (
          <span className="text-xs text-gray-300">—</span>
        )}
      </td>

      <td className="px-4 py-3.5 whitespace-nowrap">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onSelect(r)}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-sky-600 hover:bg-sky-50 transition-colors cursor-pointer"
            title="View details"
          >
            <i className="ri-eye-line text-sm" />
          </button>
          <button
            onClick={() => onEdit(r)}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
            title="Edit entry"
          >
            <i className="ri-edit-line text-sm" />
          </button>
          <button
            onClick={() => onDelete(r.id)}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
            title="Delete"
          >
            <i className="ri-delete-bin-line text-sm" />
          </button>
        </div>
      </td>
    </tr>
  );
});
