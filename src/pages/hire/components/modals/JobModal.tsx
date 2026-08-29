import { memo, useRef } from "react";
import type { Branch, Job, NewJobFormState } from "../../types";

const QUICK_EMOJIS = ["📢", "🎉", "🚨", "📅", "💡", "📌", "🎯", "⚠️", "🌟", "🏆"] as const;

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
    const newContent =
      previousContent.substring(0, start) +
      replacement +
      previousContent.substring(end);
    setForm((prev) => ({ ...prev, description: newContent }));
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + prefix.length,
        start + prefix.length + (selectedText ? selectedText.length : 4)
      );
    }, 0);
  };

  const handleInsertEmoji = (emoji: string) => {
    const textarea = descriptionInputRef.current;
    if (!textarea) {
      setForm((prev) => ({
        ...prev,
        description: (prev.description || "") + (prev.description ? " " : "") + emoji,
      }));
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const previousContent = form.description || "";
    const newContent =
      previousContent.substring(0, start) + emoji + previousContent.substring(end);
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
                onChange={(e) => setForm((prev) => ({ ...prev, branch_id: e.target.value }))}
                className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D] cursor-pointer"
              >
                <option value="">General HQ / Remote</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div>
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                Work Mode
              </label>
              <input
                type="text"
                value={form.location}
                onChange={(e) => setForm((prev) => ({ ...prev, location: e.target.value }))}
                placeholder="On-site, Remote, Hybrid"
                className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D]"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                Employment Type
              </label>
              <select
                value={form.type}
                onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value }))}
                className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D] cursor-pointer"
              >
                <option value="full-time">Full-time</option>
                <option value="part-time">Part-time</option>
                <option value="contract">Contract</option>
                <option value="internship">Internship</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                Closing Date
              </label>
              <input
                type="date"
                value={form.closing_date}
                onChange={(e) => setForm((prev) => ({ ...prev, closing_date: e.target.value }))}
                className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                Min Salary ($)
              </label>
              <input
                type="number"
                value={form.salary_min}
                onChange={(e) => setForm((prev) => ({ ...prev, salary_min: e.target.value }))}
                placeholder="50000"
                className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D]"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                Max Salary ($)
              </label>
              <input
                type="number"
                value={form.salary_max}
                onChange={(e) => setForm((prev) => ({ ...prev, salary_max: e.target.value }))}
                placeholder="80000"
                className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D]"
              />
            </div>
          </div>

          {/* Description & Requirements with Rich Toolbar */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                Description &amp; Requirements
              </label>
              <span className="text-[10px] text-gray-400 font-semibold">
                {(form.description || "").length} characters
              </span>
            </div>

            {/* Formatting Helper Toolbar */}
            <div className="flex items-center gap-1 p-1 bg-gray-100 border border-gray-200 border-b-0 rounded-t-xl overflow-x-auto no-scrollbar">
              <button
                type="button"
                onClick={() => handleInsertFormatting("**", "**")}
                className="px-2 py-1 bg-white hover:bg-slate-100 rounded text-xs font-black text-gray-700 transition-colors cursor-pointer"
                title="Bold"
              >
                B
              </button>
              <button
                type="button"
                onClick={() => handleInsertFormatting("*", "*")}
                className="px-2 py-1 bg-white hover:bg-slate-100 rounded text-xs italic font-serif text-gray-700 transition-colors cursor-pointer"
                title="Italic"
              >
                I
              </button>
              <button
                type="button"
                onClick={() => handleInsertFormatting("• ")}
                className="px-2 py-1 bg-white hover:bg-slate-100 rounded text-xs font-bold text-gray-700 transition-colors cursor-pointer"
                title="Bullet List"
              >
                <i className="ri-list-unordered" />
              </button>
              <button
                type="button"
                onClick={() => handleInsertFormatting("1. ")}
                className="px-2 py-1 bg-white hover:bg-slate-100 rounded text-xs font-bold text-gray-700 transition-colors cursor-pointer"
                title="Numbered List"
              >
                <i className="ri-list-ordered" />
              </button>
              <button
                type="button"
                onClick={() => handleInsertFormatting("> ")}
                className="px-2 py-1 bg-white hover:bg-slate-100 rounded text-xs font-bold text-gray-700 transition-colors cursor-pointer"
                title="Quote / Callout"
              >
                <i className="ri-double-quotes-l" />
              </button>

              <div className="h-4 w-px bg-gray-300 mx-1" />

              {/* Emojis */}
              {QUICK_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => handleInsertEmoji(emoji)}
                  className="px-1.5 py-0.5 hover:bg-white rounded text-xs transition-colors cursor-pointer"
                >
                  {emoji}
                </button>
              ))}
            </div>

            <textarea
              ref={descriptionInputRef}
              rows={4}
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Outline role responsibilities, key qualifications, and tech stack..."
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-b-xl text-xs font-medium text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D] resize-none leading-relaxed"
            />
          </div>

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
              disabled={postingJob || !form.title || !form.department}
              className="px-5 py-2 bg-[#253C7D] hover:bg-[#1E3064] text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer disabled:opacity-50"
            >
              {postingJob ? "Saving..." : editingJob ? "Save Changes" : "Post Vacancy"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});

