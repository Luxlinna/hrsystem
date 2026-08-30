import { memo, useRef } from "react";
import type { Branch, Job, NewJobFormState } from "../../types";
import { JobModalDescriptionEditor } from "./JobModalDescriptionEditor";
import { JobModalSalaryAndMetaFields } from "./JobModalSalaryAndMetaFields";

interface JobModalProps {
  isOpen: boolean;
  editingJob: Job | null;
  form: NewJobFormState;
  setForm: React.Dispatch<React.SetStateAction<NewJobFormState>>;
  branches: Branch[];
  postingJob: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const JobModal = memo(function JobModal({
  isOpen,
  editingJob,
  form,
  setForm,
  branches,
  postingJob,
  onClose,
  onSubmit,
}: JobModalProps) {
  const descriptionInputRef = useRef<HTMLTextAreaElement>(null);

  if (!isOpen) return null;

  const handleInsertFormatting = (prefix: string, suffix: string = "") => {
    const textarea = descriptionInputRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const previousContent = form.description || "";
    const selectedText = previousContent.substring(start, end);
    const replacement = `${prefix}${selectedText || "text"}${suffix}`;
    const newContent = previousContent.substring(0, start) + replacement + previousContent.substring(end);
    setForm((prev) => ({ ...prev, description: newContent }));
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + (selectedText ? selectedText.length : 4));
    }, 0);
  };

  const handleInsertEmoji = (emoji: string) => {
    const textarea = descriptionInputRef.current;
    if (!textarea) {
      setForm((prev) => ({ ...prev, description: (prev.description || "") + (prev.description ? " " : "") + emoji }));
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const previousContent = form.description || "";
    const newContent = previousContent.substring(0, start) + emoji + previousContent.substring(end);
    setForm((prev) => ({ ...prev, description: newContent }));
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + emoji.length, start + emoji.length);
    }, 0);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/40 backdrop-blur-xs overflow-y-auto no-scrollbar"
      onClick={() => !postingJob && onClose()}
    >
      <div
        className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-gray-100/80 overflow-hidden flex flex-col animate-in zoom-in-95 duration-150 max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-gray-100 bg-white flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#253C7D]/10 text-[#253C7D] flex items-center justify-center font-bold text-sm">
              <i className={editingJob ? "ri-edit-line" : "ri-briefcase-line"} />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">
                {editingJob ? "Edit Job Posting" : "Create New Job Opening"}
              </h3>
              <p className="text-[11px] text-gray-400 mt-0.5">
                {editingJob ? "Update vacancy criteria and details" : "Publish a new vacancy to attract talent"}
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

        <form onSubmit={onSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto">
          <div>
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
              Job Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="e.g. Senior Frontend Engineer"
              className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                Department <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={form.department}
                onChange={(e) => setForm((prev) => ({ ...prev, department: e.target.value }))}
                placeholder="e.g. Engineering, Sales"
                className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D]"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                Branch Location
              </label>
              <select
                value={form.branch_id}
                onChange={(e) => {
                  const val = e.target.value;
                  const selected = branches.find((b) => b.id === val);
                  setForm((prev) => ({
                    ...prev,
                    branch_id: val,
                    location: selected ? selected.name : prev.location,
                  }));
                }}
                className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D] cursor-pointer"
              >
                <option value="">All / Remote</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.is_site ? `↳ ${b.name} (Site)` : b.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <JobModalDescriptionEditor
            description={form.description}
            descriptionInputRef={descriptionInputRef}
            onInsertFormatting={handleInsertFormatting}
            onInsertEmoji={handleInsertEmoji}
            onChange={(val) => setForm((prev) => ({ ...prev, description: val }))}
          />

          <JobModalSalaryAndMetaFields form={form} setForm={setForm} />

          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={postingJob}
              className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={postingJob}
              className="px-5 py-2 text-xs font-bold text-white bg-[#253C7D] hover:bg-[#1f336b] rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {postingJob ? "Saving..." : editingJob ? "Save Changes" : "Post Opening"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});
