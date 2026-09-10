import { memo, useMemo, useState } from "react";
import type { Branch, Candidate, Job, NewCandidateFormState } from "../../types";
import type { SearchableEmployee } from "@/components/EmployeeSearchSelect";
import { CANDIDATE_SOURCES, NOTICE_PERIOD_OPTIONS } from "../../constants";
import { extractCv, type ExtractedCvData } from "../../utils/cvExtractor";
import { queryCandidateDuplicates, findDuplicateCandidate, type DuplicateMatchResult } from "../../utils/cvDuplicateMatcher";
import { DuplicateCandidateWarningModal } from "./DuplicateCandidateWarningModal";

interface CandidateModalProps {
  isOpen: boolean;
  editingCandidate: Candidate | null;
  form: NewCandidateFormState;
  setForm: React.Dispatch<React.SetStateAction<NewCandidateFormState>>;
  jobs: Job[];
  candidates?: Candidate[];
  allCandidates?: Candidate[];
  employees?: SearchableEmployee[];
  branches?: Branch[];
  isHrDivisionBranch?: boolean;
  candidateFiles?: File[];
  setCandidateFiles?: React.Dispatch<React.SetStateAction<File[]>>;
  resumeFile?: File | null;
  setResumeFile?: (file: File | null) => void;
  uploadingResume: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onMergeCandidate?: (existingCandidateId: string) => Promise<boolean>;
}

