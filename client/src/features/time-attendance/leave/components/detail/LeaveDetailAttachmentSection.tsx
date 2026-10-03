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
    <div className="bg-white rounded-xl border border-gray-200/80 p-5 shadow-2xs">
      <div className="text-[#0284c7] font-semibold text-xs tracking-wider uppercase pb-3 border-b border-gray-100">
        ATTACHMENT INFO
      </div>

      <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-4 text-xs">
        <div className="w-24 text-gray-500 font-medium">Attachment</div>

        <div className="flex-1">
          {attachmentUrl ? (
            <div className="flex items-center justify-between p-3 border border-sky-200 bg-sky-50/40 rounded-xl">
              <div className="flex items-center gap-2">
                <i className="ri-attachment-line text-sky-600 text-base" />
                <span className="font-semibold text-gray-800">
                  {attachmentUrl.split("/").pop() || "Leave_Document_Proof.pdf"}
                </span>
              </div>
              <a
                href={attachmentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1 bg-white border border-sky-300 text-sky-600 rounded-lg hover:bg-sky-50 font-semibold cursor-pointer transition-colors"
              >
                View Attachment
              </a>
            </div>
          ) : (
            <div className="border border-dashed border-gray-300 rounded-lg p-5 text-center text-gray-400 bg-gray-50/50">
              <i className="ri-upload-cloud-line text-2xl text-gray-300 mb-1 block" />
              <span>Drop file here or </span>
              <span className="text-sky-600 font-medium cursor-pointer hover:underline">
                Browse
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
