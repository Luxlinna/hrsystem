import { memo, useRef } from "react";
import type { AnnouncementFormState } from "../types";
import { QUICK_EMOJIS } from "../constants";

interface AnnouncementContentEditorProps {
  form: AnnouncementFormState;
  setForm: React.Dispatch<React.SetStateAction<AnnouncementFormState>>;
}

export const AnnouncementContentEditor = memo(function AnnouncementContentEditor({
  form,
  setForm,
}: AnnouncementContentEditorProps) {
  const contentInputRef = useRef<HTMLTextAreaElement>(null);

  const handleInsertFormatting = (prefix: string, suffix: string = "") => {
    const textarea = contentInputRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const previousContent = form.content;
    const selectedText = previousContent.substring(start, end);
    const replacement = `${prefix}${selectedText || "text"}${suffix}`;
    const newContent = previousContent.substring(0, start) + replacement + previousContent.substring(end);
    setForm((prev) => ({ ...prev, content: newContent }));
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + (selectedText ? selectedText.length : 4));
    }, 0);
  };

  const handleInsertEmoji = (emoji: string) => {
    setForm((prev) => ({ ...prev, content: prev.content + " " + emoji }));
  };

  return (
    <div className="space-y-4">
      {/* Title */}
      <div>
        <label className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider block mb-1.5">
          Announcement Headline <span className="text-rose-500">*</span>
        </label>
        <input
          type="text"
          value={form.title}
          onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
          placeholder="e.g. Mandatory System Maintenance This Saturday..."
          required
          className="w-full px-4 py-2.5 bg-gray-50/80 hover:bg-white focus:bg-white border border-gray-200 rounded-xl text-xs sm:text-sm font-bold text-gray-900 focus:outline-none focus:border-[#253C7D] focus:ring-2 focus:ring-[#253C7D]/10 transition-all"
        />
      </div>

      {/* Urgent notice indicator */}
      {form.priority === "urgent" && (
        <div className="p-3.5 bg-rose-50/70 border border-rose-200/80 rounded-2xl flex items-center justify-between gap-3 animate-in fade-in duration-150">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-8 h-8 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center text-sm font-bold shrink-0">
              <i className="ri-alarm-warning-fill" />
            </span>
            <div className="min-w-0">
              <span className="text-xs font-bold text-rose-950 block">Urgent Broadcast</span>
              <span className="text-[11px] text-rose-700/80 block truncate">
                Uses the alert presentation style &amp; sound tone configured in Settings → Notifications
              </span>
            </div>
          </div>
          <span className="text-[10px] font-extrabold px-2 py-1 rounded-lg bg-rose-600 text-white uppercase tracking-wider shrink-0 shadow-2xs">
            Mandatory Sign-off
          </span>
        </div>
      )}

      {/* Content Editor with formatting toolbar */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">
            Announcement Message &amp; Details <span className="text-rose-500">*</span>
          </label>
          <div className="flex items-center gap-1">
            <button type="button" onClick={() => handleInsertFormatting("**", "**")} className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-[10px] font-bold rounded cursor-pointer">B</button>
            <button type="button" onClick={() => handleInsertFormatting("*", "*")} className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-[10px] italic rounded cursor-pointer">I</button>
            <button type="button" onClick={() => handleInsertFormatting("\n• ")} className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-[10px] rounded cursor-pointer">• List</button>
          </div>
        </div>

        <textarea
          ref={contentInputRef}
          value={form.content}
          onChange={(e) => setForm((prev) => ({ ...prev, content: e.target.value }))}
          rows={5}
          placeholder="Type your company announcement or bulletin message here..."
          required
          className="w-full p-3.5 bg-gray-50/80 hover:bg-white focus:bg-white border border-gray-200 rounded-2xl text-xs text-gray-900 focus:outline-none focus:border-[#253C7D] focus:ring-2 focus:ring-[#253C7D]/10 transition-all font-sans leading-relaxed"
        />

        {/* Emoji Bar */}
        <div className="flex items-center gap-1.5 mt-2 overflow-x-auto pb-1">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider shrink-0">Add:</span>
          {QUICK_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => handleInsertEmoji(emoji)}
              className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-xs rounded-lg transition-colors cursor-pointer shrink-0"
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Pin toggle */}
      <label className="flex items-center gap-2.5 p-3 bg-gray-50 rounded-xl border border-gray-200/80 cursor-pointer">
        <input
          type="checkbox"
          checked={form.pinned}
          onChange={(e) => setForm((prev) => ({ ...prev, pinned: e.target.checked }))}
          className="w-4 h-4 rounded text-[#253C7D] focus:ring-[#253C7D]/20 accent-[#253C7D] cursor-pointer"
        />
        <div>
          <span className="text-xs font-bold text-gray-900">Pin Announcement to Top</span>
          <p className="text-[10px] text-gray-400">Keep this notice pinned at the top of the feed for maximum visibility</p>
        </div>
      </label>
    </div>
  );
});
