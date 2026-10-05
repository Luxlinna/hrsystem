import { memo, useState } from "react";

interface CandidateCvOcrTextTabProps {
  rawText?: string | null;
}

export const CandidateCvOcrTextTab = memo(function CandidateCvOcrTextTab({
  rawText,
}: CandidateCvOcrTextTabProps) {
  const [copySuccess, setCopySuccess] = useState(false);

  const handleCopyText = () => {
    if (!rawText) return;
    navigator.clipboard.writeText(rawText);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  return (
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
  );
});
