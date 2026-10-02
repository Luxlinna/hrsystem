import React, { useRef, useState, memo } from "react";
import { uploadMultipleFilesToS3 } from "@/lib/s3-storage";
import { toast } from "@/components/Toast";

export interface EmployeeDocumentItem {
  name: string;
  url: string;
  size?: number;
  type?: string;
  uploaded_at?: string;
  doc_slot_key?: string;
  stage_key?: string;
}

interface AddEmployeeAttachmentUploadProps {
  documents: EmployeeDocumentItem[];
  onChangeDocuments: (docs: EmployeeDocumentItem[]) => void;
}

export const AddEmployeeAttachmentUpload: React.FC<AddEmployeeAttachmentUploadProps> = memo(
  function AddEmployeeAttachmentUpload({ documents, onChangeDocuments }) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files ? Array.from(e.target.files) : [];
      if (!files.length) return;

      setUploading(true);
      try {
        const uploaded = await uploadMultipleFilesToS3(files, "employees/hiring-docs");
        const newDocs: EmployeeDocumentItem[] = uploaded.map((item) => ({
          name: item.name,
          url: item.url,
          size: item.size,
          type: item.type,
          uploaded_at: new Date().toISOString(),
          doc_slot_key: "hiring_info",
          stage_key: "hiring",
        }));

        const updated = [...(documents || []), ...newDocs];
        onChangeDocuments(updated);
        toast("Files Uploaded", `Successfully attached ${files.length} document(s) to employee record.`, "success");
      } catch (err) {
        console.error("Employee document upload error:", err);
        toast("Upload Failed", err instanceof Error ? err.message : "Could not upload file to S3", "error");
      } finally {
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };

    const handleDeleteDoc = (docUrl: string) => {
      const updated = (documents || []).filter((d) => d.url !== docUrl);
      onChangeDocuments(updated);
      toast("Attachment Removed", "File removed from record.", "info");
    };

    return (
      <div className="space-y-3 pt-4 border-t border-slate-200">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
              <span className="w-6 h-6 rounded-lg bg-[#253C7D] text-white flex items-center justify-center text-xs">
                <i className="ri-attachment-2" />
              </span>
              <span>Employment &amp; Hiring Attachments ({documents?.length || 0})</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Upload signed offer letters, CVs, National ID scans, certificates, or agreements (AWS S3 Cloud Storage)
            </p>
          </div>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-[#253C7D] text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs hover:shadow-xs disabled:opacity-50"
          >
            <i className={uploading ? "ri-loader-4-line animate-spin text-sm" : "ri-upload-cloud-2-line text-sm"} />
            <span>{uploading ? "Uploading..." : "Upload File"}</span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
            onChange={handleFileChange}
          />
        </div>

        {documents && documents.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            {documents.map((doc, idx) => {
              const isPdf = doc.name.toLowerCase().endsWith(".pdf") || doc.type?.includes("pdf");
              const isWord = doc.name.toLowerCase().endsWith(".doc") || doc.name.toLowerCase().endsWith(".docx");
              const isImage = doc.type?.startsWith("image/") || /\.(jpg|jpeg|png|webp)$/i.test(doc.name);

              return (
                <div
                  key={doc.url || idx}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200 text-xs transition-colors group"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1 pr-2">
                    <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0">
                      {isPdf ? (
                        <i className="ri-file-pdf-fill text-rose-500 text-base" />
                      ) : isWord ? (
                        <i className="ri-file-word-fill text-blue-600 text-base" />
                      ) : isImage ? (
                        <i className="ri-image-2-fill text-emerald-600 text-base" />
                      ) : (
                        <i className="ri-file-text-fill text-slate-500 text-base" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-800 truncate" title={doc.name}>
                        {doc.name}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {doc.size ? `${(doc.size / 1024).toFixed(1)} KB` : "Attached file"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-[#253C7D] hover:bg-white transition-colors"
                      title="View / Download file"
                    >
                      <i className="ri-external-link-line text-sm" />
                    </a>
                    <button
                      type="button"
                      onClick={() => handleDeleteDoc(doc.url)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Remove attachment"
                    >
                      <i className="ri-delete-bin-line text-sm" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-4 rounded-xl border border-dashed border-slate-200 text-center bg-slate-50/50">
            <i className="ri-file-upload-line text-2xl text-slate-400 block mb-1" />
            <p className="text-xs font-semibold text-slate-600">No documents attached yet</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Click &ldquo;Upload File&rdquo; to attach candidate resumes, certificates, and ID documents
            </p>
          </div>
        )}
      </div>
    );
  }
);