export const CandidateModal = memo(function CandidateModal({
  isOpen,
  editingCandidate,
  form,
  setForm,
  jobs,
  candidates = [],
  allCandidates = [],
  employees = [],
  branches = [],
  isHrDivisionBranch = false,
  candidateFiles = [],
  setCandidateFiles,
  resumeFile,
  setResumeFile,
  uploadingResume,
  onClose,
  onSubmit,
  onMergeCandidate,
}: CandidateModalProps) {
  const [analyzingCv, setAnalyzingCv] = useState(false);
  const [duplicateWarningOpen, setDuplicateWarningOpen] = useState(false);
  const [duplicateMatchResult, setDuplicateMatchResult] = useState<DuplicateMatchResult | null>(null);
  const [lastExtractedData, setLastExtractedData] = useState<ExtractedCvData | null>(null);
  const [uploadedCvFile, setUploadedCvFile] = useState<File | null>(null);
  const [merging, setMerging] = useState(false);
  const [bypassDuplicateCheck, setBypassDuplicateCheck] = useState(false);

  // Determine if the current candidate workflow is strictly HR Division BU
  const isTargetHrDivision = useMemo(() => {
    // If candidate has a target vacancy with a branch assigned, check that branch
    if (form.job_posting_id) {
      const job = jobs.find((j) => j.id === form.job_posting_id);
      if (job && job.branch_id) {
        const jobBranch = branches.find((b) => b.id === job.branch_id);
        if (jobBranch) {
          return /hr\s*division/i.test(jobBranch.name);
        }
      }
    }
    return Boolean(isHrDivisionBranch);
  }, [form.job_posting_id, jobs, branches, isHrDivisionBranch]);

  // Only employees belonging to HR Division or holding HR / Recruiter roles are eligible recruiters
  const hrEmployees = useMemo(() => {
    const hrBranchIds = new Set(
      (branches || [])
        .filter((b) => /hr\s*division|human\s*resource/i.test(b.name))
        .map((b) => b.id)
    );

    return employees.filter((emp) => {
      // Always retain if already assigned to this candidate so existing data is never hidden
      if (form.assigned_recruiter_id && emp.id === form.assigned_recruiter_id) return true;

      // 1. Employee is assigned to the "HR Division" branch
      if (emp.branch_id && hrBranchIds.has(emp.branch_id)) return true;

      // 2. Employee is in the HR department
      const dept = (emp.department || "").trim().toLowerCase();
      if (/^(hr|human\s*resources?|recruitment|talent|people)$/i.test(dept) || /hr\s*division/i.test(dept)) return true;

      // 3. Employee has an HR / Recruiter / Super Admin role
      const role = (emp.role || "").trim().toLowerCase();
      if (/(^|\b)(hr|recruiter|recruitment|talent|human\s*resources?)(\b|$)/i.test(role) || /super\s*admin/i.test(role)) return true;

      // 4. Employee name mentions HR Admin
      const fullName = `${emp.first_name || ""} ${emp.last_name || ""}`.toLowerCase();
      if (/hr\s*admin/i.test(fullName)) return true;

      return false;
    });
  }, [employees, branches, form.assigned_recruiter_id]);

  if (!isOpen) return null;

  const currentFiles: File[] = candidateFiles.length > 0
    ? candidateFiles
    : resumeFile
    ? [resumeFile]
    : [];

  const handleAddFiles = async (newFiles: FileList | null) => {
    if (!newFiles || newFiles.length === 0) return;
    const fileList = Array.from(newFiles);
    if (setCandidateFiles) {
      setCandidateFiles((prev) => [...prev, ...fileList]);
    } else if (setResumeFile && fileList[0]) {
      setResumeFile(fileList[0]);
    }

    const primaryFile = fileList.find((f) => /\.(pdf|docx|txt|rtf)$/i.test(f.name)) || fileList[0];
    if (primaryFile) {
      setUploadedCvFile(primaryFile);
      setAnalyzingCv(true);
      try {
        const extracted = await extractCv(primaryFile);
        setLastExtractedData(extracted);

        // Auto-fill form fields if currently empty
        setForm((prev) => ({
          ...prev,
          full_name: prev.full_name || extracted.full_name || "",
          email: prev.email || extracted.email || "",
          phone: prev.phone || extracted.phone || "",
          location: prev.location || extracted.location || "",
          education: prev.education || extracted.education || "",
          work_experience: prev.work_experience || extracted.work_experience || "",
          skills: prev.skills || (extracted.skills ? extracted.skills.join(", ") : ""),
          languages: prev.languages || (extracted.languages ? extracted.languages.join(", ") : ""),
        }));

        // Run duplicate detection against database candidates and compare with the newly uploaded CV
        if (!bypassDuplicateCheck && !editingCandidate) {
          const candidatePool = allCandidates.length > 0 ? allCandidates : candidates;
          const match = await queryCandidateDuplicates(
            primaryFile,
            extracted,
            candidatePool,
            editingCandidate?.id
          );
          if (match.isDuplicate) {
            setDuplicateMatchResult(match);
            setDuplicateWarningOpen(true);
          }
        }
      } catch (err) {
        console.warn("CV extraction error:", err);
      } finally {
        setAnalyzingCv(false);
      }
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

  const handleViewCandidate = (candidateId: string) => {
    window.open(`/hire?tab=candidates&highlight=${candidateId}`, "_blank");
  };

  const handleMerge = async (existingCandidateId: string) => {
    if (!onMergeCandidate) return;
    setMerging(true);
    try {
      const success = await onMergeCandidate(existingCandidateId);
      if (success) {
        setDuplicateWarningOpen(false);
        onClose();
      }
    } finally {
      setMerging(false);
    }
  };

  const handleCreateNew = () => {
    setBypassDuplicateCheck(true);
    setDuplicateWarningOpen(false);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bypassDuplicateCheck && !editingCandidate) {
      const manualExtracted: ExtractedCvData = {
        full_name: form.full_name,
        email: form.email,
        phone: form.phone,
        education: form.education,
        work_experience: form.work_experience,
        skills: form.skills ? form.skills.split(/[,;\n]+/).map((s) => s.trim()) : [],
      };
      const candidatePool = allCandidates.length > 0 ? allCandidates : candidates;
      const match = await queryCandidateDuplicates(
        uploadedCvFile || (candidateFiles[0] ?? resumeFile ?? null),
        manualExtracted,
        candidatePool,
        editingCandidate?.id
      );
      if (match.isDuplicate) {
        setDuplicateMatchResult(match);
        setLastExtractedData(manualExtracted);
        setDuplicateWarningOpen(true);
        return;
      }
    }
    onSubmit(e);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/40 backdrop-blur-xs overflow-y-auto no-scrollbar"
      onClick={() => !uploadingResume && onClose()}
    >
      <div
        className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl border border-gray-100/80 overflow-hidden flex flex-col animate-in zoom-in-95 duration-150 max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 bg-white flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#253C7D]/10 text-[#253C7D] flex items-center justify-center font-bold text-base">
              <i className={editingCandidate ? "ri-user-settings-line" : "ri-user-add-line"} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-gray-900">
                  {editingCandidate ? "Edit Candidate Master Profile" : "New Candidate Master Profile"}
                </h3>
                <span className="px-2 py-0.5 rounded-md bg-blue-50 border border-blue-200 text-blue-800 text-[10px] font-mono font-bold">
                  {editingCandidate?.candidate_code || "CAN-2026-XXXXXX (Auto)"}
                </span>
              </div>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Reusable candidate record across all current and future job applications
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

        {/* Form Body */}
        <form onSubmit={handleFormSubmit} className="p-6 space-y-6 overflow-y-auto">
          {/* Section 1: Contact & Personal Info */}
          <div className="p-4 bg-gray-50/70 rounded-2xl border border-gray-100 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700">
              <i className="ri-user-line text-[#253C7D]" />
              <span>Contact & Identity</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  placeholder="e.g. Sarah Jenkins"
                  className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:outline-none focus:border-[#253C7D]"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                  Location / City
                </label>
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  placeholder="e.g. Phnom Penh, Cambodia (or Remote)"
                  className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:outline-none focus:border-[#253C7D]"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="sarah@example.com"
                  className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:outline-none focus:border-[#253C7D]"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+855 12 345 678"
                  className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:outline-none focus:border-[#253C7D]"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Compensation & Availability */}
          <div className="p-4 bg-gray-50/70 rounded-2xl border border-gray-100 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700">
              <i className="ri-money-dollar-circle-line text-emerald-600" />
              <span>Compensation & Availability</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                  Expected Salary (USD / Month)
                </label>
                <input
                  type="number"
                  min="0"
                  step="50"
                  value={form.expected_salary}
                  onChange={(e) => setForm({ ...form, expected_salary: e.target.value })}
                  placeholder="e.g. 1200"
                  className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:outline-none focus:border-[#253C7D]"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                  Notice Period
                </label>
                <select
                  value={form.notice_period}
                  onChange={(e) => setForm({ ...form, notice_period: e.target.value })}
                  className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:outline-none focus:border-[#253C7D] cursor-pointer"
                >
                  {NOTICE_PERIOD_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Professional Background */}
          <div className="p-4 bg-gray-50/70 rounded-2xl border border-gray-100 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700">
              <i className="ri-graduation-cap-line text-purple-600" />
              <span>Education, Experience & Skills</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                  Education Background
                </label>
                <input
                  type="text"
                  value={form.education}
                  onChange={(e) => setForm({ ...form, education: e.target.value })}
                  placeholder="e.g. B.S. Computer Science, RUPP"
                  className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:outline-none focus:border-[#253C7D]"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                  Work Experience Summary
                </label>
                <input
                  type="text"
                  value={form.work_experience}
                  onChange={(e) => setForm({ ...form, work_experience: e.target.value })}
                  placeholder="e.g. 4+ years as Full Stack Engineer at TechCorp"
                  className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:outline-none focus:border-[#253C7D]"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                  Core Skills (Comma-separated)
                </label>
                <input
                  type="text"
                  value={form.skills}
                  onChange={(e) => setForm({ ...form, skills: e.target.value })}
                  placeholder="e.g. React, Node.js, PostgreSQL, Docker"
                  className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:outline-none focus:border-[#253C7D]"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                  Languages Spoken
                </label>
                <input
                  type="text"
                  value={form.languages}
                  onChange={(e) => setForm({ ...form, languages: e.target.value })}
                  placeholder="e.g. English (Fluent), Khmer (Native)"
                  className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:outline-none focus:border-[#253C7D]"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Recruitment & Sourcing Details */}
          <div className="p-4 bg-gray-50/70 rounded-2xl border border-gray-100 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700">
              <i className="ri-compass-3-line text-blue-600" />
              <span>Sourcing Channel & Recruiter Assignment</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                  Target Vacancy <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={form.job_posting_id}
                  onChange={(e) => setForm({ ...form, job_posting_id: e.target.value })}
                  className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:outline-none focus:border-[#253C7D] cursor-pointer"
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
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                  Sourcing Channel
                </label>
                <select
                  value={form.source}
                  onChange={(e) => setForm({ ...form, source: e.target.value })}
                  className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:outline-none focus:border-[#253C7D] cursor-pointer"
                >
                  {CANDIDATE_SOURCES.map((src) => (
                    <option key={src} value={src}>
                      {src}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                  Assigned Recruiter (HR Division)
                </label>
                <select
                  value={form.assigned_recruiter_id}
                  onChange={(e) => setForm({ ...form, assigned_recruiter_id: e.target.value })}
                  className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:outline-none focus:border-[#253C7D] cursor-pointer"
                >
                  <option value="">Unassigned</option>
                  {hrEmployees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.first_name} {emp.last_name} ({emp.role || emp.department || "HR"})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                  Tags (e.g. #Senior, #FastTrack)
                </label>
                <input
                  type="text"
                  value={form.tags}
                  onChange={(e) => setForm({ ...form, tags: e.target.value })}
                  placeholder="e.g. Senior, Urgent, Executive"
                  className="w-full px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:outline-none focus:border-[#253C7D]"
                />
              </div>
            </div>
          </div>

          {/* Section 5: Multiple Documents & CV Upload (AWS S3) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                <span>CV & Supporting Documents</span>
                <span className="bg-amber-100 text-amber-800 text-[9px] font-extrabold px-1.5 py-0.2 rounded-md">
                  AWS S3
                </span>
                <span className="bg-blue-50 text-blue-700 border border-blue-200/70 text-[9px] font-extrabold px-2 py-0.2 rounded-md flex items-center gap-1">
                  <i className="ri-file-text-line text-blue-600" />
                  Built-in CV Parser
                </span>
              </label>
              <span className="text-[10px] text-gray-400 font-medium">Multiple files allowed</span>
            </div>

            <label className="border-2 border-dashed border-gray-200 hover:border-[#253C7D] hover:bg-slate-50/60 rounded-2xl p-3.5 flex flex-col items-center justify-center cursor-pointer transition-all">
              <i className="ri-upload-cloud-2-line text-2xl text-[#253C7D] mb-1" />
              <p className="text-xs font-bold text-gray-700">Choose or drag candidate CV & files</p>
              <p className="text-[10px] text-gray-400 mt-0.5">Resume, Portfolio, Certificates, ID (.pdf, .docx, .png, .jpg)</p>
              <input
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp,.zip"
                onChange={(e) => handleAddFiles(e.target.files)}
                className="hidden"
              />
            </label>

            {analyzingCv && (
              <div className="mt-2.5 p-3.5 bg-slate-50 border border-slate-200/90 rounded-2xl flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#253C7D] text-white flex items-center justify-center font-bold text-sm shrink-0">
                  <i className="ri-loader-4-line animate-spin" />
                </div>
                <div className="text-xs">
                  <p className="font-bold text-slate-900">
                    Parsing CV & Checking Duplicate Candidates...
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Extracting candidate data and cross-referencing database records
                  </p>
                </div>
              </div>
            )}

            {currentFiles.length > 0 && (
              <div className="mt-2.5 space-y-1.5 max-h-32 overflow-y-auto pr-1">
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

          {/* Section 6: Recruiter Notes */}
          <div>
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
              Recruiter Evaluation Notes
            </label>
            <textarea
              rows={2}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Candidate background notes, preliminary screening impressions, salary fit..."
              className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D]"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2 shrink-0">
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
                "Save Profile Changes"
              ) : (
                "Register Candidate"
              )}
            </button>
          </div>
        </form>
      </div>

      {duplicateWarningOpen && duplicateMatchResult && (
        <DuplicateCandidateWarningModal
          isOpen={duplicateWarningOpen}
          matchResult={duplicateMatchResult}
          extractedData={lastExtractedData || {}}
          newFile={uploadedCvFile}
          onClose={() => setDuplicateWarningOpen(false)}
          onViewCandidate={handleViewCandidate}
          onMerge={handleMerge}
          onCreateNew={handleCreateNew}
          merging={merging}
        />
      )}
    </div>
  );
});
