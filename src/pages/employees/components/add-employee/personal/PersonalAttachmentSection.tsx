import { memo } from "react";
import type { PersonalSectionProps } from "./types";

export const PersonalAttachmentSection = memo(function PersonalAttachmentSection({
  form,
  onChange,
}: PersonalSectionProps) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      const names = files.map((f) => f.name);
      const current = form.personal_attachments || [];
      onChange("personal_attachments", [...current, ...names]);
    }
  };

  const handleRemove = (idx: number) => {
    const updated = [...(form.personal_attachments || [])];
    updated.splice(idx, 1);
    onChange("personal_attachments", updated);
  };

  return (
    <div className="pt-6 border-t border-slate-200/80 w-full space-y-4">
      <h3 className="text-xs font-black text-[#253C7D] uppercase tracking-wider">
        ATTACHMENT INFO
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        <label className="md:col-span-3 text-xs font-bold text-slate-700 md:text-right md:pr-8">
          Attachment
        </label>
        <div className="md:col-span-8 space-y-3">
          <label className="border-2 border-dashed border-slate-300/90 hover:border-[#253C7D] rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all bg-white hover:bg-slate-50/60 group shadow-2xs">
            <input
              type="file"
              multiple
              className="hidden"
              onChange={handleFileChange}
            />
            <div className="w-12 h-12 rounded-full bg-blue-50/80 text-[#253C7D] flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-xs">
              <i className="ri-upload-cloud-2-line text-2xl text-blue-500" />
            </div>
            <p className="text-xs font-bold text-slate-700">
              Drop file here or <span className="text-[#253C7D] underline font-bold">Browse</span>
            </p>
            <p className="text-[11px] text-slate-400 mt-1 font-medium">
              PDF, PNG, JPG, DOCX up to 15MB
            </p>
          </label>

          {/* List of uploaded attachments */}
          {form.personal_attachments && form.personal_attachments.length > 0 && (
            <div className="space-y-1.5 pt-1">
              {form.personal_attachments.map((file, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-center gap-2 truncate">
                    <i className="ri-file-text-line text-[#253C7D] text-sm" />
                    <span className="truncate font-semibold">{file}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemove(idx)}
                    className="text-slate-400 hover:text-rose-600 p-1 rounded-md transition-colors cursor-pointer"
                    title="Remove Attachment"
                  >
                    <i className="ri-close-line text-base" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
