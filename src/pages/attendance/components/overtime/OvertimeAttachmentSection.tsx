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
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-gray-200/80 dark:border-slate-800 shadow-2xs space-y-4">
      <div className="flex items-center gap-2 pb-2.5 border-b border-gray-100 dark:border-slate-800">
        <span className="w-6 h-6 rounded-lg bg-[#253C7D]/10 text-[#253C7D] dark:text-sky-400 flex items-center justify-center text-xs">
          <i className="ri-attachment-line font-bold" />
        </span>
        <h3 className="text-xs font-bold text-gray-900 dark:text-slate-100 uppercase tracking-wider">
          Attachment (Optional)
        </h3>
      </div>

      <div>
        <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5">
          Upload Supporting Document or Signed Approval
        </label>

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
          className="w-full border-2 border-dashed border-gray-200 dark:border-slate-700 hover:border-[#253C7D] dark:hover:border-sky-500 rounded-2xl p-5 text-center cursor-pointer transition-all bg-gray-50/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 group"
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
                className="text-gray-400 hover:text-rose-500 p-1 cursor-pointer"
              >
                <i className="ri-close-line text-sm" />
              </button>
            </div>
          ) : (
            <div className="space-y-1">
              <div className="w-9 h-9 rounded-xl bg-[#253C7D]/10 text-[#253C7D] dark:text-sky-400 flex items-center justify-center mx-auto text-lg mb-1 group-hover:scale-110 transition-transform">
                <i className="ri-upload-cloud-2-line" />
              </div>
              <p className="text-xs font-bold text-gray-700 dark:text-slate-200">
                Click to upload <span className="font-normal text-gray-400">or drag & drop</span>
              </p>
              <p className="text-[10px] text-gray-400">PDF, PNG, JPG up to 10MB</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
