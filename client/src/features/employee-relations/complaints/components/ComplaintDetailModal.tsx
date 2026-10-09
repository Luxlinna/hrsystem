import { memo } from "react";
import type { ComplaintSuggestion, ComplaintStatus } from "../types";
import { COMPLAINT_STATUS_CONFIG } from "../constants";
import { ComplaintDetailBody } from "./ComplaintDetailBody";
import { exportComplaintPdf } from "../exports/generateComplaintPdfHtml";
import { formatDMY } from "@/features/workforce/employees/dateUtils";

interface ComplaintDetailModalProps {
  item: ComplaintSuggestion | null;
  onClose: () => void;
  onEdit?: (record: ComplaintSuggestion) => void;
  onDelete?: (id: string) => void;
  onUpdateStatus?: (id: string, status: ComplaintStatus) => void;
  onPreviewAttachment: (url: string, name: string) => void;
}

export const ComplaintDetailModal = memo(function ComplaintDetailModal({
  item,
  onClose,
  onEdit,
  onDelete,
  onUpdateStatus,
  onPreviewAttachment,
}: ComplaintDetailModalProps) {
  if (!item) return null;

  const statusCfg = COMPLAINT_STATUS_CONFIG[item.status] ?? COMPLAINT_STATUS_CONFIG.pending;

  const handleExportPdf = () => {
    exportComplaintPdf(item);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/60 backdrop-blur-xs overflow-y-auto font-sans text-xs"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-5xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-3.5 bg-white border-b border-slate-200/90 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#253C7D] text-white flex items-center justify-center text-sm font-bold shadow-xs shrink-0">
              <i className="ri-chat-3-line" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">Complaint &amp; Suggestion Detail</h3>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}>
                  {statusCfg.label}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                Filed on {formatDMY(item.entry_date)} &bull; Recorded by {item.recorded_by || "HR Admin"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {onUpdateStatus && (
              <div className="relative inline-flex items-center border border-slate-300 rounded-lg px-2 py-1 bg-white text-slate-700 text-[11px] shadow-2xs hover:border-slate-400">
                <i className="ri-time-line text-slate-500 mr-1 text-[11px]" />
                <select
                  value={item.status}
                  onChange={(e) => onUpdateStatus(item.id, e.target.value as ComplaintStatus)}
                  className="bg-transparent text-[11px] font-medium text-slate-700 cursor-pointer focus:outline-none pr-3"
                >
                  <option value="pending">Mark as Pending</option>
                  <option value="in_review">Mark as In Review</option>
                  <option value="resolved">Mark as Resolved</option>
                  <option value="dismissed">Mark as Dismissed</option>
                </select>
                <i className="ri-arrow-down-s-line text-[10px] text-slate-400 absolute right-1.5 pointer-events-none" />
              </div>
            )}
            <button
              type="button"
              onClick={onClose}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <i className="ri-close-line text-base" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <ComplaintDetailBody item={item} onPreviewAttachment={onPreviewAttachment} />

        {/* Footer */}
        <div className="px-5 py-3 bg-white border-t border-slate-200/90 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            {onDelete && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm("Are you sure you want to delete this record?")) {
                    onDelete(item.id);
                    onClose();
                  }
                }}
                className="px-2.5 py-1 text-[11px] font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
              >
                <i className="ri-delete-bin-line text-xs" />
                <span>Delete</span>
              </button>
            )}

            {onEdit && (
              <button
                type="button"
                onClick={() => {
                  onEdit(item);
                  onClose();
                }}
                className="px-2.5 py-1 text-[11px] font-semibold text-sky-600 hover:bg-sky-50 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
              >
                <i className="ri-edit-line text-xs" />
                <span>Edit</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleExportPdf}
              className="px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
            >
              <i className="ri-printer-line text-slate-500 text-xs" />
              <span>Print / Save PDF</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-1.5 text-[11px] font-bold text-white rounded-lg transition-colors cursor-pointer shadow-xs bg-[#253C7D] hover:bg-[#1E3066]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
});
