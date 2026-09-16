import { memo, useRef, useState, useCallback } from "react";
import { uploadMultipleFilesToS3 } from "@/lib/s3-storage";
import { toast } from "@/components/Toast";
import type { PersonalSectionProps } from "./types";
import type { EmployeePersonalAttachment } from "../../types";

export const PersonalAttachmentSection = memo(function PersonalAttachmentSection({
  form,
  onChange,
}: PersonalSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const attachments: (EmployeePersonalAttachment | string)[] = form.personal_attachments || [];

  const handleFiles = async (files: FileList | File[] | null) => {
    if (!files || !files.length) return;
    const fileArray = Array.from(files);

    setUploading(true);
    try {
      // Direct upload to AWS S3
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

      // Also mirror into form.documents for cross-tab document persistence
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

      toast("Stored to AWS S3", `Uploaded ${fileArray.length} document(s) to AWS S3 cloud storage.`, "success");
    } catch (err) {
      console.error("Personal document upload error:", err);
      toast("Upload Failed", err instanceof Error ? err.message : "Could not upload document to AWS S3", "error");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

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

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  }, [attachments]);

  const handleRemove = (idx: number) => {
    const itemToRemove = attachments[idx];
    const updated = attachments.filter((_, i) => i !== idx);
    onChange("personal_attachments", updated);

    // Also remove from documents mirror if matching URL
    if (typeof itemToRemove === "object" && itemToRemove.url) {
      const updatedDocs = (form.documents || []).filter((d: any) => d.url !== itemToRemove.url);
      onChange("documents", updatedDocs);
    }
    toast("Attachment Removed", "Removed file from personal documents.", "info");
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="pt-6 border-t border-slate-200/80 w-full space-y-6">
      {/* Register NSSF Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <label className="inline-flex items-center gap-2.5 cursor-pointer select-none group">
          <input
            type="checkbox"
            checked={Boolean(form.register_nssf)}
            onChange={(e) => onChange("register_nssf", e.target.checked)}
            className="w-4 h-4 rounded border-slate-300 text-[#253C7D] focus:ring-[#253C7D] cursor-pointer"
          />
          <span className="text-xs font-bold text-slate-700 group-hover:text-slate-900 transition-colors">
            Register Nssf
          </span>
        </label>

        {Boolean(form.register_nssf) && (
          <div className="flex items-center gap-2.5 bg-blue-50/70 border border-blue-200 px-3.5 py-1.5 rounded-xl shadow-2xs">
            <span className="text-xs font-bold text-[#253C7D]">NSSF Number:</span>
            <input
              type="text"
              value={form.nssf_number || ""}
              onChange={(e) => onChange("nssf_number", e.target.value)}
              placeholder="e.g. 10293847"
              className="px-2.5 py-1 text-xs font-mono font-bold bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-[#253C7D] w-44"
            />
          </div>
        )}
      </div>

      <div className="space-y-4">
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
            {/* Dropzone with AWS S3 integration */}
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

            {/* List of uploaded attachments stored on AWS S3 */}
            {attachments.length > 0 && (
              <div className="space-y-2 pt-1">
                {attachments.map((fileItem, idx) => {
                  const isObj = typeof fileItem === "object" && fileItem !== null;
                  const name = isObj ? fileItem.name : String(fileItem);
                  const url = isObj ? fileItem.url : "";
                  const size = isObj ? fileItem.size : undefined;
                  const isS3Url = url.includes("amazonaws.com") || url.includes("s3") || url.startsWith("http");

                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-50/90 border border-slate-200 text-xs text-slate-800 hover:border-slate-300 hover:bg-white transition-all shadow-2xs group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#253C7D] flex items-center justify-center shrink-0 border border-blue-100">
                          {name.toLowerCase().endsWith(".pdf") ? (
                            <i className="ri-file-pdf-line text-base text-rose-500" />
                          ) : name.match(/\.(jpg|jpeg|png|webp)$/i) ? (
                            <i className="ri-image-line text-base text-emerald-600" />
                          ) : (
                            <i className="ri-file-text-line text-base text-[#253C7D]" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate font-bold text-slate-800 text-xs leading-tight">
                            {name}
                          </p>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                            {size ? <span>{formatFileSize(size)}</span> : null}
                            {isS3Url && (
                              <span className="inline-flex items-center gap-0.5 text-amber-600 font-bold bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200/50">
                                <i className="ri-cloud-line text-[10px]" /> AWS S3
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {url && (
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-slate-400 hover:text-[#253C7D] hover:bg-blue-50 rounded-lg transition-colors inline-flex items-center"
                            title="Open / Download Document from AWS S3"
                          >
                            <i className="ri-external-link-line text-sm" />
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemove(idx)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Remove Attachment"
                        >
                          <i className="ri-delete-bin-line text-sm" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});
