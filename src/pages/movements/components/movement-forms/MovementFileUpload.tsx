import React from "react";

interface Props {
  documentFile: File | null;
  onFileChange: (file: File | null) => void;
}

export const MovementFileUpload: React.FC<Props> = ({ documentFile, onFileChange }) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileChange(e.target.files[0]);
    }
  };

  return (
    <div>
      <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-1.5">
        4. Supporting File Upload (Promotion Letter, Evaluation, or Contract)
      </label>
      <div className="border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-xl p-4 text-center hover:border-[#253C7D] transition-colors relative bg-gray-50/40 dark:bg-slate-800/20">
        <input
          type="file"
          id="movement-doc-upload"
          onChange={handleInputChange}
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
        />
        {documentFile ? (
          <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-2 rounded-lg border border-gray-200 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-indigo-50 dark:bg-indigo-950 text-[#253C7D] dark:text-indigo-300 flex items-center justify-center">
                <i className="ri-file-text-line text-lg" />
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-gray-900 dark:text-white truncate max-w-[280px]">
                  {documentFile.name}
                </div>
                <div className="text-[10px] text-gray-400">
                  {(documentFile.size / 1024).toFixed(1)} KB &bull; Attached
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onFileChange(null);
              }}
              className="text-xs text-rose-500 hover:text-rose-700 px-2 py-1"
            >
              Remove
            </button>
          </div>
        ) : (
          <div className="space-y-1">
            <i className="ri-upload-cloud-2-line text-2xl text-gray-400" />
            <div className="text-xs text-gray-600 dark:text-gray-300">
              <span className="font-bold text-[#253C7D] dark:text-indigo-400">Click to upload</span> or drag and drop
            </div>
            <div className="text-[10px] text-gray-400">
              Supports PDF, DOCX, PNG, JPG (up to 15MB)
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
