import React, { useRef } from "react";

interface Props {
  attachmentFile: File | null;
  setAttachmentFile: (file: File | null) => void;
}

export const ChangeStatusAttachmentSection: React.FC<Props> = ({
  attachmentFile,
  setAttachmentFile,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setAttachmentFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  return (
    <div>
      <h3 className="text-[11px] font-bold text-[#0284c7] uppercase tracking-wider mb-3">
        ATTACHMENT INFO
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-start">
        <label className="md:col-span-3 text-xs font-medium text-slate-600 dark:text-slate-300 md:text-right pr-2 pt-2">
          Attachment
        </label>
        <div className="md:col-span-9">
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => fileInputRef.current?.click()}
            className="border border-dashed border-slate-300 dark:border-slate-700 rounded-md p-4 text-center hover:border-sky-500 dark:hover:border-sky-400 bg-slate-50/40 dark:bg-slate-800/40 transition-colors cursor-pointer"
          >
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
            {attachmentFile ? (
              <div className="flex items-center justify-center gap-2 text-xs text-slate-700 dark:text-slate-200">
                <i className="ri-file-text-line text-sky-600 text-base" />
                <span className="font-medium truncate max-w-xs">{attachmentFile.name}</span>
                <span className="text-[10px] text-slate-400">
                  ({(attachmentFile.size / 1024).toFixed(1)} KB)
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setAttachmentFile(null);
                  }}
                  className="ml-2 text-rose-500 hover:text-rose-700 p-0.5"
                  title="Remove file"
                >
                  <i className="ri-close-line text-sm" />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
                <i className="ri-upload-cloud-2-line text-sm text-slate-400" />
                <span>Drop file here or</span>
                <span className="text-sky-600 dark:text-sky-400 hover:underline font-medium">
                  Browse
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
