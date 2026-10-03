import { memo, useRef } from "react";
import type { EmployeeAchievementItem } from "../../../types";

interface Props {
  ach: EmployeeAchievementItem;
  idx: number;
  uploading: boolean;
  onUpdateField: (idx: number, field: keyof EmployeeAchievementItem, val: string) => void;
  onRemove: (idx: number) => void;
  onUploadFile: (file: File, idx: number) => void;
}

export const PersonalAchievementRow = memo(function PersonalAchievementRow({
  ach,
  idx,
  uploading,
  onUpdateField,
  onRemove,
  onUploadFile,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const isWebUrl =
    Boolean(ach.attachment) &&
    !ach.attachment?.includes("amazonaws.com") &&
    (ach.attachment?.startsWith("http") || ach.attachment?.includes("."));

  const targetHref =
    ach.attachment?.startsWith("http")
      ? ach.attachment
      : `https://${ach.attachment}`;

  return (
    <tr className="hover:bg-slate-50/60 transition-colors">
      <td className="py-2 px-2.5 text-slate-500 font-medium">{idx + 1}</td>

      {/* Title */}
      <td className="py-2 px-2.5">
        <input
          type="text"
          value={ach.title}
          onChange={(e) => onUpdateField(idx, "title", e.target.value)}
          placeholder="Achievement Title"
          className="w-full px-2 py-1 rounded-lg border border-slate-200 bg-white text-xs font-medium focus:outline-none focus:border-[#253C7D]"
        />
      </td>

      {/* Year Awarded */}
      <td className="py-2 px-2.5 w-24">
        <input
          type="number"
          value={ach.year_awarded}
          onChange={(e) => onUpdateField(idx, "year_awarded", e.target.value)}
          placeholder="YYYY"
          className="w-full px-2 py-1 rounded-lg border border-slate-200 bg-white text-xs font-mono focus:outline-none focus:border-[#253C7D]"
        />
      </td>

      {/* Country */}
      <td className="py-2 px-2.5 w-28">
        <input
          type="text"
          value={ach.country}
          onChange={(e) => onUpdateField(idx, "country", e.target.value)}
          placeholder="Country"
          className="w-full px-2 py-1 rounded-lg border border-slate-200 bg-white text-xs focus:outline-none focus:border-[#253C7D]"
        />
      </td>

      {/* Program Name */}
      <td className="py-2 px-2.5">
        <input
          type="text"
          value={ach.program_name}
          onChange={(e) => onUpdateField(idx, "program_name", e.target.value)}
          placeholder="Program Name / System"
          className="w-full px-2 py-1 rounded-lg border border-slate-200 bg-white text-xs focus:outline-none focus:border-[#253C7D]"
        />
      </td>

      {/* Organizer */}
      <td className="py-2 px-2.5">
        <input
          type="text"
          value={ach.organizer_name}
          onChange={(e) => onUpdateField(idx, "organizer_name", e.target.value)}
          placeholder="Organizer Name"
          className="w-full px-2 py-1 rounded-lg border border-slate-200 bg-white text-xs focus:outline-none focus:border-[#253C7D]"
        />
      </td>

      {/* Remark */}
      <td className="py-2 px-2.5">
        <input
          type="text"
          value={ach.remark}
          onChange={(e) => onUpdateField(idx, "remark", e.target.value)}
          placeholder="Remark"
          className="w-full px-2 py-1 rounded-lg border border-slate-200 bg-white text-xs focus:outline-none focus:border-[#253C7D]"
        />
      </td>

      {/* Attachment / Website or System URL */}
      <td className="py-2 px-2.5 min-w-[200px]">
        {uploading ? (
          <div className="flex items-center gap-1.5 text-blue-600 text-[10px] font-bold py-1">
            <i className="ri-loader-4-line animate-spin text-sm" />
            <span>Uploading S3...</span>
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <input
              type="text"
              value={ach.attachment || ""}
              onChange={(e) => onUpdateField(idx, "attachment", e.target.value)}
              placeholder="https://... or upload"
              className="w-full px-2 py-1 rounded-lg border border-slate-200 bg-white text-[11px] focus:outline-none focus:border-[#253C7D]"
              title="Enter website, system, app URL, or upload file"
            />

            {/* Hidden file input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onUploadFile(file, idx);
              }}
              className="hidden"
              accept=".pdf,.png,.jpg,.jpeg,.webp"
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-1 rounded-md border border-slate-200 hover:bg-slate-100 text-slate-600 shrink-0 cursor-pointer transition-colors"
              title="Upload Certificate / Document to S3"
            >
              <i className="ri-upload-cloud-line text-xs" />
            </button>

            {ach.attachment && (
              <a
                href={targetHref}
                target="_blank"
                rel="noreferrer"
                className="p-1 rounded-md bg-blue-50 text-[#253C7D] hover:bg-blue-100 shrink-0 inline-flex items-center"
                title={isWebUrl ? "Visit Website / App" : "View S3 File"}
              >
                <i className={isWebUrl ? "ri-global-line text-xs" : "ri-external-link-line text-xs"} />
              </a>
            )}
          </div>
        )}
      </td>

      {/* Action */}
      <td className="py-2 px-2.5 text-center">
        <button
          type="button"
          onClick={() => onRemove(idx)}
          className="text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
          title="Remove"
        >
          <i className="ri-delete-bin-line text-sm" />
        </button>
      </td>
    </tr>
  );
});
