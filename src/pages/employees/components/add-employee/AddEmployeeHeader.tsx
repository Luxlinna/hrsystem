import { memo } from "react";

interface AddEmployeeHeaderProps {
  onClose: () => void;
  isEdit?: boolean;
  autoSaveEnabled?: boolean;
  onToggleAutoSave?: (enabled: boolean) => void;
  autoSaveStatus?: "idle" | "saving" | "saved" | "error";
  lastSavedAt?: Date | null;
  onClearDraft?: () => void;
}

export const AddEmployeeHeader = memo(function AddEmployeeHeader({
  onClose,
  isEdit = false,
  autoSaveEnabled = true,
  onToggleAutoSave,
  autoSaveStatus = "idle",
  lastSavedAt,
  onClearDraft,
}: AddEmployeeHeaderProps) {
  return (
    <div className="flex items-center justify-between px-6 sm:px-8 py-3.5 border-b border-slate-200 bg-white">
      <div className="flex items-center gap-4">
        <h1 className="text-base sm:text-lg font-normal text-slate-700 tracking-tight">
          {isEdit ? "Edit Employee" : "Create Employee"}
        </h1>

        {/* Auto-Save Status & Controls for Create & Edit Mode */}
        <div className="flex items-center gap-2">
          {autoSaveStatus === "saving" && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-[11px] font-medium text-amber-700 animate-pulse">
              <i className="ri-loader-4-line animate-spin text-xs" />
              <span>Saving draft...</span>
            </span>
          )}

          {autoSaveStatus !== "saving" && lastSavedAt && (
            <span
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-medium text-emerald-700"
              title={`Last auto-saved at ${lastSavedAt.toLocaleTimeString()}`}
            >
              <i className="ri-check-line text-xs font-bold" />
              <span>Draft saved at {lastSavedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span>
            </span>
          )}

          {lastSavedAt && onClearDraft && (
            <button
              type="button"
              onClick={onClearDraft}
              className="text-[11px] text-slate-400 hover:text-rose-600 transition-colors underline cursor-pointer"
              title="Discard saved draft and start fresh"
            >
              Clear draft
            </button>
          )}

          {onToggleAutoSave && (
            <label
              className="hidden sm:flex items-center gap-1.5 text-[11px] text-slate-500 hover:text-slate-700 cursor-pointer ml-1 select-none"
              title={autoSaveEnabled ? "Auto-save is ON" : "Auto-save is OFF"}
            >
              <input
                type="checkbox"
                checked={autoSaveEnabled}
                onChange={(e) => onToggleAutoSave(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-slate-300 text-[#253C7D] focus:ring-[#253C7D] cursor-pointer"
              />
              <span>Auto-save</span>
            </label>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={onClose}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-slate-300 bg-slate-100 hover:bg-slate-200 text-xs font-medium text-slate-700 transition-colors cursor-pointer"
      >
        <i className="ri-arrow-left-s-line text-sm" />
        <span>Back</span>
      </button>
    </div>
  );
});
