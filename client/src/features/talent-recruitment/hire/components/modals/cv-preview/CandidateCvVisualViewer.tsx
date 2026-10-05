import { memo } from "react";

interface CandidateCvVisualViewerProps {
  fileType: string;
  resolvedUrl: string;
  resolvedName: string;
  imageScale: number;
  imageRotate: number;
  setImageScale: React.Dispatch<React.SetStateAction<number>>;
  setImageRotate: React.Dispatch<React.SetStateAction<number>>;
  onDownload: () => void;
  onViewText?: () => void;
  rawText?: string | null;
}

export const CandidateCvVisualViewer = memo(function CandidateCvVisualViewer({
  fileType,
  resolvedUrl,
  resolvedName,
  imageScale,
  imageRotate,
  setImageScale,
  setImageRotate,
  onDownload,
  onViewText,
  rawText,
}: CandidateCvVisualViewerProps) {
  return (
    <div className="flex-1 w-full h-full relative flex items-center justify-center p-2 sm:p-4 overflow-auto">
      {fileType === "pdf" && resolvedUrl ? (
        <iframe
          src={`${resolvedUrl}#toolbar=1&navpanes=0`}
          title={resolvedName}
          className="w-full h-full bg-white rounded-xl shadow-inner border border-slate-300/80"
        />
      ) : fileType === "image" && resolvedUrl ? (
        <div className="w-full h-full flex flex-col items-center justify-center relative">
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
              onClick={onDownload}
              className="px-4 py-2 bg-[#253C7D] hover:bg-[#1E3064] text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center gap-2 cursor-pointer"
            >
              <i className="ri-download-2-line" />
              Download Word Document
            </button>
            {rawText && onViewText && (
              <button
                type="button"
                onClick={onViewText}
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
            onClick={onDownload}
            className="px-4 py-2 bg-[#253C7D] hover:bg-[#1E3064] text-white font-bold text-xs rounded-xl shadow-sm transition-all inline-flex items-center gap-2 cursor-pointer"
          >
            <i className="ri-download-2-line" />
            Download File
          </button>
        </div>
      )}
    </div>
  );
});
