import React, { useRef } from "react";

interface ProfileResumeCardProps {
  resumeUrl: string | null;
  resumeName: string | null;
  uploadingResume: boolean;
  onResumeUpload: (file: File) => void;
  onRemoveResume: () => void;
}

export function ProfileResumeCard({
  resumeUrl,
  resumeName,
  uploadingResume,
  onResumeUpload,
  onRemoveResume,
}: ProfileResumeCardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onResumeUpload(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-2xs">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
            <i className="ri-file-pdf-fill text-lg"></i>
          </div>
          <div>
            <h4 className="text-[14px] font-bold text-gray-900">Curriculum Vitae (CV) / Resume</h4>
            <p className="text-[12px] text-gray-500">Stored securely on AWS S3 & accessible to hiring panels.</p>
          </div>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx"
        onChange={handleFileChange}
        className="hidden"
      />

      {resumeUrl ? (
        <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-12 h-12 rounded-xl bg-white border border-gray-200 text-rose-600 flex items-center justify-center shrink-0 shadow-xs">
              <i className="ri-file-pdf-2-fill text-2xl"></i>
            </div>
            <div className="truncate">
              <a
                href={resumeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[13px] font-bold text-gray-900 hover:text-[#253C7D] hover:underline truncate block"
              >
                {resumeName || "Master_Resume.pdf"}
              </a>
              <div className="flex items-center gap-2 text-[11px] text-gray-500 mt-0.5">
                <span className="flex items-center gap-1 text-emerald-600 font-medium">
                  <i className="ri-checkbox-circle-fill text-[12px]"></i> AWS S3 Verified
                </span>
                <span>&middot;</span>
                <span>PDF Document</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href={resumeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-[#253C7D] text-white hover:bg-[#1E3064] text-[12px] font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <i className="ri-eye-line"></i> View / Download
            </a>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingResume}
              className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 hover:bg-gray-100 text-[12px] font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <i className="ri-upload-2-line"></i> Replace
            </button>
            <button
              type="button"
              onClick={onRemoveResume}
              className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors text-[14px] cursor-pointer"
              title="Remove CV"
            >
              <i className="ri-delete-bin-line"></i>
            </button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="p-8 border-2 border-dashed border-gray-300 hover:border-[#253C7D] rounded-2xl bg-gray-50/50 hover:bg-blue-50/20 transition-all text-center cursor-pointer group"
        >
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#253C7D] group-hover:scale-110 transition-transform flex items-center justify-center mx-auto mb-3">
            {uploadingResume ? (
              <i className="ri-loader-4-line animate-spin text-2xl"></i>
            ) : (
              <i className="ri-upload-cloud-2-line text-2xl"></i>
            )}
          </div>
          <h5 className="text-[13px] font-bold text-gray-800">
            {uploadingResume ? "Uploading CV to AWS S3..." : "Click or drag to upload your CV"}
          </h5>
          <p className="text-[11px] text-gray-400 mt-1">Supports PDF, DOC, DOCX up to 10MB</p>
        </div>
      )}
    </div>
  );
}
