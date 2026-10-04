import { memo } from "react";
import type { AnnouncementFormState } from "../types";
import { CATEGORY_CONFIG, PRIORITY_CONFIG, AUDIENCE_CONFIG } from "../constants";

interface AnnouncementCardPreviewProps {
  form: AnnouncementFormState;
}

export const AnnouncementCardPreview = memo(function AnnouncementCardPreview({
  form,
}: AnnouncementCardPreviewProps) {
  const cat = CATEGORY_CONFIG[form.category] || CATEGORY_CONFIG.general;
  const pri = PRIORITY_CONFIG[form.priority] || PRIORITY_CONFIG.normal;
  const aud = AUDIENCE_CONFIG[form.visible_to] || AUDIENCE_CONFIG.all;

  return (
    <div className="p-4 bg-slate-50 rounded-2xl border border-gray-200/80 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400">Card Preview</span>
        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${cat.bg} ${cat.color} flex items-center gap-1`}>
          <i className={cat.icon} />
          {cat.label}
        </span>
      </div>

      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs space-y-3">
        <div className="flex items-start justify-between gap-2">
          <h4 className="text-sm font-bold text-gray-900 leading-snug">
            {form.title || "Untitled Announcement Headline"}
          </h4>
          <span className={`text-[10px] px-2 py-0.5 rounded-full border flex items-center gap-1 shrink-0 ${pri.badge}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${pri.dot}`} />
            {pri.label}
          </span>
        </div>

        <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-line">
          {form.content || "Your announcement message will appear here in the live broadcast feed..."}
        </p>

        <div className="pt-2 border-t border-gray-50 flex items-center justify-between text-[10px] text-gray-400">
          <span>By {form.author_name || "You"} · {form.author_role || "Corporate Operations"}</span>
          <span className={`px-1.5 py-0.5 rounded border ${aud.badge}`}>{aud.label}</span>
        </div>
      </div>
    </div>
  );
});
