import { memo, useRef } from "react";

interface OvertimeAttachmentSectionProps {
  attachmentFile: File | null;
  setAttachmentFile: (file: File | null) => void;
}

export const OvertimeAttachmentSection = memo(function OvertimeAttachmentSection({
  attachmentFile,
  setAttachmentFile,
}: OvertimeAttachmentSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setAttachmentFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-gray-200/80 dark:border-slate-800 shadow-2xs space-y-4">
      <h3 className="text-xs font-bold text-[#253C7D] dark:text-sky-400 uppercase tracking-wider pb-3 border-b border-gray-100 dark:border-slate-800 flex items-center gap-2">
        <i className="ri-attachment-line text-sm" /> Attachment Info
      </h3>

      <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-6">
        <label className="sm:w-36 text-xs font-bold text-gray-700 dark:text-slate-300 sm:text-right shrink-0 pt-2">
          Attachment
        </label>

        <div className="w-full sm:max-w-md">
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                setAttachmentFile(e.target.files[0]);
              }
            }}
          />

          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-200 dark:border-slate-700 hover:border-[#253C7D] dark:hover:border-sky-500 rounded-2xl p-4 text-center cursor-pointer transition-all bg-gray-50/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 group"
          >
            {attachmentFile ? (
              <div className="flex items-center justify-between gap-3 text-left">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center shrink-0">
                    <i className="ri-file-text-line text-base" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-gray-900 dark:text-slate-100 truncate">{attachmentFile.name}</p>
                    <p className="text-[10px] text-gray-400">{(attachmentFile.size / 1024).toFixed(1)} KB</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setAttachmentFile(null);
                  }}
                  className="w-6 h-6 rounded-full hover:bg-rose-50 text-gray-400 hover:text-rose-600 flex items-center justify-center cursor-pointer"
                  title="Remove file"
                >
                  <i className="ri-close-line text-sm" />
                </button>
              </div>
            ) : (
              <div className="py-2 flex flex-col items-center justify-center">
                <div className="w-9 h-9 rounded-xl bg-[#253C7D]/10 dark:bg-sky-950/50 text-[#253C7D] dark:text-sky-400 flex items-center justify-center mb-1 group-hover:scale-105 transition-transform">
                  <i className="ri-upload-cloud-2-line text-lg" />
                </div>
                <p className="text-xs font-semibold text-gray-700 dark:text-slate-300">
                  Drop file here or <span className="text-[#253C7D] dark:text-sky-400 font-bold underline">Browse</span>
                </p>
                <p className="text-[10px] text-gray-400 mt-0.5">Supports PDF, DOCX, PNG, JPG (Max 15MB)</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});
