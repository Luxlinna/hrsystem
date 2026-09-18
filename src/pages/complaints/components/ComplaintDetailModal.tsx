import { memo } from "react";
import type { ComplaintSuggestion, ComplaintStatus } from "../types";
import { COMPLAINT_STATUS_CONFIG } from "../constants";
import { ComplaintDetailBody } from "./ComplaintDetailBody";
import { exportComplaintPdf } from "../exports/generateComplaintPdfHtml";

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
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/60 backdrop-blur-xs overflow-y-auto font-sans"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50/90 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#253C7D] text-white flex items-center justify-center text-lg font-bold shadow-xs shrink-0">
              <i className="ri-feedback-line" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-900">Complaint &amp; Suggestion Detail</h3>
                <span className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-bold border ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}>
                  {statusCfg.label}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                Filed on {item.entry_date} &bull; Recorded by {item.recorded_by || "HR Admin"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onUpdateStatus && (
              <div className="relative inline-block">
                <select
                  value={item.status}
                  onChange={(e) => onUpdateStatus(item.id, e.target.value as ComplaintStatus)}
                  className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 cursor-pointer focus:outline-none focus:border-sky-500"
                >
                  <option value="pending">Mark as Pending</option>
                  <option value="in_review">Mark as In Review</option>
                  <option value="resolved">Mark as Resolved</option>
                  <option value="dismissed">Mark as Dismissed</option>
                </select>
              </div>
            )}
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <i className="ri-close-line text-lg" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <ComplaintDetailBody item={item} onPreviewAttachment={onPreviewAttachment} />

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50/90 border-t border-slate-200 flex items-center justify-between shrink-0">
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
                className="px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
              >
                <i className="ri-delete-bin-line mr-1" />
                Delete
              </button>
            )}

            {onEdit && (
              <button
                type="button"
                onClick={() => {
                  onEdit(item);
                  onClose();
                }}
                className="px-3 py-1.5 text-xs font-semibold text-sky-700 hover:bg-sky-50 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
              >
                <i className="ri-edit-line" />
                Edit
              </button>
            )}

            <button
              type="button"
              onClick={handleExportPdf}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
            >
              <i className="ri-printer-line text-slate-500" />
              Print / Save PDF
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-white rounded-lg transition-colors cursor-pointer shadow-xs hover:opacity-95 bg-[#253C7D]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
});
