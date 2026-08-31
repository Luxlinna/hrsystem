import { memo } from "react";
import type { Candidate, CandidateDocument } from "../../types";

interface CandidateResumeCardProps {
  candidate: Candidate;
  uploadingResume: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onUploadResume: (file: File) => void;
  onUploadDocuments?: (files: File[]) => void;
  onDeleteDocument?: (url: string) => void;
}

function getFileIcon(name: string, type?: string) {
  const ext = name.split(".").pop()?.toLowerCase() || "";
  if (ext === "pdf" || type?.includes("pdf")) {
    return { icon: "ri-file-pdf-2-line", color: "text-rose-600", bg: "bg-rose-50", border: "border-rose-100" };
  }
  if (["doc", "docx"].includes(ext) || type?.includes("word") || type?.includes("document")) {
    return { icon: "ri-file-word-2-line", color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100" };
  }
  if (["png", "jpg", "jpeg", "webp", "gif"].includes(ext) || type?.startsWith("image/")) {
    return { icon: "ri-image-line", color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" };
  }
  if (["zip", "rar", "7z", "tar"].includes(ext) || type?.includes("zip") || type?.includes("compressed")) {
    return { icon: "ri-file-zip-line", color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100" };
  }
  return { icon: "ri-file-text-line", color: "text-indigo-600", bg: "bg-indigo-50", border: "border-indigo-100" };
}

function formatFileSize(bytes?: number) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const CandidateResumeCard = memo(function CandidateResumeCard({
  candidate,
  uploadingResume,
  fileInputRef,
  onUploadResume,
  onUploadDocuments,
  onDeleteDocument,
}: CandidateResumeCardProps) {
  const documents: CandidateDocument[] = (candidate.documents && candidate.documents.length > 0)
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
      <div className="flex items-center justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 rounded-lg bg-[#253C7D]/10 text-[#253C7D] flex items-center justify-center text-xs font-bold">
              <i className="ri-folder-open-line" />
            </div>
            <h2 className="text-sm font-bold text-gray-900">Candidate Documents & Files</h2>
            <span className="bg-amber-100 text-amber-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1">
              <i className="ri-cloud-line text-xs" /> AWS S3
            </span>
          </div>
          <p className="text-xs text-gray-400">
            Resumes, credentials, certificates, and portfolios stored securely in AWS S3
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

      {documents.length > 0 ? (
        <div className="space-y-2.5">
          {documents.map((doc, idx) => {
            const style = getFileIcon(doc.name, doc.type);
            const sizeLabel = formatFileSize(doc.size);

            return (
              <div
                key={`${doc.url}-${idx}`}
                className="p-3.5 bg-gray-50/90 hover:bg-slate-50 rounded-2xl border border-gray-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-10 h-10 rounded-xl ${style.bg} ${style.color} border ${style.border} flex items-center justify-center font-black text-lg shrink-0 shadow-2xs`}>
                    <i className={style.icon} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xs font-bold text-gray-900 truncate max-w-[280px] sm:max-w-md" title={doc.name}>
                      {doc.name}
                    </h3>
                    <div className="flex items-center gap-2 text-[10px] text-gray-400 font-medium mt-0.5">
                      <span className="text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200/50">
                        AWS S3
                      </span>
                      {sizeLabel && <span>• {sizeLabel}</span>}
                      {doc.uploaded_at && (
                        <span>• {new Date(doc.uploaded_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 text-xs font-bold rounded-xl shadow-2xs transition-colors flex items-center gap-1"
                    title="Open document in new tab"
                  >
                    <i className="ri-eye-line text-xs text-[#253C7D]" /> View
                  </a>
                  <a
                    href={doc.url}
                    download={doc.name}
                    className="px-3 py-1.5 bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 text-xs font-bold rounded-xl shadow-2xs transition-colors flex items-center gap-1"
                    title="Download file"
                  >
                    <i className="ri-download-line text-xs text-gray-600" />
                  </a>
                  {onDeleteDocument && (
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Remove "${doc.name}" from candidate profile?`)) {
                          onDeleteDocument(doc.url);
                        }
                      }}
                      className="w-8 h-8 rounded-xl text-gray-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors cursor-pointer border border-transparent hover:border-rose-100"
                      title="Delete document"
                    >
                      <i className="ri-delete-bin-line text-sm" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
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
