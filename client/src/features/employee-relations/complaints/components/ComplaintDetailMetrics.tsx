import { memo } from "react";
import type { ComplaintSuggestion } from "../types";
import { formatDMY } from "@/features/workforce/employees/dateUtils";
import { formatKhmerFullName } from "@/features/workforce/employees/nameUtils";

interface ComplaintDetailMetricsProps {
  item: ComplaintSuggestion;
}

export const ComplaintDetailMetrics = memo(function ComplaintDetailMetrics({
  item,
}: ComplaintDetailMetricsProps) {
  const targetCategory = item.target_category || "Division";
  const filingDateDMY = formatDMY(item.entry_date);

  const isAnonymous = item.show_identity === false;
  const identityName = isAnonymous
    ? "Anonymous"
    : item.employees
    ? formatKhmerFullName(item.employees) || "Staff"
    : "Staff";

  const identitySub = isAnonymous
    ? "(Identity Protected)"
    : item.employees?.department
    ? `(${item.employees.department})`
    : "";

  const cleanDetailSnippet = item.details
    ? item.details.replace(/<[^>]*>?/gm, "").replace(/&nbsp;/g, " ").trim().slice(0, 40)
    : "General Feedback";

  return (
    <div className="bg-white border border-slate-200/90 rounded-xl p-3 shadow-2xs grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 text-xs">
      {/* 1. Filing Date */}
      <div className="flex items-start gap-2 px-1.5">
        <i className="ri-calendar-line text-slate-400 text-sm mt-0.5" />
        <div className="min-w-0">
          <div className="text-[10px] text-slate-400 font-medium">Filing Date</div>
          <div className="text-[11.5px] font-bold text-slate-800 font-mono mt-0.5">{filingDateDMY}</div>
        </div>
      </div>

      {/* 2. Complainant / Suggestion To */}
      <div className="flex items-start gap-2 px-1.5 pt-1.5 sm:pt-0">
        <i className="ri-user-line text-slate-400 text-sm mt-0.5" />
        <div className="min-w-0">
          <div className="text-[10px] text-slate-400 font-medium truncate">
            Complainant / Suggestion To
          </div>
          <div className="text-[11.5px] font-bold text-slate-800 truncate mt-0.5" title={item.target_to}>
            {targetCategory ? `${targetCategory} - ` : ""}
            {item.target_to || "General"}
          </div>
        </div>
      </div>

      {/* 3. Identity */}
      <div className="flex items-start gap-2 px-1.5 pt-1.5 sm:pt-0">
        <i className="ri-eye-line text-slate-400 text-sm mt-0.5" />
        <div className="min-w-0">
          <div className="text-[10px] text-slate-400 font-medium">Identity</div>
          <div className="text-[11.5px] font-bold text-slate-800 mt-0.5 truncate">{identityName}</div>
          {identitySub && (
            <div className="text-[9.5px] text-slate-400 leading-tight truncate">{identitySub}</div>
          )}
        </div>
      </div>

      {/* 4. Subject */}
      <div className="flex items-start gap-2 px-1.5 pt-1.5 sm:pt-0">
        <i className="ri-price-tag-3-line text-slate-400 text-sm mt-0.5" />
        <div className="min-w-0">
          <div className="text-[10px] text-slate-400 font-medium">Subject</div>
          <div className="text-[11.5px] font-bold text-slate-800 truncate mt-0.5" title={item.subject}>
            {item.subject || "—"}
          </div>
        </div>
      </div>

      {/* 5. Detail */}
      <div className="flex items-start gap-2 px-1.5 pt-1.5 sm:pt-0">
        <i className="ri-file-text-line text-slate-400 text-sm mt-0.5" />
        <div className="min-w-0">
          <div className="text-[10px] text-slate-400 font-medium">Detail</div>
          <div className="text-[11.5px] font-bold text-slate-800 truncate mt-0.5" title={cleanDetailSnippet}>
            {cleanDetailSnippet || "—"}
          </div>
        </div>
      </div>
    </div>
  );
});
