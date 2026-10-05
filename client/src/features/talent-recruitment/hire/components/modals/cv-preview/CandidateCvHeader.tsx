import { memo } from "react";

interface CandidateCvHeaderProps {
  candidateName?: string;
  position?: string;
  appliedDate?: string;
  resolvedName: string;
  fileType: string;
  activeTab: "visual" | "text";
  setActiveTab: (tab: "visual" | "text") => void;
  rawText?: string | null;
  resolvedUrl: string;
  onDownload: () => void;
  onOpenExternal: () => void;
  onClose: () => void;
}

export const CandidateCvHeader = memo(function CandidateCvHeader({
  candidateName,
  position,
  appliedDate,
  resolvedName,
  fileType,
  activeTab,
  setActiveTab,
  rawText,
  resolvedUrl,
  onDownload,
  onOpenExternal,
  onClose,
}: CandidateCvHeaderProps) {
  return (
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

      <div className="flex items-center gap-1.5 shrink-0">
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
              onClick={onDownload}
              title="Download File"
              className="px-2.5 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <i className="ri-download-2-line text-sm" />
              <span className="hidden sm:inline">Download</span>
            </button>
            <button
              type="button"
              onClick={onOpenExternal}
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
  );
});
