import { memo } from "react";
import type { Candidate, Job, NewCandidateFormState } from "../../types";

interface CandidateModalProps {
  isOpen: boolean;
  editingCandidate: Candidate | null;
  form: NewCandidateFormState;
  setForm: React.Dispatch<React.SetStateAction<NewCandidateFormState>>;
  jobs: Job[];
  candidateFiles?: File[];
  setCandidateFiles?: React.Dispatch<React.SetStateAction<File[]>>;
  resumeFile?: File | null;
  setResumeFile?: (file: File | null) => void;
  uploadingResume: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const CandidateModal = memo(function CandidateModal({
  isOpen,
  editingCandidate,
  form,
  setForm,
  jobs,
  candidateFiles = [],
  setCandidateFiles,
  resumeFile,
  setResumeFile,
  uploadingResume,
  onClose,
  onSubmit,
}: CandidateModalProps) {
  if (!isOpen) return null;

  const currentFiles: File[] = candidateFiles.length > 0
    ? candidateFiles
    : resumeFile
    ? [resumeFile]
    : [];

  const handleAddFiles = (newFiles: FileList | null) => {
    if (!newFiles) return;
    const fileList = Array.from(newFiles);
    if (setCandidateFiles) {
      setCandidateFiles((prev) => [...prev, ...fileList]);
    } else if (setResumeFile && fileList[0]) {
      setResumeFile(fileList[0]);
    }
  };

  const handleRemoveFile = (index: number) => {
    if (setCandidateFiles) {
      setCandidateFiles((prev) => prev.filter((_, i) => i !== index));
    } else if (setResumeFile) {
      setResumeFile(null);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/40 backdrop-blur-xs overflow-y-auto no-scrollbar"
      onClick={() => !uploadingResume && onClose()}
    >
      <div
        className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-gray-100/80 overflow-hidden flex flex-col animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-gray-100 bg-white flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#253C7D]/10 text-[#253C7D] flex items-center justify-center font-bold text-sm">
              <i className={editingCandidate ? "ri-edit-line" : "ri-user-add-line"} />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">
                {editingCandidate ? "Edit Candidate Profile" : "Add Candidate Application"}
              </h3>
              <p className="text-[11px] text-gray-400 mt-0.5">
                {editingCandidate ? "Update candidate credentials" : "Track applicant in recruitment pipeline"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 flex items-center justify-center transition-colors cursor-pointer"
          >
            <i className="ri-close-line text-lg" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-5 sm:p-6 space-y-4">
          <div>
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
              Full Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              placeholder="e.g. Sarah Jenkins"
              className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                Email Address <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="sarah@example.com"
                className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D]"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                Phone Number
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+1 555-0199"
                className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                Target Vacancy <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={form.job_posting_id}
                onChange={(e) => setForm({ ...form, job_posting_id: e.target.value })}
                className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D] cursor-pointer"
              >
                <option value="">Select a vacancy...</option>
                {jobs.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.title} ({j.department})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                Sourcing Channel
              </label>
              <select
                value={form.source}
                onChange={(e) => setForm({ ...form, source: e.target.value })}
                className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D] cursor-pointer"
              >
                <option value="LinkedIn">LinkedIn</option>
                <option value="Direct Website">Direct Website</option>
                <option value="Employee Referral">Employee Referral</option>
                <option value="Agency">Agency</option>
                <option value="Job Board">Job Board</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* Multiple Documents / Files Upload (AWS S3) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                <span>Candidate Documents & Files</span>
                <span className="bg-amber-100 text-amber-800 text-[9px] font-extrabold px-1.5 py-0.2 rounded-md">
                  AWS S3
                </span>
              </label>
              <span className="text-[10px] text-gray-400 font-medium">Multiple files allowed</span>
            </div>

            <label className="border-2 border-dashed border-gray-200 hover:border-[#253C7D] hover:bg-slate-50/60 rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer transition-all">
              <i className="ri-upload-cloud-2-line text-2xl text-[#253C7D] mb-1" />
              <p className="text-xs font-bold text-gray-700">Choose or drag candidate documents</p>
              <p className="text-[10px] text-gray-400 mt-0.5">Resume, Portfolio, Certificates, ID (.pdf, .docx, .png, .jpg)</p>
              <input
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp,.zip"
                onChange={(e) => handleAddFiles(e.target.files)}
                className="hidden"
              />
            </label>

            {/* Selected files preview */}
            {currentFiles.length > 0 && (
              <div className="mt-2.5 space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {currentFiles.map((file, idx) => (
                  <div
                    key={`${file.name}-${idx}`}
                    className="flex items-center justify-between p-2 bg-slate-50 border border-slate-200/70 rounded-xl text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <i className="ri-file-3-line text-[#253C7D] shrink-0 text-sm" />
                      <span className="font-bold text-gray-800 truncate max-w-[240px]">{file.name}</span>
                      <span className="text-[10px] text-gray-400 shrink-0">({formatFileSize(file.size)})</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(idx)}
                      className="w-6 h-6 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors cursor-pointer"
                      title="Remove file"
                    >
                      <i className="ri-close-line text-sm" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
              Initial Notes & Evaluation
            </label>
            <textarea
              rows={2}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Candidate background notes, salary expectations, screening impression..."
              className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D]"
            />
          </div>

          <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploadingResume || !form.full_name || !form.email || !form.job_posting_id}
              className="px-5 py-2 bg-[#253C7D] hover:bg-[#1E3064] text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              {uploadingResume ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Uploading to AWS S3...</span>
                </>
              ) : editingCandidate ? (
                "Save Changes"
              ) : (
                "Add Candidate"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});
