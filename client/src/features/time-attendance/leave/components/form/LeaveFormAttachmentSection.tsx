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
  handleRemoveAttachment: (index?: number) => void;
}

function getFileIcon(name: string) {
  const ext = name.split(".").pop()?.toLowerCase();
  if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext || "")) {
    return {
      icon: "ri-image-line",
      color: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-100 dark:border-emerald-900/50",
    };
  }
  if (ext === "pdf") {
    return {
      icon: "ri-file-pdf-2-line",
      color: "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 border-rose-100 dark:border-rose-900/50",
    };
  }
  if (["doc", "docx"].includes(ext || "")) {
    return {
      icon: "ri-file-word-line",
      color: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 border-blue-100 dark:border-blue-900/50",
    };
  }
  return {
    icon: "ri-file-text-line",
    color: "text-[#253C7D] dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 border-blue-100 dark:border-blue-900/50",
  };
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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
  const attachedFiles: File[] =
    formData.attachment_files && formData.attachment_files.length > 0
      ? formData.attachment_files
      : formData.attachment_file
      ? [formData.attachment_file]
      : [];

  const hasLegacyUrl = Boolean(formData.attachment_url);
  const totalCount = attachedFiles.length + (hasLegacyUrl ? 1 : 0);

  return (
    <div className="my-2 space-y-2 w-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-[11px] sm:text-xs font-bold text-slate-800 dark:text-slate-200">
            Attachment Info
          </h3>
          {totalCount > 0 && (
            <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              {totalCount} {totalCount === 1 ? "file" : "files"}
            </span>
          )}
        </div>
        {activeTypeCfg?.requiresUpload && (
          <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
            Required for {activeTypeCfg.code}
          </span>
        )}
      </div>

      {/* Hidden Multi-file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFileChange}
        accept="image/*,.pdf,.doc,.docx"
      />

      {totalCount > 0 ? (
        <div className="space-y-2">
          {/* List of attached files */}
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-0.5">
            {attachedFiles.map((file, idx) => {
              const meta = getFileIcon(file.name);
              return (
                <div
                  key={`${file.name}-${file.size}-${idx}`}
                  className="p-2 sm:p-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-between gap-2 shadow-2xs transition-all hover:border-slate-300 dark:hover:border-slate-600"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs shrink-0 border ${meta.color}`}
                    >
                      <i className={meta.icon} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {file.name}
                      </p>
                      <p className="text-[9px] text-slate-400">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveAttachment(idx)}
                    className="p-1 sm:px-2 sm:py-0.5 text-[10.5px] font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer shrink-0 border border-transparent hover:border-rose-200 dark:hover:border-rose-900/50"
                    title="Remove file"
                  >
                    <i className="ri-delete-bin-line sm:mr-1" />
                    <span className="hidden sm:inline">Remove</span>
                  </button>
                </div>
              );
            })}

            {hasLegacyUrl && !formData.attachment_file && (
              <div className="p-2 sm:p-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-between gap-2 shadow-2xs">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-[#253C7D] dark:text-blue-300 flex items-center justify-center text-xs shrink-0 border border-blue-100 dark:border-blue-900/50">
                    <i className="ri-attachment-line" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {formData.attachment_url?.split("/").pop() || "Pre-attached Document"}
                    </p>
                    <p className="text-[9px] text-emerald-600 font-semibold">Already attached</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveAttachment()}
                  className="px-2 py-0.5 text-[10.5px] font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer shrink-0 border border-transparent hover:border-rose-200 dark:hover:border-rose-900/50"
                >
                  <i className="ri-delete-bin-line mr-1" />
                  Remove
                </button>
              </div>
            )}
          </div>

          {/* Add more files drop zone / button */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleFileDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border border-dashed rounded-xl py-2 px-3 text-center cursor-pointer transition-all flex items-center justify-center gap-2 ${
              isDragOver
                ? "border-[#253C7D] bg-blue-50/50 dark:bg-blue-950/30"
                : "border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-600 bg-white/70 dark:bg-slate-900/70 hover:bg-blue-50/20"
            }`}
          >
            <i className="ri-add-circle-line text-sm text-[#253C7D] dark:text-blue-400" />
            <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
              Add more files (drop or browse)
            </span>
          </div>
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
          className={`border-2 border-dashed rounded-xl p-3 sm:p-4 text-center cursor-pointer transition-all ${
            isDragOver
              ? "border-[#253C7D] bg-blue-50/50 dark:bg-blue-950/30"
              : activeTypeCfg?.requiresUpload
              ? "border-rose-300 dark:border-rose-800 bg-rose-50/20"
              : "border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 bg-white dark:bg-slate-900 hover:bg-slate-50/60 dark:hover:bg-slate-800/40"
          }`}
        >
          <div className="flex flex-col items-center justify-center gap-1">
            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center text-sm">
              <i className="ri-upload-cloud-2-line" />
            </div>
            <p className="text-[12px] font-semibold text-slate-700 dark:text-slate-200">
              Drop files here or <span className="text-blue-600 dark:text-blue-400 underline">Browse</span>
            </p>
            <p className="text-[9.5px] text-slate-400">
              Multiple files supported · PDF, PNG, JPG, DOC (Max 10MB each)
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
