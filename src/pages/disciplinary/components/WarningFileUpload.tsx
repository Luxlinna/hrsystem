import React from "react";

interface Props {
  documentFile: File | null;
  onFileChange: (file: File | null) => void;
  existingUrl?: string | null;
  existingName?: string | null;
}

export const WarningFileUpload: React.FC<Props> = ({
  documentFile,
  onFileChange,
  existingUrl,
  existingName,
}) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileChange(e.target.files[0]);
    }
  };

  return (
    <div>
      <label className="text-[11px] font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-wider block mb-1.5">
        Upload Signed Warning Letter or Evidence Document
      </label>
      <div className="border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-2xl p-4 text-center hover:border-[#253C7D] transition-colors relative bg-gray-50/50 dark:bg-slate-800/30">
        <input
          type="file"
          id="warning-doc-upload"
          onChange={handleInputChange}
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
        />
        {documentFile ? (
          <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-gray-200 dark:border-slate-700 shadow-xs relative z-20">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-[#253C7D] dark:text-indigo-300 flex items-center justify-center shrink-0">
                <i className="ri-file-shield-line text-lg" />
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-gray-900 dark:text-white truncate max-w-[280px]">
                  {documentFile.name}
                </div>
                <div className="text-[10px] text-gray-400">
                  {(documentFile.size / 1024).toFixed(1)} KB &bull; Ready to upload
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onFileChange(null);
              }}
              className="text-xs font-bold text-rose-500 hover:text-rose-700 px-2.5 py-1.5 rounded-lg hover:bg-rose-50 cursor-pointer transition-colors"
            >
              Remove
            </button>
          </div>
        ) : existingUrl ? (
          <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-gray-200 dark:border-slate-700 shadow-xs relative z-20">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <i className="ri-attachment-line text-lg" />
              </div>
              <div className="text-left">
                <a
                  href={existingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold text-[#253C7D] hover:underline truncate max-w-[280px] block"
                >
                  {existingName || "View Current Attachment"}
                </a>
                <span className="text-[10px] text-gray-400">Attached on file</span>
              </div>
            </div>
            <span className="text-[10px] font-bold text-gray-400">Click dropzone to replace</span>
          </div>
        ) : (
          <div className="space-y-1 py-1">
            <i className="ri-upload-cloud-2-line text-3xl text-gray-400" />
            <div className="text-xs text-gray-700 dark:text-gray-300">
              <span className="font-bold text-[#253C7D] dark:text-indigo-400">Click to upload</span> or drag and drop
            </div>
            <div className="text-[10px] text-gray-400">
              Scanned signed warning letter, incident photos, or meeting minutes (PDF, PNG, JPG up to 15MB)
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
