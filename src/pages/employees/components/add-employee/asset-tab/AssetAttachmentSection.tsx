import { memo, useRef, useState, useCallback } from "react";
import type { EmployeeAssetAttachment } from "../../types";
import { uploadMultipleFilesToS3 } from "@/lib/s3-storage";
import { toast } from "@/components/Toast";

interface AssetAttachmentSectionProps {
  attachments: EmployeeAssetAttachment[];
  onChange: (attachments: EmployeeAssetAttachment[]) => void;
}

export const AssetAttachmentSection = memo(function AssetAttachmentSection({
  attachments,
  onChange,
}: AssetAttachmentSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFiles = useCallback(
    async (fileList: FileList | null) => {
      if (!fileList || !fileList.length) return;
      const fileArray = Array.from(fileList);
      setUploading(true);
      try {
        const uploaded = await uploadMultipleFilesToS3(fileArray, "employees/asset-attachments");
        const newItems: EmployeeAssetAttachment[] = uploaded.map((item) => ({
          name: item.name,
          url: item.url,
          size: item.size,
          type: item.type,
          uploaded_at: new Date().toISOString(),
        }));
        onChange([...attachments, ...newItems]);
        toast("File Uploaded", `Added ${fileArray.length} asset attachment(s).`, "success");
      } catch (err) {
        console.error("Asset upload error:", err);
        toast("Upload Failed", err instanceof Error ? err.message : "Could not upload file", "error");
      } finally {
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    },
    [attachments, onChange]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles]
  );

  const handleRemoveAttachment = (url: string) => {
    onChange(attachments.filter((a) => a.url !== url));
  };

  return (
    <div className="space-y-4 pt-4 border-t border-slate-100">
      <h3 className="text-xs font-bold text-[#253C7D] uppercase tracking-wider">
        ATTACHMENT INFO
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] items-start gap-y-3 gap-x-6">
        <label className="text-xs font-semibold text-slate-700 sm:text-right pt-2.5">
          Attachment
        </label>

        <div className="space-y-3 w-full">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            className={`border border-dashed rounded-md p-3.5 text-center transition-all bg-white ${
              isDragOver ? "border-[#253C7D] bg-[#253C7D]/5" : "border-slate-300 hover:border-slate-400"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
              onChange={(e) => handleFiles(e.target.files)}
            />

            <div className="flex items-center justify-center gap-1.5 text-xs text-slate-600">
              <i className={uploading ? "ri-loader-4-line animate-spin text-[#253C7D]" : "ri-upload-cloud-line text-slate-400 text-base"} />
              <span>Drop file here or</span>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="font-medium text-[#253C7D] hover:underline cursor-pointer ml-0.5"
              >
                Browse
              </button>
            </div>
          </div>

          {attachments && attachments.length > 0 && (
            <div className="space-y-1.5 pt-1">
              {attachments.map((att, idx) => (
                <div
                  key={att.url || idx}
                  className="flex items-center justify-between px-3 py-1.5 rounded-md bg-slate-50 border border-slate-200 text-xs"
                >
                  <div className="flex items-center gap-2 truncate">
                    <i className="ri-file-text-line text-[#253C7D]" />
                    <span className="truncate font-medium text-slate-700">{att.name}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href={att.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-400 hover:text-slate-700"
                    >
                      <i className="ri-external-link-line" />
                    </a>
                    <button
                      type="button"
                      onClick={() => handleRemoveAttachment(att.url)}
                      className="text-slate-400 hover:text-rose-600 cursor-pointer"
                    >
                      <i className="ri-delete-bin-line" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
