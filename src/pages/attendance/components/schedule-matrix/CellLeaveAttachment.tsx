import { memo, useRef, useState } from "react";

interface CellLeaveAttachmentProps {
  attachmentFile: File | null;
  setAttachmentFile: (f: File | null) => void;
}

export const CellLeaveAttachment = memo(function CellLeaveAttachment({
  attachmentFile,
  setAttachmentFile,
}: CellLeaveAttachmentProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-slate-800">
      <h3 className="text-xs font-bold text-[#0284c7] uppercase tracking-wider">
        ATTACHMENT INFO
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-start">
        <label className="sm:col-span-3 text-right font-medium text-gray-700 dark:text-slate-300 pt-2">
          Attachment
        </label>
        <div className="sm:col-span-9">
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) setAttachmentFile(f);
            }}
          />
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragOver(false);
              const f = e.dataTransfer.files?.[0];
              if (f) setAttachmentFile(f);
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`w-full border border-dashed rounded-md py-5 px-4 text-center cursor-pointer transition-colors ${
              isDragOver
                ? "border-[#0284c7] bg-sky-50 dark:bg-sky-950/40"
                : "border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-gray-400"
            }`}
          >
            <div className="flex items-center justify-center gap-1.5 text-xs text-gray-600 dark:text-slate-400">
              <i className="ri-upload-cloud-2-line text-base text-gray-400" />
              {attachmentFile ? (
                <span className="font-semibold text-[#0284c7]">{attachmentFile.name}</span>
              ) : (
                <>
                  <span>Drop file here or</span>
                  <span className="text-[#0284c7] font-semibold hover:underline">Browse</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
