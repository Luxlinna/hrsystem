import { memo, useState, useEffect, useMemo } from "react";
import { CandidateCvHeader } from "./cv-preview/CandidateCvHeader";
import { CandidateCvVisualViewer } from "./cv-preview/CandidateCvVisualViewer";
import { CandidateCvOcrTextTab } from "./cv-preview/CandidateCvOcrTextTab";

export interface CandidateCvPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidateName?: string;
  position?: string;
  appliedDate?: string;
  fileUrl?: string | null;
  fileName?: string;
  fileObj?: File | null;
  rawText?: string | null;
}

export const CandidateCvPreviewModal = memo(function CandidateCvPreviewModal({
  isOpen,
  onClose,
  candidateName,
  position,
  appliedDate,
  fileUrl,
  fileName,
  fileObj,
  rawText,
}: CandidateCvPreviewModalProps) {
  const [activeTab, setActiveTab] = useState<"visual" | "text">("visual");
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [imageScale, setImageScale] = useState(1);
  const [imageRotate, setImageRotate] = useState(0);

  // Manage object URL for local File instances
  useEffect(() => {
    if (fileObj) {
      const url = URL.createObjectURL(fileObj);
      setBlobUrl(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    } else {
      setBlobUrl(null);
    }
  }, [fileObj]);

  const resolvedUrl = blobUrl || fileUrl || "";
  const resolvedName = fileName || fileObj?.name || (candidateName ? `${candidateName}_CV` : "Candidate_CV.pdf");

  const fileType = useMemo(() => {
    const extMatch = resolvedName.match(/\.([a-zA-Z0-9]+)(\?.*)?$/);
    const ext = extMatch ? extMatch[1].toLowerCase() : "";
    if (["pdf"].includes(ext)) return "pdf";
    if (["png", "jpg", "jpeg", "webp", "gif", "bmp"].includes(ext)) return "image";
    if (["docx", "doc", "rtf", "odt"].includes(ext)) return "docx";
    if (["txt", "md", "csv"].includes(ext)) return "text";
    return "other";
  }, [resolvedName]);

  // Reset view state when opening a new document
  useEffect(() => {
    if (isOpen) {
      setImageScale(1);
      setImageRotate(0);
      setActiveTab(!resolvedUrl && rawText ? "text" : "visual");
    }
  }, [isOpen, resolvedUrl, rawText]);

  // Handle ESC key to close modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleDownload = () => {
    if (!resolvedUrl) return;
    const a = document.createElement("a");
    a.href = resolvedUrl;
    a.download = resolvedName;
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleOpenExternal = () => {
    if (resolvedUrl) {
      window.open(resolvedUrl, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl h-[88vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <CandidateCvHeader
          candidateName={candidateName}
          position={position}
          appliedDate={appliedDate}
          resolvedName={resolvedName}
          fileType={fileType}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          rawText={rawText}
          resolvedUrl={resolvedUrl}
          onDownload={handleDownload}
          onOpenExternal={handleOpenExternal}
          onClose={onClose}
        />

        <div className="flex-1 bg-slate-100 relative overflow-hidden flex flex-col">
          {activeTab === "visual" ? (
            <CandidateCvVisualViewer
              fileType={fileType}
              resolvedUrl={resolvedUrl}
              resolvedName={resolvedName}
              imageScale={imageScale}
              imageRotate={imageRotate}
              setImageScale={setImageScale}
              setImageRotate={setImageRotate}
              onDownload={handleDownload}
              onViewText={() => setActiveTab("text")}
              rawText={rawText}
            />
          ) : (
            <CandidateCvOcrTextTab rawText={rawText} />
          )}
        </div>

        <div className="px-5 py-2.5 bg-white border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <div className="flex items-center gap-2">
            <i className="ri-shield-check-line text-emerald-600 text-sm" />
            <span className="font-semibold text-slate-600">Super Admin &amp; Recruiter Confidential CV Viewer</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 text-xs transition-colors cursor-pointer"
          >
            Close Viewer
          </button>
        </div>
      </div>
    </div>
  );
});
