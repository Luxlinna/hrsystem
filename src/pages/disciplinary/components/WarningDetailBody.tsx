import { memo } from "react";
import type { DisciplinaryRecord } from "../types";
import { formatDateDMY, formatMultilinePreview } from "../utils/formatters";
import { WarningDetailEmployeeCard } from "./WarningDetailEmployeeCard";

interface WarningDetailBodyProps {
  record: DisciplinaryRecord;
}

export const WarningDetailBody = memo(function WarningDetailBody({ record }: WarningDetailBodyProps) {
  const warningType = record.warning_type || record.type || "First Written";
  const formattedDate = formatDateDMY(record.warning_date || record.incident_date);

  const violationText = formatMultilinePreview(record.description);
  const actionText = formatMultilinePreview(record.action_to_take || record.action_taken);
  const promiseText = formatMultilinePreview(record.employee_promise);
  const cleanRemark = (record.remark || record.notes || "").replace(/\[VOIDED\]/gi, "").trim();

  return (
    <div className="overflow-y-auto overflow-x-hidden p-6 space-y-7 flex-1 text-xs font-sans min-h-0 bg-white">
      {/* 1. EMPLOYEE INFO */}
      <div>
        <h3 className="text-xs font-bold text-sky-600 uppercase tracking-wider">
          EMPLOYEE INFO
        </h3>
        <div className="border-b border-slate-200 mt-1.5 mb-4" />
        <WarningDetailEmployeeCard record={record} />
      </div>

      {/* 2. WARNING INFO */}
      <div>
        <h3 className="text-xs font-bold text-sky-600 uppercase tracking-wider">
          WARNING INFO
        </h3>
        <div className="border-b border-slate-200 mt-1.5 mb-4" />

        <div className="space-y-3 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-6">
            <span className="sm:w-56 text-slate-600 font-normal shrink-0">Warning Type</span>
            <span className="text-slate-800 font-normal flex-1">{warningType}</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-6">
            <span className="sm:w-56 text-slate-600 font-normal shrink-0">Alert Day After Warning(day)</span>
            <span className="text-slate-800 font-normal flex-1">7</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-6">
            <span className="sm:w-56 text-slate-600 font-normal shrink-0">Stop Alert After Alert Day(day)</span>
            <span className="text-slate-800 font-normal flex-1">3</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-6">
            <span className="sm:w-56 text-slate-600 font-normal shrink-0">Warning Date</span>
            <span className="text-slate-800 font-normal flex-1">{formattedDate}</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-6">
            <span className="sm:w-56 text-slate-600 font-normal shrink-0">Description of Violation</span>
            <span className="text-slate-800 font-normal flex-1 font-['Kantumruy_Pro',sans-serif] leading-relaxed whitespace-pre-line">
              {violationText}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-6">
            <span className="sm:w-56 text-slate-600 font-normal shrink-0">Action to Be Taken</span>
            <span className="text-slate-800 font-normal flex-1 font-['Kantumruy_Pro',sans-serif] leading-relaxed whitespace-pre-line">
              {actionText}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-6">
            <span className="sm:w-56 text-slate-600 font-normal shrink-0">Employee Promise</span>
            <span className="text-slate-800 font-normal flex-1 font-['Kantumruy_Pro',sans-serif] leading-relaxed whitespace-pre-line">
              {promiseText}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-6">
            <span className="sm:w-56 text-slate-600 font-normal shrink-0">Remark</span>
            <span className="text-slate-800 font-normal flex-1 font-['Kantumruy_Pro',sans-serif] leading-relaxed whitespace-pre-line">
              {cleanRemark || ""}
            </span>
          </div>
        </div>
      </div>

      {/* 3. ATTACHMENT INFO */}
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
              <span className="text-sky-600 hover:underline cursor-pointer">Browse</span>
            </div>

            {record.document_url ? (
              <div className="w-full">
                <div className="flex items-center justify-between text-xs py-1">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 border border-slate-800 rounded flex items-center justify-center text-slate-800 text-xs shrink-0">
                      <i className="ri-image-line text-xs" />
                    </span>
                    <a
                      href={record.document_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-slate-700 hover:text-sky-600 underline font-medium truncate max-w-md"
                    >
                      {record.document_name || "photo_2026-09-12_11-24-47.jpg"}
                    </a>
                  </div>
                  <div className="flex items-center gap-3 text-slate-400 text-xs">
                    <span>184 KB</span>
                    <i className="ri-close-line cursor-pointer hover:text-slate-700 text-sm" />
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
