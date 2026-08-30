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

  const formatUrgentDuration = (hours: number | null | undefined) => {
    const hVal = Number(hours) || 0;
    if (hVal <= 0) return "24 hours";
    const totalMins = Math.round(hVal * 60);
    if (totalMins < 60) return `${totalMins} minute${totalMins !== 1 ? "s" : ""}`;
    const hrs = Math.floor(totalMins / 60);
    const mins = totalMins % 60;
    return mins === 0 ? `${hrs} hour${hrs !== 1 ? "s" : ""}` : `${hrs} hr ${mins} min`;
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

      {/* Urgent duration slider */}
      {form.priority === "urgent" && (
        <div className="p-3.5 bg-rose-50/70 border border-rose-200/80 rounded-2xl space-y-2 animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
              <i className="ri-alarm-warning-line text-rose-600" />
              Acknowledgment Window
            </span>
            <span className="text-xs font-black text-rose-700 bg-rose-100 px-2 py-0.5 rounded-lg">
              {formatUrgentDuration(form.urgent_alert_hours)}
            </span>
          </div>
          <input
            type="range"
            min="1"
            max="72"
            value={form.urgent_alert_hours || 24}
            onChange={(e) => setForm((prev) => ({ ...prev, urgent_alert_hours: Number(e.target.value) }))}
            className="w-full h-1.5 bg-rose-200 rounded-lg appearance-none cursor-pointer accent-rose-600"
          />
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
