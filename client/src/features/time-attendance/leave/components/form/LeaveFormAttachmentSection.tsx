import React from "react";
import type { LeaveFormData } from "../../types";

interface LeaveFormAttachmentSectionProps {
  formData: LeaveFormData;
  activeTypeCfg: { code: string; requiresUpload?: boolean };
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
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-3.5 sm:p-4 shadow-[0_4px_20px_rgba(0,0,0,0.03)] space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs sm:text-[13px] font-bold text-[#1e293b] dark:text-slate-100">
          <div className="w-5 h-5 rounded-md bg-[#2563eb]/10 text-[#2563eb] flex items-center justify-center text-xs">
            <i className="ri-attachment-2" />
          </div>
          <span>Attachment</span>
        </div>
        {activeTypeCfg.requiresUpload && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
            Required for {activeTypeCfg.code}
          </span>
        )}
      </div>

      {/* Upload Box / Uploaded File Display */}
      {formData.attachment_file || formData.attachment_url ? (
        <div className="p-3 bg-[#eff6ff] dark:bg-slate-800 border border-blue-200 dark:border-slate-700 rounded-2xl flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-[#2563eb]/10 text-[#2563eb] flex items-center justify-center shrink-0 text-base">
              <i className="ri-file-text-line" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                {formData.attachment_file?.name || "Uploaded Document"}
              </p>
              <p className="text-[10px] text-slate-400">
                {formData.attachment_file
                  ? `${(formData.attachment_file.size / 1024).toFixed(1)} KB`
                  : "Stored securely"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRemoveAttachment}
            className="px-2.5 py-1 text-[11px] font-bold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer shrink-0"
          >
            <i className="ri-delete-bin-line mr-0.5" />
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
          className={`border-2 border-dashed rounded-2xl p-3 sm:p-3.5 flex items-center justify-between gap-2 cursor-pointer transition-all ${
            isDragOver
              ? "border-[#2563eb] bg-blue-50/60"
              : activeTypeCfg.requiresUpload
              ? "border-rose-300 bg-rose-50/30 hover:border-rose-400"
              : "border-[#93c5fd] bg-[#eff6ff]/50 dark:bg-sky-950/20 hover:border-blue-400"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileChange}
            accept="image/*,.pdf,.doc,.docx"
          />

          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-[#2563eb]/10 text-[#2563eb] flex items-center justify-center shrink-0 text-lg">
              <i className="ri-upload-cloud-2-line" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
                Upload Attachment <span className="font-normal text-slate-400 text-[11px]">(optional)</span>
              </p>
              <p className="text-[10px] text-slate-400">
                PDF, JPG, PNG (Max 5MB)
              </p>
            </div>
          </div>

          <div className="w-7 h-7 rounded-lg bg-white dark:bg-slate-800 border border-blue-100 dark:border-slate-700 text-[#2563eb] flex items-center justify-center shrink-0 shadow-2xs">
            <i className="ri-image-line text-sm" />
          </div>
        </div>
      )}
    </div>
  );
}
