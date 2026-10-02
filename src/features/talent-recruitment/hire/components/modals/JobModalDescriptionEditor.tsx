import { memo } from "react";

const QUICK_EMOJIS = ["📢", "🎉", "🚨", "📅", "💡", "📌", "🎯", "⚠️", "🌟", "🏆"] as const;

interface JobModalDescriptionEditorProps {
  description?: string;
  descriptionInputRef: React.RefObject<HTMLTextAreaElement | null>;
  onInsertFormatting: (prefix: string, suffix?: string) => void;
  onInsertEmoji: (emoji: string) => void;
  onChange: (val: string) => void;
}

export const JobModalDescriptionEditor = memo(function JobModalDescriptionEditor({
  description = "",
  descriptionInputRef,
  onInsertFormatting,
  onInsertEmoji,
  onChange,
}: JobModalDescriptionEditorProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
          Job Description & Requirements
        </label>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onInsertFormatting("**", "**")}
            className="px-1.5 py-0.5 rounded text-[11px] font-bold text-gray-500 hover:bg-gray-100 cursor-pointer"
            title="Bold"
          >
            B
          </button>
          <button
            type="button"
            onClick={() => onInsertFormatting("*", "*")}
            className="px-1.5 py-0.5 rounded text-[11px] italic font-bold text-gray-500 hover:bg-gray-100 cursor-pointer"
            title="Italic"
          >
            I
          </button>
          <button
            type="button"
            onClick={() => onInsertFormatting("\n- ")}
            className="px-1.5 py-0.5 rounded text-[11px] font-bold text-gray-500 hover:bg-gray-100 cursor-pointer"
            title="Bullet list"
          >
            • List
          </button>
          <div className="h-3 w-px bg-gray-200 mx-0.5" />
          <div className="flex items-center gap-0.5">
            {QUICK_EMOJIS.slice(0, 5).map((em) => (
              <button
                key={em}
                type="button"
                onClick={() => onInsertEmoji(em)}
                className="hover:scale-125 transition-transform text-xs cursor-pointer p-0.5"
              >
                {em}
              </button>
            ))}
          </div>
        </div>
      </div>
      <textarea
        ref={descriptionInputRef}
        rows={4}
        value={description}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Key responsibilities, required qualifications, benefits..."
        className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D] font-mono leading-relaxed resize-none"
      />
    </div>
  );
});
