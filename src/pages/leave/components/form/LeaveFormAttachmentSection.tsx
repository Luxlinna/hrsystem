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
    <div className="bg-white rounded-2xl border border-gray-200/80 p-5 sm:p-6 shadow-2xs space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-extrabold text-[#253C7D] uppercase tracking-wider flex items-center gap-2">
          <i className="ri-attachment-line text-base" />
          Attachment Info
        </h2>
        {activeTypeCfg.requiresUpload && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200">
            Required for {activeTypeCfg.code}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        <label className="md:col-span-3 text-xs font-bold text-gray-700">Attachment</label>

        <div className="md:col-span-9">
          {formData.attachment_file || formData.attachment_url ? (
            <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-2xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 truncate">
                <div className="w-8 h-8 rounded-lg bg-[#253C7D]/10 text-[#253C7D] flex items-center justify-center shrink-0">
                  <i className="ri-file-text-line text-base" />
                </div>
                <div className="truncate">
                  <p className="text-xs font-bold text-gray-800 truncate">
                    {formData.attachment_file?.name || "Uploaded Document"}
                  </p>
                  <p className="text-[10px] text-gray-400">
                    {formData.attachment_file
                      ? `${(formData.attachment_file.size / 1024).toFixed(1)} KB`
                      : "Stored securely"}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleRemoveAttachment}
                className="px-2.5 py-1 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer shrink-0"
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
              className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                isDragOver
                  ? "border-[#253C7D] bg-blue-50/50"
                  : activeTypeCfg.requiresUpload
                  ? "border-rose-300 bg-rose-50/20 hover:border-rose-400"
                  : "border-gray-200 hover:border-gray-300 bg-gray-50/50"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileChange}
                accept="image/*,.pdf,.doc,.docx"
              />
              <i
                className={`ri-upload-cloud-2-line text-2xl ${
                  activeTypeCfg.requiresUpload ? "text-rose-500" : "text-gray-400"
                }`}
              />
              <p className="text-xs font-bold text-gray-700 mt-1">
                <span className="text-[#253C7D] hover:underline">Browse</span> or Drop file here
              </p>
              <p className="text-[10px] text-gray-400 mt-0.5">Supports PDF, PNG, JPG, DOCX (up to 10MB)</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
