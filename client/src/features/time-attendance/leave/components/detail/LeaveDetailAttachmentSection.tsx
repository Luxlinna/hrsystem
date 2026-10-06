import { memo } from "react";
import type { LeaveRequest } from "../../types";

interface LeaveDetailAttachmentSectionProps {
  request: LeaveRequest;
}

export const LeaveDetailAttachmentSection = memo(function LeaveDetailAttachmentSection({
  request,
}: LeaveDetailAttachmentSectionProps) {
  const match = request.reason?.match(/\[Attachment:\s*(https?:\/\/[^\]\s]+)\]/i);
  const attachmentUrl = request.attachment_url || match?.[1];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200/80 dark:border-slate-800 p-4 sm:p-5 shadow-2xs space-y-3">
      <div className="text-[#0284c7] dark:text-sky-400 font-bold text-xs tracking-wider uppercase pb-2 border-b border-gray-100 dark:border-slate-800">
        Attachment
      </div>

      <div className="text-xs">
        {attachmentUrl ? (
          <div className="flex items-center justify-between p-3 border border-sky-200 dark:border-sky-900 bg-sky-50/40 dark:bg-sky-950/30 rounded-xl">
            <div className="flex items-center gap-2 min-w-0">
              <i className="ri-attachment-line text-sky-600 text-base shrink-0" />
              <span className="font-semibold text-gray-800 dark:text-slate-200 truncate">
                {attachmentUrl.split("/").pop() || "Leave_Document_Proof.pdf"}
              </span>
            </div>
            <a
              href={attachmentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1 bg-white dark:bg-slate-800 border border-sky-300 dark:border-sky-700 text-sky-600 dark:text-sky-400 rounded-lg hover:bg-sky-50 font-semibold cursor-pointer transition-colors shrink-0 ml-2"
            >
              View Attachment
            </a>
          </div>
        ) : (
          <div className="border border-dashed border-blue-200 dark:border-blue-900/60 rounded-xl p-4 sm:p-5 text-center text-gray-400 dark:text-slate-500 bg-blue-50/20 dark:bg-slate-800/30">
            <i className="ri-upload-cloud-line text-2xl text-blue-400 dark:text-blue-500 mb-1 block" />
            <span>Drop file here or </span>
            <span className="text-sky-600 dark:text-sky-400 font-medium cursor-pointer hover:underline">
              Browse
            </span>
          </div>
        )}
      </div>
    </div>
  );
});
