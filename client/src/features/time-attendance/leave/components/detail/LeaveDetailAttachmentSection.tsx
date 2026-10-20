import { memo } from "react";
import type { LeaveRequest } from "../../types";

interface LeaveDetailAttachmentSectionProps {
  request: LeaveRequest;
}

function getFilenameFromUrl(url: string): string {
  try {
    const pathname = new URL(url).pathname;
    const rawName = pathname.split("/").pop() || "attachment";
    return decodeURIComponent(rawName);
  } catch {
    return url.split("/").pop() || "attachment";
  }
}

function getFileIcon(name: string) {
  const ext = name.split(".").pop()?.toLowerCase();
  if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext || "")) {
    return {
      icon: "ri-image-line",
      color: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-900/50",
    };
  }
  if (ext === "pdf") {
    return {
      icon: "ri-file-pdf-2-line",
      color: "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-900/50",
    };
  }
  if (["doc", "docx"].includes(ext || "")) {
    return {
      icon: "ri-file-word-line",
      color: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-900/50",
    };
  }
  return {
    icon: "ri-attachment-line",
    color: "text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/60 border-sky-200 dark:border-sky-900/50",
  };
}

export const LeaveDetailAttachmentSection = memo(function LeaveDetailAttachmentSection({
  request,
}: LeaveDetailAttachmentSectionProps) {
  const urls: string[] = [];

  if (request.attachment_url && request.attachment_url.startsWith("http")) {
    urls.push(request.attachment_url);
  }

  if (request.reason) {
    const matches = request.reason.matchAll(/\[Attachment:\s*(https?:\/\/[^\]\s]+)\]/gi);
    for (const m of matches) {
      if (m[1] && !urls.includes(m[1])) {
        urls.push(m[1]);
      }
    }
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200/80 dark:border-slate-800 p-4 sm:p-5 shadow-2xs space-y-3">
      <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-slate-800">
        <div className="text-[#0284c7] dark:text-sky-400 font-bold text-xs tracking-wider uppercase">
          Attachments
        </div>
        {urls.length > 0 && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
            {urls.length} {urls.length === 1 ? "file" : "files"}
          </span>
        )}
      </div>

      <div className="text-xs">
        {urls.length > 0 ? (
          <div className="space-y-2">
            {urls.map((url, idx) => {
              const fileName = getFilenameFromUrl(url);
              const meta = getFileIcon(fileName);

              return (
                <div
                  key={`${url}-${idx}`}
                  className="flex items-center justify-between p-2.5 sm:p-3 border border-slate-200 dark:border-slate-700/80 bg-slate-50/60 dark:bg-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm shrink-0 border ${meta.color}`}
                    >
                      <i className={meta.icon} />
                    </div>
                    <div className="min-w-0">
                      <span className="font-semibold text-gray-800 dark:text-slate-200 truncate block text-xs">
                        {fileName}
                      </span>
                      <span className="text-[9.5px] text-slate-400 dark:text-slate-500">
                        Attachment #{idx + 1}
                      </span>
                    </div>
                  </div>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-sky-300 dark:border-sky-700 text-sky-600 dark:text-sky-400 rounded-lg hover:bg-sky-50 dark:hover:bg-sky-950/40 text-[11px] font-bold cursor-pointer transition-colors shrink-0 ml-2 inline-flex items-center gap-1 shadow-2xs"
                  >
                    <i className="ri-external-link-line" />
                    <span>View</span>
                  </a>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="border border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-4 text-center text-slate-400 dark:text-slate-500 bg-slate-50/40 dark:bg-slate-800/20">
            <i className="ri-file-line text-xl text-slate-300 dark:text-slate-600 mb-1 block" />
            <span>No attachments attached to this request</span>
          </div>
        )}
      </div>
    </div>
  );
});
