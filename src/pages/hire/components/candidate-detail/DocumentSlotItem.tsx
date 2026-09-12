import { memo, useRef, useState } from "react";
import type { CandidateDocument, DocumentVerificationStatus } from "../../types";
import type { DocumentSlotConfig } from "../../constants/documentPortalConfig";
import { DOCUMENT_STATUS_CONFIG, getDocumentVerificationStatus } from "../../constants/documentStatusConfig";
import { formatDateTime } from "../../hireUtils";
import { formatFileSize } from "../../utils/candidateDocumentUtils";
import { RejectDocumentModal } from "./RejectDocumentModal";

interface DocumentSlotItemProps {
  slot: DocumentSlotConfig;
  doc?: CandidateDocument;
  onUpload: (slot: DocumentSlotConfig, file: File) => Promise<void>;
  onDelete: (url: string) => void;
  onUpdateStatus?: (slotKey: string, status: DocumentVerificationStatus, reason?: string) => Promise<void>;
}

export const DocumentSlotItem = memo(function DocumentSlotItem({
  slot,
  doc,
  onUpload,
  onDelete,
  onUpdateStatus,
}: DocumentSlotItemProps) {
  const [uploading, setUploading] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const status = getDocumentVerificationStatus(doc);
  const statusMeta = DOCUMENT_STATUS_CONFIG[status];
  const isUploaded = Boolean(doc?.url);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await onUpload(slot, file);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleVerify = () => onUpdateStatus?.(slot.key, "verified");
  const handleUnderReview = () => onUpdateStatus?.(slot.key, "under_review");
  const handleConfirmReject = async (reason: string) => {
    setRejectModalOpen(false);
    await onUpdateStatus?.(slot.key, "rejected", reason);
  };

  return (
    <div
      className={`p-4 rounded-2xl border transition-all ${
        status === "verified"
          ? "bg-emerald-50/40 border-emerald-200/80 shadow-2xs"
          : status === "rejected"
          ? "bg-rose-50/30 border-rose-200/80 shadow-2xs"
          : isUploaded
          ? "bg-blue-50/20 border-blue-200/60"
          : "bg-white border-gray-200/80 hover:border-gray-300"
      }`}
    >
      <input ref={fileInputRef} type="file" accept={slot.accept} onChange={handleFileChange} className="hidden" />

      {/* Header with Slot Title and Status Pill */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-9 h-9 rounded-xl ${slot.bg} ${slot.color} border ${slot.border} flex items-center justify-center font-black text-base shrink-0`}>
            <i className={slot.icon} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-xs font-bold text-gray-900 truncate">{slot.title}</h4>
              <span className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded border ${slot.required ? "text-rose-700 bg-rose-50 border-rose-200" : "text-gray-500 bg-gray-100 border-gray-200"}`}>
                {slot.required ? "Required" : "Optional"}
              </span>
            </div>
            <p className="text-[11px] text-gray-500 truncate mt-0.5">{slot.subtitle}</p>
          </div>
        </div>

        {/* 10.2 Document Status Badge */}
        <span className={`shrink-0 inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-lg border ${statusMeta.badgeBg}`}>
          <i className={`${statusMeta.icon} text-xs`} />
          {statusMeta.label}
        </span>
      </div>

      {/* Rejection Reason Banner & Re-upload Callout */}
      {status === "rejected" && doc?.rejection_reason && (
        <div className="mb-2.5 p-2 rounded-xl bg-rose-50 border border-rose-200/80 text-rose-800 text-[11px] flex items-start gap-1.5">
          <i className="ri-error-warning-fill text-rose-600 mt-0.5 shrink-0" />
          <div className="min-w-0 flex-1">
            <strong className="font-semibold">Rejection Reason:</strong> {doc.rejection_reason}
          </div>
        </div>
      )}

      {/* Uploaded File Details & Actions */}
      {isUploaded && doc ? (
        <div className="pt-2 mt-2 border-t border-gray-100/80 flex flex-col gap-2">
          <div className="flex items-center justify-between min-w-0">
            <p className="text-xs font-bold text-gray-800 truncate" title={doc.name}>
              {doc.name}
            </p>
            <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-medium shrink-0 ml-2">
              {doc.size && <span>{formatFileSize(doc.size)}</span>}
              {doc.uploaded_at && <span>• {formatDateTime(doc.uploaded_at)}</span>}
            </div>
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between gap-1 flex-wrap pt-1">
            {/* View / Download / Replace */}
            <div className="flex items-center gap-1">
              <a href={doc.url} target="_blank" rel="noopener noreferrer" className="px-2 py-1 bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 text-xs font-bold rounded-lg transition-colors flex items-center gap-1" title="View document">
                <i className="ri-eye-line text-xs text-[#253C7D]" />
                <span>View</span>
              </a>
              <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="px-2 py-1 bg-white hover:bg-blue-50 text-blue-800 border border-blue-200 text-xs font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50">
                <i className="ri-refresh-line text-xs text-blue-600" />
                <span>{status === "rejected" ? "Re-upload" : "Replace"}</span>
              </button>
              <button type="button" onClick={() => confirm(`Remove "${slot.title}"?`) && onDelete(doc.url)} className="w-6 h-6 text-gray-400 hover:text-rose-600 rounded-lg flex items-center justify-center transition-colors cursor-pointer" title="Delete document">
                <i className="ri-delete-bin-line text-xs" />
              </button>
            </div>

            {/* HR Review Status Controls */}
            {onUpdateStatus && (
              <div className="flex items-center gap-1">
                {status !== "verified" && (
                  <button type="button" onClick={handleVerify} className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1">
                    <i className="ri-check-line text-xs text-emerald-600" />
                    <span>Verify</span>
                  </button>
                )}
                {status !== "under_review" && status !== "verified" && (
                  <button type="button" onClick={handleUnderReview} className="px-2 py-1 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 text-xs font-bold rounded-lg transition-colors cursor-pointer">
                    Review
                  </button>
                )}
                {status !== "rejected" && (
                  <button type="button" onClick={() => setRejectModalOpen(true)} className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1">
                    <i className="ri-close-line text-xs text-rose-600" />
                    <span>Reject</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="pt-2">
          <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="w-full py-2 bg-slate-50 hover:bg-blue-50/70 border border-dashed border-gray-300 hover:border-blue-400 text-gray-700 hover:text-[#253C7D] rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50">
            {uploading ? (
              <div className="w-3.5 h-3.5 border-2 border-[#253C7D] border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <i className="ri-upload-cloud-2-line text-sm text-[#253C7D]" />
                <span>Upload {slot.title}</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Rejection Reason Modal */}
      <RejectDocumentModal
        isOpen={rejectModalOpen}
        slotTitle={slot.title}
        onClose={() => setRejectModalOpen(false)}
        onConfirmReject={handleConfirmReject}
      />
    </div>
  );
});
