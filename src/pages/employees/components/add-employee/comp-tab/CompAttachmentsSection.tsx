import { memo, useRef, useState, useCallback } from "react";
import type { EmployeePayrollAttachment } from "../../../types";
import { uploadMultipleFilesToS3 } from "@/lib/s3-storage";
import { toast } from "@/components/Toast";

interface CompAttachmentsSectionProps {
  attachments: EmployeePayrollAttachment[];
  onChange: (attachments: EmployeePayrollAttachment[]) => void;
}

export const CompAttachmentsSection = memo(function CompAttachmentsSection({
  attachments,
  onChange,
}: CompAttachmentsSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFiles = useCallback(
    async (fileList: FileList | null) => {
      if (!fileList || !fileList.length) return;
      const fileArray = Array.from(fileList);
      setUploading(true);
      try {
        const uploaded = await uploadMultipleFilesToS3(fileArray, "employees/payroll-attachments");
        const newItems: EmployeePayrollAttachment[] = uploaded.map((item) => ({
          name: item.name,
          url: item.url,
          size: item.size,
          type: item.type,
          uploaded_at: new Date().toISOString(),
        }));
        onChange([...attachments, ...newItems]);
        toast("File Uploaded", `Added ${fileArray.length} payroll attachment(s).`, "success");
      } catch (err) {
        console.error("Payroll upload error:", err);
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
    toast("Attachment Removed", "Removed file from payroll attachments.", "info");
  };

  return (
    <div className="p-5 bg-white border border-slate-200/90 rounded-2xl shadow-2xs space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-lg bg-[#253C7D] text-white flex items-center justify-center text-xs shadow-2xs">
            <i className="ri-attachment-2 text-xs" />
          </span>
          <h3 className="text-xs font-black text-[#253C7D] uppercase tracking-wider">
            Attachment Info
          </h3>
          {attachments.length > 0 && (
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
              {attachments.length} Attached
            </span>
          )}
        </div>
      </div>

      {/* Drag & Drop Upload Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
          isDragOver
            ? "border-[#253C7D] bg-blue-50/40 scale-[0.99]"
            : "border-slate-300 hover:border-slate-400 bg-slate-50/40"
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

        <div className="flex flex-col items-center justify-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#253C7D] flex items-center justify-center text-xl shadow-2xs">
            <i className={uploading ? "ri-loader-4-line animate-spin" : "ri-upload-cloud-2-line"} />
          </div>

          <p className="text-xs font-medium text-slate-700">
            <i className="ri-drag-drop-line mr-1 text-slate-400" />
            Drop file here or{" "}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="font-bold text-[#253C7D] hover:underline cursor-pointer"
            >
              Browse
            </button>
          </p>
          <p className="text-[10px] text-slate-400">
            Supports PDF, Word, Excel, and Image files (contract amendments, tax deduction receipts, payroll agreements)
          </p>
        </div>
      </div>

      {/* Uploaded Attachments List */}
      {attachments && attachments.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
          {attachments.map((att, idx) => {
            const isPdf = att.name.toLowerCase().endsWith(".pdf") || att.type?.includes("pdf");
            const isWord = att.name.toLowerCase().endsWith(".doc") || att.name.toLowerCase().endsWith(".docx");
            const isExcel = att.name.toLowerCase().endsWith(".xls") || att.name.toLowerCase().endsWith(".xlsx");
            const isImage = att.type?.startsWith("image/") || /\.(jpg|jpeg|png|webp)$/i.test(att.name);

            return (
              <div
                key={att.url || idx}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200 text-xs transition-colors group"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
                  <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-2xs">
                    {isPdf ? (
                      <i className="ri-file-pdf-fill text-rose-500 text-base" />
                    ) : isWord ? (
                      <i className="ri-file-word-fill text-blue-600 text-base" />
                    ) : isExcel ? (
                      <i className="ri-file-excel-fill text-emerald-600 text-base" />
                    ) : isImage ? (
                      <i className="ri-image-2-fill text-purple-600 text-base" />
                    ) : (
                      <i className="ri-file-text-fill text-slate-500 text-base" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-800 truncate" title={att.name}>
                      {att.name}
                    </p>
                    {att.size && (
                      <span className="text-[10px] text-slate-400">
                        {(att.size / 1024).toFixed(1)} KB
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <a
                    href={att.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-6 h-6 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-white flex items-center justify-center text-xs transition-colors"
                    title="Preview / Download"
                  >
                    <i className="ri-external-link-line" />
                  </a>
                  <button
                    type="button"
                    onClick={() => handleRemoveAttachment(att.url)}
                    className="w-6 h-6 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center text-xs transition-colors cursor-pointer"
                    title="Delete attachment"
                  >
                    <i className="ri-delete-bin-line" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
});
