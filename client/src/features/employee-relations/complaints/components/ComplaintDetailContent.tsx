import { memo } from "react";
import type { ComplaintSuggestion } from "../types";

interface ComplaintDetailContentProps {
  item: ComplaintSuggestion;
}

const DETAIL_PROSE_CLASSES =
  "text-[10.5px] text-slate-600 leading-relaxed font-sans space-y-1.5 " +
  "[&_h1]:text-[12px] [&_h1]:font-bold [&_h1]:text-slate-900 [&_h1]:mb-1 " +
  "[&_h2]:text-[11.5px] [&_h2]:font-bold [&_h2]:text-slate-900 [&_h2]:mb-1 " +
  "[&_h3]:text-[11px] [&_h3]:font-bold [&_h3]:text-slate-900 [&_h3]:mb-1 " +
  "[&_h4]:text-[10.5px] [&_h4]:font-bold [&_h4]:text-slate-900 [&_h4]:mb-0.5 " +
  "[&_p]:text-[10.5px] [&_p]:leading-relaxed [&_p]:text-slate-600 [&_p]:mb-1.5 " +
  "[&_strong]:font-bold [&_strong]:text-slate-800 " +
  "[&_ul]:list-disc [&_ul]:list-inside [&_ul]:space-y-0.5 [&_ol]:list-decimal [&_ol]:list-inside [&_ol]:space-y-0.5 " +
  "[&_li]:text-[10.5px] [&_li]:text-slate-600";

export const ComplaintDetailContent = memo(function ComplaintDetailContent({
  item,
}: ComplaintDetailContentProps) {
  const rawSuggestion = item.suggestion || "";
  const suggestionSections = rawSuggestion
    ? rawSuggestion
        .split(/\n\n|(?=\b(?:Step\s*\d|\d+\.|\d+\))\b)/gi)
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  return (
    <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-2xs space-y-4">
      {/* 1. Complaint / Suggestion Detail */}
      <div>
        <div className="flex items-center gap-1.5 pb-1.5">
          <div className="w-5 h-5 rounded bg-[#253C7D] text-white flex items-center justify-center text-[10px] shadow-2xs">
            <i className="ri-file-text-line" />
          </div>
          <h3 className="text-[11.5px] font-bold text-slate-900">Complaint / Suggestion Detail</h3>
        </div>
        <div className="border-b border-slate-100 mb-2.5" />

        <div
          className={DETAIL_PROSE_CLASSES}
          dangerouslySetInnerHTML={{
            __html: item.details || "<p class='text-slate-400 italic'>No detailed description provided.</p>",
          }}
        />
      </div>

      {/* 2. Suggestion */}
      {(item.suggestion || suggestionSections.length > 0) && (
        <div className="pt-2 border-t border-slate-100">
          <div className="flex items-center gap-1.5 pb-1.5">
            <i className="ri-lightbulb-line text-amber-500 text-xs" />
            <h3 className="text-[11.5px] font-bold text-slate-900">Suggestion</h3>
          </div>
          <div className="border-b border-slate-100 mb-2.5" />

          <div className="space-y-2.5">
            {suggestionSections.length > 1 ? (
              suggestionSections.map((sec, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <div className="w-4 h-4 rounded-full bg-sky-100 text-sky-600 text-[9px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </div>
                  <div
                    className={`flex-1 ${DETAIL_PROSE_CLASSES}`}
                    dangerouslySetInnerHTML={{ __html: sec }}
                  />
                </div>
              ))
            ) : (
              <div
                className={DETAIL_PROSE_CLASSES}
                dangerouslySetInnerHTML={{
                  __html: item.suggestion || "<p class='text-slate-400 italic'>No suggestions recorded.</p>",
                }}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
});
