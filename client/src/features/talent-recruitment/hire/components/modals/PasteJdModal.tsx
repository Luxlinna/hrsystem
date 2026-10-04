import { memo, useState } from "react";
import { heuristicExtractJd, type ExtractedJdData } from "../../utils/jdExtractor";
import { toast } from "@/components/Toast";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onApply: (data: ExtractedJdData) => void;
}

export const PasteJdModal = memo(function PasteJdModal({ isOpen, onClose, onApply }: Props) {
  const [text, setText] = useState("");

  if (!isOpen) return null;

  const handlePasteFromClipboard = async () => {
    try {
      const clipText = await navigator.clipboard.readText();
      if (clipText) setText(clipText);
    } catch {
      toast("Clipboard Access", "Please paste text using Ctrl+V / Cmd+V into the field.", "info");
    }
  };

  const handleProcess = () => {
    if (!text.trim()) {
      toast("Input Required", "Please paste the job description text first.", "warning");
      return;
    }
    const extracted = heuristicExtractJd(text);
    if (!extracted.job_summary && !extracted.responsibilities && !extracted.requirements) {
      toast("Warning", "Could not detect clear sections, but populated summary with the text.", "info");
    }
    onApply(extracted);
    setText("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 max-w-xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-[#172554] via-[#1e3a8a] to-[#253C7D] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-lg shadow-inner">
              <i className="ri-file-text-line" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">Paste Raw JD Text</h3>
              <p className="text-xs text-blue-100/80">Intelligent auto-parser detects Summary, Duties, and Skills</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <i className="ri-close-line text-lg" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 flex-1 overflow-y-auto space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-gray-700">Paste JD Text Below</label>
            <button
              type="button"
              onClick={handlePasteFromClipboard}
              className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer bg-blue-50 hover:bg-blue-100/80 px-2.5 py-1 rounded-lg border border-blue-200 transition-colors"
            >
              <i className="ri-clipboard-line" /> Paste Clipboard
            </button>
          </div>
          <textarea
            rows={11}
            autoFocus
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste Job Description content here... e.g.:&#10;&#10;Position: Senior Accountant&#10;Reports to: Finance Director&#10;&#10;Job Summary:&#10;Responsible for managing financial reporting and ledgers...&#10;&#10;Responsibilities:&#10;• Prepare monthly balance sheets&#10;• Coordinate audit reviews&#10;&#10;Requirements:&#10;• 3+ years experience in corporate finance"
            className="w-full p-3.5 bg-gray-50 rounded-2xl border border-gray-200 text-xs text-gray-800 placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#253C7D]/20 focus:border-[#253C7D] transition-all font-mono"
          />
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-200 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleProcess}
            className="px-5 py-2.5 rounded-xl bg-[#253C7D] hover:bg-[#1e3066] text-white text-xs font-extrabold shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer"
          >
            <i className="ri-magic-line text-amber-300" />
            <span>Auto-Fill Form</span>
          </button>
        </div>
      </div>
    </div>
  );
});
