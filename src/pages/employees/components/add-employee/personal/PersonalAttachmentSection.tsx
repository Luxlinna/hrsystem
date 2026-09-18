import { memo, useRef, useState, useCallback, useMemo } from "react";
import { uploadMultipleFilesToS3 } from "@/lib/s3-storage";
import { toast } from "@/components/Toast";
import type { PersonalSectionProps } from "./types";
import type { EmployeePersonalAttachment } from "../../../types";
import { PersonalAttachmentItem } from "./PersonalAttachmentItem";

export const PersonalAttachmentSection = memo(function PersonalAttachmentSection({
  form,
  onChange,
}: PersonalSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const attachments: (EmployeePersonalAttachment | string)[] = useMemo(
    () => form.personal_attachments || [],
    [form.personal_attachments]
  );

  const handleFiles = useCallback(
    async (files: FileList | File[] | null) => {
      if (!files || !files.length) return;
      const fileArray = Array.from(files);

      setUploading(true);
      try {
        const uploaded = await uploadMultipleFilesToS3(fileArray, "employees/personal-attachments");

        const newItems: EmployeePersonalAttachment[] = uploaded.map((item) => ({
          name: item.name,
          url: item.url,
          size: item.size,
          type: item.type,
          uploaded_at: new Date().toISOString(),
          key: item.key,
        }));

        const updated = [...attachments, ...newItems];
        onChange("personal_attachments", updated);

        const docMirror = uploaded.map((item) => ({
          name: item.name,
          url: item.url,
          size: item.size,
          type: item.type,
          uploaded_at: new Date().toISOString(),
          doc_slot_key: "personal_doc",
          stage_key: "personal_information",
        }));
        onChange("documents", [...(form.documents || []), ...docMirror]);

        toast("Stored to AWS S3", `Uploaded ${fileArray.length} document(s) to AWS S3.`, "success");
      } catch (err) {
        console.error("Personal document upload error:", err);
        toast("Upload Failed", err instanceof Error ? err.message : "Could not upload document", "error");
      } finally {
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    },
    [attachments, form.documents, onChange]
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

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

  const handleRemove = (idx: number) => {
    const itemToRemove = attachments[idx];
    const updated = attachments.filter((_, i) => i !== idx);
    onChange("personal_attachments", updated);

    if (typeof itemToRemove === "object" && itemToRemove.url) {
      const updatedDocs = (form.documents || []).filter((d: any) => d.url !== itemToRemove.url);
      onChange("documents", updatedDocs);
    }
    toast("Attachment Removed", "Removed file from personal documents.", "info");
  };

  return (
    <div className="pt-6 border-t border-slate-200/80 w-full space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-black text-[#253C7D] uppercase tracking-wider flex items-center gap-2">
          <span>ATTACHMENT INFO</span>
          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200/70 inline-flex items-center gap-1">
            <i className="ri-amazon-line text-xs" /> AWS S3
          </span>
        </h3>
        {attachments.length > 0 && (
          <span className="text-[11px] font-bold text-slate-500">
            {attachments.length} file{attachments.length > 1 ? "s" : ""} attached
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
        <label className="md:col-span-3 text-xs font-bold text-slate-700 md:text-right md:pt-3 md:pr-8">
          Attachment
        </label>
        <div className="md:col-span-9 space-y-3">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => !uploading && fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-7 flex flex-col items-center justify-center cursor-pointer transition-all group shadow-2xs ${
              isDragOver
                ? "border-[#253C7D] bg-blue-50/50 scale-[1.005]"
                : "border-slate-300 hover:border-[#253C7D] bg-white hover:bg-slate-50/60"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleFileChange}
              disabled={uploading}
            />
            
            <div className="w-12 h-12 rounded-full bg-blue-50/90 text-[#253C7D] flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform shadow-xs">
              {uploading ? (
                <i className="ri-loader-4-line text-2xl text-blue-600 animate-spin" />
              ) : (
                <i className="ri-upload-cloud-2-line text-2xl text-[#253C7D]" />
              )}
            </div>

            <p className="text-xs font-bold text-slate-700 text-center">
              {uploading ? (
                <span className="text-[#253C7D] animate-pulse">Uploading documents to AWS S3...</span>
              ) : (
                <>
                  Drop file here or <span className="text-[#253C7D] underline font-extrabold">Browse</span>
                </>
              )}
            </p>
            
            <div className="flex items-center gap-2 mt-1.5 text-[11px] text-slate-400 font-medium">
              <span>PDF, PNG, JPG, DOCX up to 25MB</span>
              <span>•</span>
              <span className="text-emerald-600 font-semibold inline-flex items-center gap-1">
                <i className="ri-shield-check-line text-xs" /> Cloud Encrypted
              </span>
            </div>
          </div>

          {attachments.length > 0 && (
            <div className="space-y-2 pt-1">
              {attachments.map((fileItem, idx) => (
                <PersonalAttachmentItem
                  key={idx}
                  fileItem={fileItem}
                  idx={idx}
                  onRemove={handleRemove}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
