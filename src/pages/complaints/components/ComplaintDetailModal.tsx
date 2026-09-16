import { memo } from "react";
import type { ComplaintSuggestion } from "../types";
import { COMPLAINT_TYPE_CONFIG, COMPLAINT_STATUS_CONFIG } from "../constants";

interface ComplaintDetailModalProps {
  item: ComplaintSuggestion | null;
  onClose: () => void;
  onPreviewAttachment: (url: string, name: string) => void;
}

export const ComplaintDetailModal = memo(function ComplaintDetailModal({
  item,
  onClose,
  onPreviewAttachment,
}: ComplaintDetailModalProps) {
  if (!item) return null;

  const typeCfg = COMPLAINT_TYPE_CONFIG[item.type] ?? COMPLAINT_TYPE_CONFIG.complaint;
  const statusCfg = COMPLAINT_STATUS_CONFIG[item.status] ?? COMPLAINT_STATUS_CONFIG.pending;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(15,23,42,0.5)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl w-full max-w-lg shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-gray-100 pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${typeCfg.bg} ${typeCfg.text} ${typeCfg.border}`}>
                <i className={`${typeCfg.icon} text-[10px]`} />
                {typeCfg.label}
              </span>
              <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}>
                <i className={`${statusCfg.icon} text-[10px]`} />
                {statusCfg.label}
              </span>
            </div>
            <h3 className="text-base font-extrabold text-gray-900">{item.subject}</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Date: {item.entry_date} · To: {item.target_to}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 cursor-pointer"
          >
            <i className="ri-close-line text-lg" />
          </button>
        </div>

        <div>
          <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
            Details
          </label>
          <div
            className="text-xs text-gray-700 bg-gray-50 p-3 rounded-xl border border-gray-100 prose prose-xs max-w-none"
            dangerouslySetInnerHTML={{ __html: item.details }}
          />
        </div>

        {item.suggestion && (
          <div>
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
              Proposed Suggestion
            </label>
            <div
              className="text-xs text-gray-700 bg-amber-50/50 p-3 rounded-xl border border-amber-100 prose prose-xs max-w-none"
              dangerouslySetInnerHTML={{ __html: item.suggestion }}
            />
          </div>
        )}

        {item.remark && (
          <div>
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
              HR Remark / Action Notes
            </label>
            <p className="text-xs text-gray-700 whitespace-pre-wrap bg-blue-50/50 p-3 rounded-xl border border-blue-100">
              {item.remark}
            </p>
          </div>
        )}

        {item.attachment_url && (
          <div>
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
              Attached Document (AWS S3)
            </label>
            <button
              type="button"
              onClick={() => onPreviewAttachment(item.attachment_url!, item.attachment_name || "Attachment")}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-sky-50 text-sky-700 text-xs font-semibold hover:bg-sky-100 transition-colors cursor-pointer"
            >
              <i className="ri-eye-line text-sm" />
              {item.attachment_name || "View Attached File"}
            </button>
          </div>
        )}

        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
});
