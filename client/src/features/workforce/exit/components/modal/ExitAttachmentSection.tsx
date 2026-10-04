import { memo, useRef, useState } from "react";
import type { ExitFormState } from "../../types";

interface ExitAttachmentSectionProps {
  form: ExitFormState;
  onChange: (field: keyof ExitFormState, value: any) => void;
  onUploadDocument: (file: File) => Promise<{ url: string; name: string } | null>;
}

export const ExitAttachmentSection = memo(function ExitAttachmentSection({
  form,
  onChange,
  onUploadDocument,
}: ExitAttachmentSectionProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setUploading(true);
    const result = await onUploadDocument(file);
    if (result) {
      onChange("document_url", result.url);
      onChange("document_name", result.name);
    }
    setUploading(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div className="space-y-4 pt-2">
      <div className="text-xs font-black tracking-wider text-sky-600 uppercase border-b border-slate-100 pb-1.5">
        Attachment Info
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-2 md:gap-4 items-center">
        <label className="text-xs font-bold text-slate-700">
          Attachment
        </label>

        <div className="md:col-span-3">
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
              e.target.value = "";
            }}
          />

          {form.document_url ? (
            <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-slate-50">
              <div className="flex items-center gap-2.5 min-w-0">
                <i className="ri-file-text-line text-[#253C7D] text-lg flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-800 truncate">
                    {form.document_name || "Attachment"}
                  </p>
                  <a
                    href={form.document_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-[#253C7D] hover:underline"
                  >
                    View file
                  </a>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  onChange("document_url", "");
                  onChange("document_name", "");
                }}
                className="text-slate-400 hover:text-rose-500 cursor-pointer p-1 text-sm"
              >
                <i className="ri-close-line" />
              </button>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className="border border-dashed border-slate-300 rounded-lg py-4 px-4 text-center cursor-pointer hover:border-[#253C7D] hover:bg-slate-50/60 transition-all group"
            >
              {uploading ? (
                <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
                  <div className="w-4 h-4 border-2 border-[#253C7D] border-t-transparent rounded-full animate-spin" />
                  <span>Uploading attachment to AWS S3…</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-1.5 text-xs text-slate-600">
                  <i className="ri-upload-cloud-2-line text-sm text-[#253C7D]" />
                  <span>Drop file here or <span className="text-[#253C7D] font-bold underline">Browse</span></span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
