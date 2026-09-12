import { memo } from "react";
import type { Candidate, CandidateDocument, OfferLetter } from "../../types";
import { CandidateDocumentItem } from "./CandidateDocumentItem";

interface CandidateResumeCardProps {
  candidate: Candidate;
  uploadingResume: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onUploadResume: (file: File) => void;
  onUploadDocuments?: (files: File[]) => void;
  onDeleteDocument?: (url: string) => void;
  activeOffer?: OfferLetter | null;
  onExportOfferPdf?: (offer: OfferLetter) => void;
  onExportOfferWord?: (offer: OfferLetter) => void;
}

export const CandidateResumeCard = memo(function CandidateResumeCard({
  candidate,
  uploadingResume,
  fileInputRef,
  onUploadResume,
  onUploadDocuments,
  onDeleteDocument,
  activeOffer,
  onExportOfferPdf,
  onExportOfferWord,
}: CandidateResumeCardProps) {
  const documents: CandidateDocument[] =
    candidate.documents && candidate.documents.length > 0
      ? candidate.documents
      : candidate.resume_url
      ? [{ name: candidate.resume_name || `${candidate.full_name.replace(/\s+/g, "_")}_Resume.pdf`, url: candidate.resume_url }]
      : [];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    if (onUploadDocuments && files.length > 0) {
      onUploadDocuments(Array.from(files));
    } else if (files[0]) {
      onUploadResume(files[0]);
    }
    e.target.value = "";
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-2xs">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 rounded-lg bg-[#253C7D]/10 text-[#253C7D] flex items-center justify-center text-xs font-bold">
              <i className="ri-folder-open-line" />
            </div>
            <h2 className="text-sm font-bold text-gray-900">Candidate Documents &amp; Files</h2>
            <span className="bg-amber-100 text-amber-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1">
              <i className="ri-cloud-line text-xs" /> AWS S3 &amp; Records
            </span>
          </div>
          <p className="text-xs text-gray-400">
            Resumes, signed acceptance records, and credentials stored securely in AWS S3 &amp; System Archives
          </p>
        </div>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadingResume}
          className="px-3.5 py-1.5 bg-[#253C7D] hover:bg-[#1E3064] text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
        >
          {uploadingResume ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Uploading...</span>
            </>
          ) : (
            <>
              <i className="ri-upload-2-line" />
              <span>Upload Files</span>
            </>
          )}
        </button>
      </div>

      {/* Document List */}
      {documents.length > 0 ? (
        <div className="space-y-2.5">
          {documents.map((doc, idx) => (
            <CandidateDocumentItem
              key={`${doc.url}-${idx}`}
              doc={doc}
              candidate={candidate}
              activeOffer={activeOffer}
              onDeleteDocument={onDeleteDocument}
              onExportOfferPdf={onExportOfferPdf}
              onExportOfferWord={onExportOfferWord}
            />
          ))}
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="p-8 text-center border-2 border-dashed border-gray-200 hover:border-[#253C7D] rounded-2xl hover:bg-slate-50/60 transition-colors cursor-pointer"
        >
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center text-2xl mx-auto mb-2.5">
            <i className="ri-upload-cloud-2-line" />
          </div>
          <p className="text-xs font-bold text-gray-800">No documents attached yet</p>
          <p className="text-[11px] text-gray-400 mt-0.5">
            Click to upload resumes, certificates, and candidate files (.pdf, .docx, .png, .jpg) to AWS S3
          </p>
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef as React.RefObject<HTMLInputElement>}
        type="file"
        multiple
        className="hidden"
        accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp,.zip"
        onChange={handleFileChange}
      />
    </div>
  );
});
