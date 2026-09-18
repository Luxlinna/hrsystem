import React, { memo, useState } from "react";

interface ComplaintFormActionsProps {
  saving: boolean;
  onDiscard: () => void;
  onSaveAndClose: () => void;
}

export const ComplaintFormActions = memo(function ComplaintFormActions({
  saving,
  onDiscard,
  onSaveAndClose,
}: ComplaintFormActionsProps) {
  const [saveMenuOpen, setSaveMenuOpen] = useState(false);

  return (
    <div className="pt-4 flex items-center gap-2">
      <div className="relative inline-flex rounded shadow-xs">
        <button
          type="submit"
          disabled={saving}
          className="px-3.5 py-1.5 text-xs font-medium text-white bg-[#0284c7] hover:bg-sky-700 rounded-l flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors"
        >
          <i className="ri-save-line text-sm" />
          <span>{saving ? "Saving..." : "Save"}</span>
        </button>

        <button
          type="button"
          onClick={() => setSaveMenuOpen(!saveMenuOpen)}
          disabled={saving}
          className="px-2 py-1.5 text-xs text-white bg-sky-700 hover:bg-sky-800 rounded-r border-l border-sky-500 cursor-pointer flex items-center transition-colors"
        >
          <i className="ri-arrow-down-s-fill text-xs" />
        </button>

        {saveMenuOpen && (
          <div className="absolute left-0 bottom-full mb-1 w-36 bg-white border border-slate-200 rounded shadow-lg py-1 z-20 text-xs animate-in fade-in zoom-in-95 duration-100">
            <button
              type="button"
              onClick={() => {
                setSaveMenuOpen(false);
                onSaveAndClose();
              }}
              className="w-full text-left px-3 py-1.5 hover:bg-slate-50 text-slate-700 cursor-pointer flex items-center gap-1.5"
            >
              <i className="ri-check-line text-xs text-slate-500" />
              Save &amp; Close
            </button>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={onDiscard}
        disabled={saving}
        className="px-3.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-200 hover:bg-slate-300 rounded transition-colors cursor-pointer flex items-center gap-1.5"
      >
        <i className="ri-close-line text-sm" />
        <span>Discard</span>
      </button>
    </div>
  );
});
