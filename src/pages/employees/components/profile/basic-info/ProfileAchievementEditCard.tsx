import { memo, useRef } from "react";
import type { EmployeeAchievementItem } from "../../../types";

interface Props {
  ach: EmployeeAchievementItem;
  idx: number;
  uploading: boolean;
  onUpdate: (idx: number, field: keyof EmployeeAchievementItem, val: string) => void;
  onRemove: (idx: number) => void;
  onUploadFile: (file: File, idx: number) => void;
}

export const ProfileAchievementEditCard = memo(function ProfileAchievementEditCard({
  ach,
  idx,
  uploading,
  onUpdate,
  onRemove,
  onUploadFile,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const isWebUrl =
    Boolean(ach.attachment) &&
    !ach.attachment?.includes("amazonaws.com") &&
    (ach.attachment?.startsWith("http") ||
      ach.attachment?.includes(".com") ||
      ach.attachment?.includes(".app") ||
      ach.attachment?.includes(".org") ||
      ach.attachment?.includes(".io"));

  const targetUrl = ach.attachment?.startsWith("http")
    ? ach.attachment
    : `https://${ach.attachment}`;

  return (
    <div className="p-5 border border-amber-300/80 rounded-2xl bg-amber-50/30 shadow-2xs space-y-3">
      <div className="flex items-center justify-between border-b border-amber-200/60 pb-2.5">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-900 text-xs font-black flex items-center justify-center">
            {idx + 1}
          </span>
          <span className="text-xs font-black text-slate-900 uppercase">
            {ach.title || `Achievement #${idx + 1}`}
          </span>
        </div>
        <button
          type="button"
          onClick={() => onRemove(idx)}
          className="px-2.5 py-1 rounded-lg text-rose-600 hover:bg-rose-50 border border-rose-200 text-xs font-bold inline-flex items-center gap-1 transition-colors cursor-pointer"
        >
          <i className="ri-delete-bin-line text-sm" />
          <span>Remove</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <div>
          <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">
            Title / Short Code *
          </label>
          <input
            type="text"
            value={ach.title}
            onChange={(e) => onUpdate(idx, "title", e.target.value)}
            placeholder="e.g. NEP, Website, HRMS"
            className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-bold focus:outline-none focus:border-[#253C7D]"
          />
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">
            Year Awarded
          </label>
          <input
            type="number"
            value={ach.year_awarded}
            onChange={(e) => onUpdate(idx, "year_awarded", e.target.value)}
            placeholder="2026"
            className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-mono font-bold focus:outline-none focus:border-[#253C7D]"
          />
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">
            Country
          </label>
          <input
            type="text"
            value={ach.country}
            onChange={(e) => onUpdate(idx, "country", e.target.value)}
            placeholder="Cambodia"
            className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs focus:outline-none focus:border-[#253C7D]"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">
            Program / System / App Name
          </label>
          <input
            type="text"
            value={ach.program_name}
            onChange={(e) => onUpdate(idx, "program_name", e.target.value)}
            placeholder="e.g. Programme Mapping System, Company Portal"
            className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-semibold focus:outline-none focus:border-[#253C7D]"
          />
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">
            Organizer / Issuer / BU
          </label>
          <input
            type="text"
            value={ach.organizer_name}
            onChange={(e) => onUpdate(idx, "organizer_name", e.target.value)}
            placeholder="PNC / Internal Project"
            className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs focus:outline-none focus:border-[#253C7D]"
          />
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">
            Remark / Category
          </label>
          <input
            type="text"
            value={ach.remark}
            onChange={(e) => onUpdate(idx, "remark", e.target.value)}
            placeholder="College / Web App / Production"
            className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs focus:outline-none focus:border-[#253C7D]"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">
            Website / System / App URL or Document Evidence
          </label>
          <div className="flex items-center gap-2 flex-wrap">
            <input
              type="text"
              value={ach.attachment || ""}
              onChange={(e) => onUpdate(idx, "attachment", e.target.value)}
              placeholder="https://... (live website, system, app URL, or upload file)"
              className="flex-1 min-w-[200px] px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs focus:outline-none focus:border-[#253C7D]"
            />

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
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors disabled:opacity-50"
              title="Upload file to S3"
            >
              {uploading ? (
                <>
                  <i className="ri-loader-4-line animate-spin text-blue-600" />
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <i className="ri-upload-cloud-line text-[#253C7D]" />
                  <span>Upload File</span>
                </>
              )}
            </button>

            {ach.attachment && (
              <a
                href={targetUrl}
                target="_blank"
                rel="noreferrer"
                className="px-2.5 py-1.5 rounded-lg bg-blue-50 text-[#253C7D] border border-blue-200 text-xs font-bold inline-flex items-center gap-1 hover:underline"
              >
                <i className={isWebUrl ? "ri-global-line text-blue-600" : "ri-external-link-line"} />
                <span>{isWebUrl ? "Visit URL" : "Preview"}</span>
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});
