import React, { memo, useState } from "react";

interface WarningFileViewerModalProps {
  url: string | null;
  fileName: string | null;
  onClose: () => void;
}

export const WarningFileViewerModal = memo(function WarningFileViewerModal({
  url,
  fileName,
  onClose,
}: WarningFileViewerModalProps) {
  const [useGoogleFallback, setUseGoogleFallback] = useState(false);

  if (!url) return null;

  const cleanName = fileName || "Attachment Document";
  const ext = (cleanName.split(".").pop() || "").toLowerCase();

  const isImage = ["jpg", "jpeg", "png", "webp", "gif", "svg"].includes(ext);
  const isPdf = ext === "pdf";
  const isOffice = ["xls", "xlsx", "doc", "docx", "ppt", "pptx", "csv"].includes(ext);

  const getOfficeViewerUrl = (rawUrl: string) => {
    if (useGoogleFallback) {
      return `https://docs.google.com/viewer?url=${encodeURIComponent(rawUrl)}&embedded=true`;
    }
    return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(rawUrl)}`;
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-slate-950/75 backdrop-blur-sm overflow-hidden font-sans animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-5xl h-[88vh] shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-8 h-8 rounded-lg bg-[#253C7D] text-white flex items-center justify-center text-sm shrink-0 shadow-2xs">
              <i className={isImage ? "ri-image-line" : isPdf ? "ri-file-pdf-line" : "ri-file-text-line"} />
            </span>
            <div className="min-w-0">
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 truncate" title={cleanName}>
                {cleanName}
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                Document Preview &bull; {ext.toUpperCase() || "FILE"}
              </p>
            </div>
          </div>

          {/* Action Buttons: Save / Download while watching */}
          <div className="flex items-center gap-2 shrink-0">
            <a
              href={url}
              download={cleanName}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#0284c7] hover:bg-sky-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-xs"
              title="Save file to your computer"
            >
              <i className="ri-download-2-line text-sm" />
              <span>Save / Download</span>
            </a>

            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="w-8 h-8 rounded-lg border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-600 transition-colors cursor-pointer"
              title="Open in new browser tab"
            >
              <i className="ri-external-link-line text-sm" />
            </a>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
              title="Close viewer"
            >
              <i className="ri-close-line text-lg" />
            </button>
          </div>
        </div>

        {/* Content Viewer Body */}
        <div className="flex-1 bg-slate-100/60 overflow-auto flex items-center justify-center relative p-3 sm:p-5">
          {isImage ? (
            <img
              src={url}
              alt={cleanName}
              className="max-w-full max-h-full object-contain rounded shadow-md"
            />
          ) : isPdf ? (
            <iframe
              src={`${url}#toolbar=1`}
              title={cleanName}
              className="w-full h-full rounded border border-slate-200 bg-white"
            />
          ) : isOffice ? (
            <div className="w-full h-full flex flex-col">
              <div className="flex items-center justify-between pb-2 text-[11px] text-slate-500">
                <span>Online Document Viewer</span>
                <button
                  type="button"
                  onClick={() => setUseGoogleFallback(!useGoogleFallback)}
                  className="text-sky-600 hover:underline font-semibold cursor-pointer"
                >
                  Switch to {useGoogleFallback ? "Microsoft Viewer" : "Google Viewer"}
                </button>
              </div>
              <iframe
                src={getOfficeViewerUrl(url)}
                title={cleanName}
                className="w-full flex-1 rounded border border-slate-200 bg-white"
              />
            </div>
          ) : (
            <iframe
              src={url}
              title={cleanName}
              className="w-full h-full rounded border border-slate-200 bg-white"
            />
          )}
        </div>
      </div>
    </div>
  );
});
