import { memo } from "react";
import type { EmployeePersonalAttachment } from "../../../types";

interface PersonalAttachmentItemProps {
  fileItem: EmployeePersonalAttachment | string;
  idx: number;
  onRemove: (idx: number) => void;
}

export const PersonalAttachmentItem = memo(function PersonalAttachmentItem({
  fileItem,
  idx,
  onRemove,
}: PersonalAttachmentItemProps) {
  const isObj = typeof fileItem === "object" && fileItem !== null;
  const name = isObj ? fileItem.name : String(fileItem);
  const url = isObj ? fileItem.url : "";
  const size = isObj ? fileItem.size : undefined;
  const isS3Url = url.includes("amazonaws.com") || url.includes("s3") || url.startsWith("http");

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50/90 border border-slate-200 text-xs text-slate-800 hover:border-slate-300 hover:bg-white transition-all shadow-2xs group">
      <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-3">
        <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#253C7D] flex items-center justify-center shrink-0 border border-blue-100">
          {name.toLowerCase().endsWith(".pdf") ? (
            <i className="ri-file-pdf-line text-base text-rose-500" />
          ) : name.match(/\.(jpg|jpeg|png|webp)$/i) ? (
            <i className="ri-image-line text-base text-emerald-600" />
          ) : (
            <i className="ri-file-text-line text-base text-[#253C7D]" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate font-bold text-slate-800 text-xs leading-tight">
            {name}
          </p>
          <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
            {size ? <span>{formatFileSize(size)}</span> : null}
            {isS3Url && (
              <span className="inline-flex items-center gap-0.5 text-amber-600 font-bold bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200/50">
                <i className="ri-cloud-line text-[10px]" /> AWS S3
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {url && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 text-slate-400 hover:text-[#253C7D] hover:bg-blue-50 rounded-lg transition-colors inline-flex items-center"
            title="Open / Download Document from AWS S3"
          >
            <i className="ri-external-link-line text-sm" />
          </a>
        )}
        <button
          type="button"
          onClick={() => onRemove(idx)}
          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
          title="Remove Attachment"
        >
          <i className="ri-delete-bin-line text-sm" />
        </button>
      </div>
    </div>
  );
});
