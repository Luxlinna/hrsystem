import React, { memo, useRef, useState } from "react";
import type { ComplaintFormState } from "../types";
import { WarningFileViewerModal } from "@/pages/disciplinary/components/WarningFileViewerModal";

interface ComplaintAttachmentSectionProps {
  form: ComplaintFormState;
  setForm: React.Dispatch<React.SetStateAction<ComplaintFormState>>;
  onUploadDocument: (file: File) => Promise<{ url: string; name: string } | null>;
}

export const ComplaintAttachmentSection = memo(function ComplaintAttachmentSection({
  form,
  setForm,
  onUploadDocument,
}: ComplaintAttachmentSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewState, setPreviewState] = useState<{ url: string; name: string } | null>(null);

  const handleProcessFile = async (file: File) => {
    setUploading(true);
    const res = await onUploadDocument(file);
    if (res) {
      setForm((prev) => ({
        ...prev,
        attachment_url: res.url,
        attachment_name: res.name,
      }));
    }
    setUploading(false);
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleProcessFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="pt-2">
      <div className="text-sm font-bold text-[#0284c7] uppercase tracking-wide">
        ATTACHMENT INFO
      </div>
      <div className="border-b border-slate-200 mt-2 mb-6" />

      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
        <label className="sm:w-52 text-xs font-semibold text-slate-700 sm:text-right">
          Attachment
        </label>
        <div className="flex-1 max-w-2xl">
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept=".pdf,.doc,.docx,.xlsx,.xls,.png,.jpg,.jpeg"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleProcessFile(e.target.files[0]);
                e.target.value = "";
              }
            }}
          />

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleFileDrop}
            onClick={() => !uploading && fileInputRef.current?.click()}
            className={`border border-dashed rounded px-4 py-2.5 text-xs cursor-pointer transition-colors flex items-center justify-center gap-2 ${
              dragOver
                ? "border-sky-500 bg-sky-50/50"
                : "border-slate-300 hover:border-slate-400 bg-white"
            }`}
          >
            {uploading ? (
              <div className="flex items-center gap-2 text-slate-500 font-medium">
                <div className="w-3.5 h-3.5 border-2 border-sky-600 border-t-transparent rounded-full animate-spin" />
                <span>Uploading to AWS S3...</span>
              </div>
            ) : (
              <>
                <i className="ri-upload-cloud-line text-sm text-slate-400" />
                <span className="text-slate-600">Drop file here or</span>
                <span className="text-[#0284c7] font-semibold hover:underline">
                  Browse
                </span>

                {form.attachment_url && (
                  <span className="ml-2 font-semibold text-slate-800 flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewState({
                          url: form.attachment_url,
                          name: form.attachment_name || "Attachment",
                        });
                      }}
                      className="text-sky-700 hover:underline max-w-[200px] truncate"
                      title="Click to view file"
                    >
                      ({form.attachment_name || "Attached File"})
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setForm((f) => ({
                          ...f,
                          attachment_url: "",
                          attachment_name: "",
                        }));
                      }}
                      className="text-rose-500 hover:text-rose-700 p-0.5"
                      title="Remove attachment"
                    >
                      <i className="ri-close-line text-xs" />
                    </button>
                  </span>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {previewState && (
        <WarningFileViewerModal
          url={previewState.url}
          fileName={previewState.name}
          onClose={() => setPreviewState(null)}
        />
      )}
    </div>
  );
});
