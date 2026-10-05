import { memo, useState, useEffect, useMemo } from "react";

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
  const [copySuccess, setCopySuccess] = useState(false);

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
      setCopySuccess(false);
      if (!resolvedUrl && rawText) {
        setActiveTab("text");
      } else {
        setActiveTab("visual");
      }
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

  const handleCopyText = () => {
    if (!rawText) return;
    navigator.clipboard.writeText(rawText);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

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
        {/* Modal Header */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-slate-900 via-slate-800 to-[#1E3064] text-white flex items-center justify-between gap-3 shrink-0 shadow-sm">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300 text-lg shrink-0">
              <i className={fileType === "image" ? "ri-image-line" : "ri-file-user-line"} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm font-bold text-white truncate max-w-[280px] sm:max-w-md">
                  {candidateName || "Candidate CV & Document"}
                </h2>
                {position && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/30 text-blue-200 border border-blue-400/40">
                    {position}
                  </span>
                )}
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  {fileType.toUpperCase()}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 truncate max-w-md mt-0.5">
                {resolvedName} {appliedDate ? `• Applied ${appliedDate}` : ""}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Tab switch if extracted text exists */}
            {rawText && (
              <div className="flex items-center bg-slate-800/80 rounded-lg p-0.5 border border-slate-700 mr-2">
                <button
                  type="button"
                  onClick={() => setActiveTab("visual")}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                    activeTab === "visual" ? "bg-blue-600 text-white shadow-xs" : "text-slate-300 hover:text-white"
                  }`}
                >
                  <i className="ri-file-line mr-1" /> Document
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("text")}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                    activeTab === "text" ? "bg-blue-600 text-white shadow-xs" : "text-slate-300 hover:text-white"
                  }`}
                >
                  <i className="ri-text mr-1" /> OCR Text
                </button>
              </div>
            )}

            {resolvedUrl && (
              <>
                <button
                  type="button"
                  onClick={handleDownload}
                  title="Download File"
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <i className="ri-download-2-line text-sm" />
                  <span className="hidden sm:inline">Download</span>
                </button>

                <button
                  type="button"
                  onClick={handleOpenExternal}
                  title="Open in new window"
                  className="p-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white transition-colors cursor-pointer"
                >
                  <i className="ri-external-link-line text-sm" />
                </button>
              </>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800/90 hover:bg-rose-600 border border-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer ml-1"
              title="Close (ESC)"
            >
              <i className="ri-close-line text-base" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 bg-slate-100 relative overflow-hidden flex flex-col">
          {activeTab === "visual" ? (
            <div className="flex-1 w-full h-full relative flex items-center justify-center p-2 sm:p-4 overflow-auto">
              {fileType === "pdf" && resolvedUrl ? (
                <iframe
                  src={`${resolvedUrl}#toolbar=1&navpanes=0`}
                  title={resolvedName}
                  className="w-full h-full bg-white rounded-xl shadow-inner border border-slate-300/80"
                />
              ) : fileType === "image" && resolvedUrl ? (
                <div className="w-full h-full flex flex-col items-center justify-center relative">
                  {/* Image Controls */}
                  <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-xs text-white px-2.5 py-1.5 rounded-xl shadow-lg border border-slate-700">
                    <button
                      type="button"
                      onClick={() => setImageScale((s) => Math.max(0.4, s - 0.2))}
                      className="w-6 h-6 rounded flex items-center justify-center hover:bg-slate-700 text-xs font-bold cursor-pointer"
                      title="Zoom Out"
                    >
                      <i className="ri-zoom-out-line" />
                    </button>
                    <span className="text-[10px] font-mono px-1 font-bold">{Math.round(imageScale * 100)}%</span>
                    <button
                      type="button"
                      onClick={() => setImageScale((s) => Math.min(3, s + 0.2))}
                      className="w-6 h-6 rounded flex items-center justify-center hover:bg-slate-700 text-xs font-bold cursor-pointer"
                      title="Zoom In"
                    >
                      <i className="ri-zoom-in-line" />
                    </button>
                    <div className="w-px h-3.5 bg-slate-700 mx-0.5" />
                    <button
                      type="button"
                      onClick={() => setImageRotate((r) => (r + 90) % 360)}
                      className="w-6 h-6 rounded flex items-center justify-center hover:bg-slate-700 text-xs cursor-pointer"
                      title="Rotate"
                    >
                      <i className="ri-refresh-line" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setImageScale(1);
                        setImageRotate(0);
                      }}
                      className="text-[10px] px-1.5 py-0.5 rounded hover:bg-slate-700 text-slate-300 font-bold cursor-pointer"
                      title="Reset"
                    >
                      Reset
                    </button>
                  </div>

                  <div className="overflow-auto max-w-full max-h-full flex items-center justify-center p-4">
                    <img
                      src={resolvedUrl}
                      alt="CV Document Preview"
                      style={{
                        transform: `scale(${imageScale}) rotate(${imageRotate}deg)`,
                        transition: "transform 0.15s ease-out",
                      }}
                      className="max-h-[70vh] max-w-full object-contain rounded-xl shadow-md border border-slate-300 bg-white"
                    />
                  </div>
                </div>
              ) : fileType === "docx" || fileType === "other" ? (
                <div className="max-w-md w-full bg-white p-8 rounded-2xl border border-slate-200 shadow-md text-center">
                  <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center text-3xl mx-auto mb-4">
                    <i className="ri-file-word-2-line" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">{resolvedName}</h3>
                  <p className="text-xs text-slate-500 mt-1 mb-5">
                    This document format (.docx / Office document) can be downloaded or opened externally in your Word / Office viewer.
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={handleDownload}
                      className="px-4 py-2 bg-[#253C7D] hover:bg-[#1E3064] text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <i className="ri-download-2-line" />
                      Download Word Document
                    </button>
                    {rawText && (
                      <button
                        type="button"
                        onClick={() => setActiveTab("text")}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-300 transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <i className="ri-text" />
                        View Extracted Text
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="max-w-md w-full bg-white p-8 rounded-2xl border border-slate-200 shadow-md text-center">
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center text-3xl mx-auto mb-4">
                    <i className="ri-file-unknow-line" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">Document Available</h3>
                  <p className="text-xs text-slate-500 mt-1 mb-5">{resolvedName}</p>
                  <button
                    type="button"
                    onClick={handleDownload}
                    className="px-4 py-2 bg-[#253C7D] hover:bg-[#1E3064] text-white font-bold text-xs rounded-xl shadow-sm transition-all inline-flex items-center gap-2 cursor-pointer"
                  >
                    <i className="ri-download-2-line" />
                    Download File
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 p-5 overflow-auto bg-slate-50 flex flex-col">
              <div className="flex items-center justify-between mb-3 bg-white px-4 py-2.5 rounded-xl border border-slate-200/90 shadow-2xs">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                  <i className="ri-file-text-line text-blue-600" />
                  <span>OCR & Extracted Plain Text</span>
                  <span className="text-[10px] text-slate-400 font-medium font-mono">
                    ({rawText?.length || 0} characters)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyText}
                  className="px-3 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <i className={copySuccess ? "ri-check-line text-emerald-600" : "ri-file-copy-line"} />
                  <span>{copySuccess ? "Copied!" : "Copy Full Text"}</span>
                </button>
              </div>

              <div className="flex-1 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs font-mono text-xs text-slate-800 leading-relaxed whitespace-pre-wrap select-text overflow-auto">
                {rawText || "No text could be extracted from this document."}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-2.5 bg-white border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <div className="flex items-center gap-2">
            <i className="ri-shield-check-line text-emerald-600 text-sm" />
            <span className="font-semibold text-slate-600">Super Admin & Recruiter Confidential CV Viewer</span>
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
