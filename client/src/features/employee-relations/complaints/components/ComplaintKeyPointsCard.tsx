import { memo } from "react";
import type { ComplaintSuggestion } from "../types";

interface ComplaintKeyPointsCardProps {
  item: ComplaintSuggestion;
  onPreviewAttachment: (url: string, name: string) => void;
}

export const ComplaintKeyPointsCard = memo(function ComplaintKeyPointsCard({
  item,
  onPreviewAttachment,
}: ComplaintKeyPointsCardProps) {
  const goalText =
    item.subject && item.subject.length > 5
      ? `Improve ${item.subject.toLowerCase()} and organizational outcomes through constructive feedback.`
      : "Improve focus, productivity, and work-life balance through better task management.";

  return (
    <div className="space-y-3.5">
      {/* Key Points Card */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-2xs space-y-2.5">
        <div className="flex items-center gap-1.5 pb-1">
          <i className="ri-bookmark-line text-sky-600 text-xs" />
          <h4 className="text-[11.5px] font-bold text-slate-800">Key Points</h4>
        </div>

        {/* 1. Main Goal */}
        <div className="bg-slate-50/80 border border-slate-100 rounded-lg p-2.5 flex items-start gap-2.5">
          <div className="w-6 h-6 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center shrink-0">
            <i className="ri-focus-3-line text-xs" />
          </div>
          <div className="min-w-0">
            <div className="text-[10.5px] font-bold text-slate-800 mb-0.5">Main Goal</div>
            <p className="text-[10px] text-slate-600 leading-relaxed">{goalText}</p>
          </div>
        </div>

        {/* 2. Key Strategy */}
        <div className="bg-slate-50/80 border border-slate-100 rounded-lg p-2.5 flex items-start gap-2.5">
          <div className="w-6 h-6 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center shrink-0">
            <i className="ri-calendar-todo-line text-xs" />
          </div>
          <div className="min-w-0">
            <div className="text-[10.5px] font-bold text-slate-800 mb-0.5">Key Strategy</div>
            <ul className="text-[10px] text-slate-600 space-y-0.5 list-disc list-inside">
              <li>Time blocking</li>
              <li>Set boundaries</li>
              <li>Take regular breaks</li>
              <li>Focus on high-value tasks</li>
            </ul>
          </div>
        </div>

        {/* 3. 3-Step Plan */}
        <div className="bg-slate-50/80 border border-slate-100 rounded-lg p-2.5 flex items-start gap-2.5">
          <div className="w-6 h-6 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center shrink-0">
            <i className="ri-settings-4-line text-xs" />
          </div>
          <div className="min-w-0">
            <div className="text-[10.5px] font-bold text-slate-800 mb-0.5">3-Step Plan</div>
            <ol className="text-[10px] text-slate-600 space-y-0.5 list-decimal list-inside">
              <li>Micro-Blocking</li>
              <li>Boundary Control</li>
              <li>Delegation &amp; Focus</li>
            </ol>
          </div>
        </div>

        {/* 4. Follow-up Needed */}
        <div className="bg-amber-50/70 border border-amber-200/80 rounded-lg p-2.5 flex items-start gap-2.5">
          <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
            <i className="ri-user-smile-line text-xs" />
          </div>
          <div className="min-w-0">
            <div className="text-[10.5px] font-bold text-amber-800 mb-0.5">Follow-up Needed</div>
            <p className="text-[10px] text-amber-700 leading-relaxed">
              {item.remark || "Tell us more about your profession, team structure, and the tools/calendar you use."}
            </p>
          </div>
        </div>
      </div>

      {/* Attachment Card */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-3 shadow-2xs space-y-2">
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-800">
          <i className="ri-attachment-line text-slate-500" />
          <span>Attachment</span>
        </div>

        {item.attachment_url ? (
          <div className="border border-sky-200 bg-sky-50/40 rounded-lg p-2.5 flex items-center justify-between">
            <button
              type="button"
              onClick={() => onPreviewAttachment(item.attachment_url!, item.attachment_name || "Attachment Document")}
              className="flex items-center gap-2 group text-left cursor-pointer truncate mr-2"
            >
              <div className="w-6 h-6 rounded bg-[#253C7D] text-white flex items-center justify-center shrink-0">
                <i className="ri-file-text-line text-[10px]" />
              </div>
              <div className="truncate">
                <div className="text-[11px] font-semibold text-slate-800 group-hover:text-sky-600 truncate underline">
                  {item.attachment_name || "Attachment File"}
                </div>
                <div className="text-[9.5px] text-slate-400">AWS S3 Cloud Document</div>
              </div>
            </button>
          </div>
        ) : (
          <div className="border border-dashed border-sky-300 bg-sky-50/20 rounded-lg p-3 text-center text-xs">
            <i className="ri-upload-cloud-line text-lg text-sky-600 block mb-0.5" />
            <span className="text-[10px] text-slate-600">Drop file here or </span>
            <span className="text-[10px] text-sky-600 font-bold">Browse</span>
            <div className="text-[9.5px] text-slate-400 italic mt-0.5">No file attached</div>
          </div>
        )}
      </div>
    </div>
  );
});
