import { memo } from "react";
import type { Candidate } from "../../types";

interface CandidateResumeCardProps {
  candidate: Candidate;
  uploadingResume: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onUploadResume: (file: File) => void;
}

export const CandidateResumeCard = memo(function CandidateResumeCard({
  candidate,
  uploadingResume,
  fileInputRef,
  onUploadResume,
}: CandidateResumeCardProps) {
  return (
    <div className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-2xs">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-5 h-5 rounded-md bg-rose-100 text-rose-600 flex items-center justify-center text-xs font-bold">
          <i className="ri-file-text-line" />
        </div>
        <h2 className="text-sm font-bold text-gray-900">Resume & Candidate Documents</h2>
      </div>
      <p className="text-xs text-gray-400 mb-4">Attached CV document and credential preview</p>

      {candidate.resume_url ? (
        <div className="p-4 bg-gray-50/90 rounded-2xl border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center font-black text-sm shrink-0">
              <i className="ri-file-pdf-2-line text-lg" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-gray-900">
                {candidate.full_name.replace(/\s+/g, "_")}_Resume.pdf
              </h3>
              <p className="text-[11px] text-gray-400">Applicant Curriculum Vitae / Resume Document</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <a
              href={candidate.resume_url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-1.5 bg-[#172B4D] hover:bg-[#0f1d35] text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              <i className="ri-eye-line text-xs" /> View Document
            </a>
            <a
              href={candidate.resume_url}
              download
              className="px-3 py-1.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 text-xs font-bold rounded-xl shadow-2xs transition-colors flex items-center gap-1.5"
            >
              <i className="ri-download-line text-xs" /> Download
            </a>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingResume}
              className="px-3 py-1.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 text-xs font-bold rounded-xl shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <i className="ri-refresh-line text-xs" /> {uploadingResume ? "Uploading..." : "Replace"}
            </button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="p-8 text-center border-2 border-dashed border-gray-200 rounded-2xl hover:bg-gray-50/60 transition-colors cursor-pointer"
        >
          <i className="ri-upload-cloud-2-line text-3xl text-gray-300 mb-2 block" />
          <p className="text-xs font-bold text-gray-700">No CV attached yet</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Click to upload candidate resume (.pdf, .docx)</p>
        </div>
      )}

      <input
        ref={fileInputRef as React.RefObject<HTMLInputElement>}
        type="file"
        className="hidden"
        accept=".pdf,.doc,.docx"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onUploadResume(f);
        }}
      />
    </div>
  );
});
