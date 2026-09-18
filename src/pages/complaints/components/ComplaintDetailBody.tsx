import { memo } from "react";
import type { ComplaintSuggestion } from "../types";
import { formatDateDMY, formatMultilinePreview } from "@/pages/disciplinary/utils/formatters";

interface ComplaintDetailBodyProps {
  item: ComplaintSuggestion;
  onPreviewAttachment: (url: string, name: string) => void;
}

export const ComplaintDetailBody = memo(function ComplaintDetailBody({
  item,
  onPreviewAttachment,
}: ComplaintDetailBodyProps) {
  const targetCategory = item.target_category || "Business Unit";
  const formattedDate = formatDateDMY(item.entry_date);
  const detailText = formatMultilinePreview(item.details);
  const suggestionText = formatMultilinePreview(item.suggestion);
  const remarkText = formatMultilinePreview(item.remark);

  return (
    <div className="overflow-y-auto overflow-x-hidden p-6 space-y-7 flex-1 text-xs font-sans min-h-0 bg-white">
      {/* 1. COMPLAINT/SUGGESTION INFO */}
      <div>
        <h3 className="text-xs font-bold text-sky-600 uppercase tracking-wider">
          COMPLAINT/SUGGESTION INFO
        </h3>
        <div className="border-b border-slate-200 mt-1.5 mb-4" />

        <div className="space-y-3 text-xs">
          {/* Filing Date */}
          <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-6">
            <span className="sm:w-56 text-slate-600 font-normal shrink-0">Filing Date</span>
            <span className="text-slate-800 font-normal flex-1">{formattedDate}</span>
          </div>

          {/* Complaint/Suggestion To */}
          <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-6">
            <span className="sm:w-56 text-slate-600 font-normal shrink-0">Complaint/Suggestion To</span>
            <span className="text-slate-800 font-normal flex-1">
              {targetCategory ? `${targetCategory} - ` : ""}{item.target_to}
            </span>
          </div>

          {/* Show Identity */}
          <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-6">
            <span className="sm:w-56 text-slate-600 font-normal shrink-0">Show Identity</span>
            <span className="text-slate-800 font-normal flex-1">
              {item.show_identity === false
                ? "Anonymous (Identity Protected)"
                : item.employees
                ? `${item.employees.first_name} ${item.employees.last_name} (${item.employees.role || "Staff"} - ${item.employees.department || "General"})`
                : "Yes"}
            </span>
          </div>

          {/* Subject */}
          <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-6">
            <span className="sm:w-56 text-slate-600 font-normal shrink-0">Complaint/Suggestion Subject</span>
            <span className="text-slate-800 font-normal flex-1 font-['Kantumruy_Pro',sans-serif] leading-relaxed">
              {item.subject}
            </span>
          </div>

          {/* Detail */}
          <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-6">
            <span className="sm:w-56 text-slate-600 font-normal shrink-0">Complaint/Suggestion Detail</span>
            <span className="text-slate-800 font-normal flex-1 font-['Kantumruy_Pro',sans-serif] leading-relaxed whitespace-pre-line">
              {detailText}
            </span>
          </div>

          {/* Suggestion */}
          <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-6">
            <span className="sm:w-56 text-slate-600 font-normal shrink-0">Suggestion</span>
            <span className="text-slate-800 font-normal flex-1 font-['Kantumruy_Pro',sans-serif] leading-relaxed whitespace-pre-line">
              {suggestionText || "—"}
            </span>
          </div>

          {/* Remark */}
          <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-6">
            <span className="sm:w-56 text-slate-600 font-normal shrink-0">Remark</span>
            <span className="text-slate-800 font-normal flex-1 font-['Kantumruy_Pro',sans-serif] leading-relaxed whitespace-pre-line">
              {remarkText || ""}
            </span>
          </div>
        </div>
      </div>

      {/* 2. ATTACHMENT INFO */}
      <div>
        <h3 className="text-xs font-bold text-sky-600 uppercase tracking-wider">
          ATTACHMENT INFO
        </h3>
        <div className="border-b border-slate-200 mt-1.5 mb-4" />

        <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-6">
          <span className="sm:w-56 text-slate-600 font-normal shrink-0 pt-1">Attachment</span>
          <div className="flex-1 w-full space-y-3">
            <div className="flex items-center gap-1 text-[11px] text-slate-400">
              <i className="ri-upload-cloud-line" />
              <span>Drop file here or</span>
              <span className="text-sky-600 hover:underline">Browse</span>
            </div>

            {item.attachment_url ? (
              <div className="w-full">
                <div className="flex items-center justify-between text-xs py-1">
                  <button
                    type="button"
                    onClick={() => onPreviewAttachment(item.attachment_url!, item.attachment_name || "Attachment Document")}
                    className="flex items-center gap-2 group cursor-pointer text-left focus:outline-none"
                    title="Click to preview document"
                  >
                    <span className="w-6 h-6 border border-slate-800 group-hover:border-sky-600 rounded flex items-center justify-center text-slate-800 group-hover:text-sky-600 text-xs shrink-0 transition-colors">
                      <i className="ri-attachment-line text-xs" />
                    </span>
                    <span className="text-slate-700 group-hover:text-sky-600 underline font-medium truncate max-w-md transition-colors">
                      {item.attachment_name || "Attachment"}
                    </span>
                  </button>
                  <div className="flex items-center gap-3 text-slate-400 text-xs">
                    <span>AWS S3</span>
                  </div>
                </div>
                <div className="w-full h-1 bg-[#22c55e] rounded-full mt-1" />
              </div>
            ) : (
              <div className="w-full">
                <div className="flex items-center justify-between text-xs py-1 text-slate-400">
                  <span className="italic">No file attached</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});
