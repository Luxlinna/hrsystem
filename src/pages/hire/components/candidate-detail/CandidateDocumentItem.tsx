import { memo, useState } from "react";
import type { Candidate, CandidateDocument, OfferLetter } from "../../types";
import { formatDateTime } from "../../hireUtils";
import {
  getFileIcon,
  formatFileSize,
  isOfferDocument,
  resolveOfferForDocument,
  openOfferDocumentPreview,
  downloadOfferDocument,
} from "../../utils/candidateDocumentUtils";
import { toast } from "@/components/Toast";

interface CandidateDocumentItemProps {
  doc: CandidateDocument;
  candidate: Candidate;
  activeOffer?: OfferLetter | null;
  onDeleteDocument?: (url: string) => void;
  onExportOfferPdf?: (offer: OfferLetter) => void;
  onExportOfferWord?: (offer: OfferLetter) => void;
}

export const CandidateDocumentItem = memo(function CandidateDocumentItem({
  doc,
  candidate,
  activeOffer,
  onDeleteDocument,
  onExportOfferPdf,
  onExportOfferWord,
}: CandidateDocumentItemProps) {
  const [loading, setLoading] = useState(false);
  const style = getFileIcon(doc.name, doc.type);
  const sizeLabel = formatFileSize(doc.size);
  const isOffer = isOfferDocument(doc);

  const handleView = async () => {
    setLoading(true);
    try {
      if (doc.url && !doc.url.startsWith("#") && !doc.url.startsWith("offer-")) {
        window.open(doc.url, "_blank", "noopener,noreferrer");
        return;
      }

      const offer = await resolveOfferForDocument(candidate, doc, activeOffer);
      if (!offer) {
        toast("Offer Not Found", "Could not locate offer record.", "error");
        return;
      }
      const success = openOfferDocumentPreview(offer, onExportOfferPdf);
      if (!success) {
        toast("Preview Failed", "Could not open document preview.", "error");
      }
    } catch (err) {
      console.error("handleView preview error:", err);
      toast("Error", "Could not preview offer document.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (format: "word" | "pdf") => {
    setLoading(true);
    try {
      const offer = await resolveOfferForDocument(candidate, doc, activeOffer);
      if (!offer) {
        toast("Offer Not Found", "Could not locate offer record.", "error");
        return;
      }
      await downloadOfferDocument(offer, format, onExportOfferWord, onExportOfferPdf);
    } catch {
      toast("Download Failed", "Failed to generate document.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-3.5 bg-gray-50/90 hover:bg-slate-50 rounded-2xl border border-gray-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        <div className={`w-10 h-10 rounded-xl ${style.bg} ${style.color} border ${style.border} flex items-center justify-center font-black text-lg shrink-0 shadow-2xs`}>
          <i className={isOffer ? "ri-file-shield-2-line text-blue-600" : style.icon} />
        </div>
        <div className="min-w-0">
          <h3 className="text-xs font-bold text-gray-900 truncate max-w-[280px] sm:max-w-md" title={doc.name}>
            {doc.name}
          </h3>
          <div className="flex items-center gap-2 text-[10px] text-gray-400 font-medium mt-0.5">
            {isOffer ? (
              <span className="text-blue-700 font-semibold bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200/50 flex items-center gap-1">
                <i className="ri-verified-badge-line text-blue-600" /> Digital Record
              </span>
            ) : (
              <span className="text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200/50">
                AWS S3
              </span>
            )}
            {isOffer ? <span>• Official Verified Document</span> : sizeLabel && <span>• {sizeLabel}</span>}
            {doc.uploaded_at && <span>• {formatDateTime(doc.uploaded_at)}</span>}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
        {isOffer ? (
          <>
            <button
              type="button"
              onClick={handleView}
              disabled={loading}
              className="px-3 py-1.5 bg-white hover:bg-blue-50 text-blue-800 border border-blue-200 text-xs font-bold rounded-xl shadow-2xs transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
              title="Preview offer letter with signatures"
            >
              {loading ? (
                <div className="w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              ) : (
                <i className="ri-eye-line text-xs text-blue-700" />
              )}
              <span>View</span>
            </button>
            <button
              type="button"
              onClick={() => handleDownload("word")}
              disabled={loading}
              className="px-3 py-1.5 bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 text-xs font-bold rounded-xl shadow-2xs transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
              title="Download Word (.docx)"
            >
              <i className="ri-file-word-line text-xs text-sky-600" />
              <span>Word</span>
            </button>
            <button
              type="button"
              onClick={() => handleDownload("pdf")}
              disabled={loading}
              className="px-2.5 py-1.5 bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold rounded-xl shadow-2xs transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
              title="Print or Save PDF"
            >
              <i className="ri-file-pdf-line text-xs text-rose-600" />
              <span>PDF</span>
            </button>
          </>
        ) : (
          <>
            <a
              href={doc.url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 text-xs font-bold rounded-xl shadow-2xs transition-colors flex items-center gap-1"
              title="Open document in new tab"
            >
              <i className="ri-eye-line text-xs text-[#253C7D]" /> View
            </a>
            <a
              href={doc.url}
              download={doc.name}
              className="px-3 py-1.5 bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 text-xs font-bold rounded-xl shadow-2xs transition-colors flex items-center gap-1"
              title="Download file"
            >
              <i className="ri-download-line text-xs text-gray-600" />
            </a>
          </>
        )}

        {onDeleteDocument && (
          <button
            type="button"
            onClick={() => {
              if (confirm(`Remove "${doc.name}" from candidate profile?`)) {
                onDeleteDocument(doc.url);
              }
            }}
            className="w-8 h-8 rounded-xl text-gray-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors cursor-pointer border border-transparent hover:border-rose-100"
            title="Delete document"
          >
            <i className="ri-delete-bin-line text-sm" />
          </button>
        )}
      </div>
    </div>
  );
});
