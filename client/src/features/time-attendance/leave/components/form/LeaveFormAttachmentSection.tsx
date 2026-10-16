import React from "react";
import type { LeaveFormData } from "../../types";

interface LeaveFormAttachmentSectionProps {
  formData: LeaveFormData;
  activeTypeCfg?: { code?: string; requiresUpload?: boolean };
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  isDragOver: boolean;
  setIsDragOver: React.Dispatch<React.SetStateAction<boolean>>;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleFileDrop: (e: React.DragEvent) => void;
  handleRemoveAttachment: () => void;
}

export function LeaveFormAttachmentSection({
  formData,
  activeTypeCfg,
  fileInputRef,
  isDragOver,
  setIsDragOver,
  handleFileChange,
  handleFileDrop,
  handleRemoveAttachment,
}: LeaveFormAttachmentSectionProps) {
  return (
    <div className="my-2 space-y-1 w-full">
      <div className="flex items-center justify-between">
        <h3 className="text-[11px] sm:text-xs font-bold text-slate-800 dark:text-slate-200">
          Attachment Info
        </h3>
        {activeTypeCfg?.requiresUpload && (
          <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
            Required for {activeTypeCfg.code}
          </span>
        )}
      </div>

      {formData.attachment_file || formData.attachment_url ? (
        <div className="p-2 sm:p-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-between gap-2 shadow-2xs">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-[#253C7D] dark:text-blue-300 flex items-center justify-center text-xs shrink-0 border border-blue-100 dark:border-blue-900/50">
              <i className="ri-file-text-line" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                {formData.attachment_file?.name || "Uploaded Document"}
              </p>
              <p className="text-[9px] text-slate-400">
                {formData.attachment_file
                  ? `${(formData.attachment_file.size / 1024).toFixed(1)} KB`
                  : "Attached successfully"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleRemoveAttachment}
            className="px-2 py-0.5 text-[10.5px] font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer shrink-0 border border-transparent hover:border-rose-200 dark:hover:border-rose-900/50"
          >
            <i className="ri-delete-bin-line mr-1" />
            Remove
          </button>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleFileDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-2.5 sm:p-3 text-center cursor-pointer transition-all ${
            isDragOver
              ? "border-[#253C7D] bg-blue-50/50 dark:bg-blue-950/30"
              : activeTypeCfg?.requiresUpload
              ? "border-rose-300 dark:border-rose-800 bg-rose-50/20"
              : "border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 bg-white dark:bg-slate-900 hover:bg-slate-50/60 dark:hover:bg-slate-800/40"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileChange}
            accept="image/*,.pdf,.doc,.docx"
          />
          <div className="flex flex-col items-center justify-center gap-0.5">
            <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center text-xs">
              <i className="ri-upload-cloud-2-line" />
            </div>
            <p className="text-[11.5px] font-semibold text-slate-700 dark:text-slate-200">
              Drop file here or Browse
            </p>
            <p className="text-[9.5px] text-slate-400">
              Supports PDF, PNG, JPG, DOC (Max 10MB)
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
