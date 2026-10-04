import { memo } from "react";

interface MeetingCallTypeSelectorProps {
  selectedType: "video" | "audio";
  onSelectType: (type: "video" | "audio") => void;
}

export const MeetingCallTypeSelector = memo(function MeetingCallTypeSelector({
  selectedType,
  onSelectType,
}: MeetingCallTypeSelectorProps) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">
        Choose one (Video or Audio)
      </label>

      <div className="flex items-center gap-3">
        {/* Video Option */}
        <button
          type="button"
          onClick={() => onSelectType("video")}
          className={`flex flex-col items-center justify-center gap-1 w-16 h-16 rounded-2xl border-2 transition-all cursor-pointer select-none active:scale-95 ${
            selectedType === "video"
              ? "border-[#253C7D] bg-[#253C7D]/10 dark:border-sky-400 dark:bg-sky-400/15 text-[#253C7D] dark:text-sky-300 shadow-sm"
              : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 hover:border-slate-300 dark:hover:border-slate-600"
          }`}
        >
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-lg ${
            selectedType === "video"
              ? "bg-[#253C7D] text-white dark:bg-sky-400 dark:text-slate-950 shadow-xs"
              : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
          }`}>
            <i className="ri-video-line" />
          </div>
          <span className="text-[10.5px] font-bold">Video</span>
        </button>

        {/* Audio Option */}
        <button
          type="button"
          onClick={() => onSelectType("audio")}
          className={`flex flex-col items-center justify-center gap-1 w-16 h-16 rounded-2xl border-2 transition-all cursor-pointer select-none active:scale-95 ${
            selectedType === "audio"
              ? "border-[#253C7D] bg-[#253C7D]/10 dark:border-sky-400 dark:bg-sky-400/15 text-[#253C7D] dark:text-sky-300 shadow-sm"
              : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 hover:border-slate-300 dark:hover:border-slate-600"
          }`}
        >
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-lg ${
            selectedType === "audio"
              ? "bg-[#253C7D] text-white dark:bg-sky-400 dark:text-slate-950 shadow-xs"
              : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
          }`}>
            <i className="ri-mic-line" />
          </div>
          <span className="text-[10.5px] font-bold">Audio</span>
        </button>
      </div>
    </div>
  );
});
