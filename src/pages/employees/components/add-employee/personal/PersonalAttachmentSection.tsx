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
    <div className="pt-6 border-t border-slate-200 max-w-4xl mx-auto space-y-4">
      <h3 className="text-xs font-black text-[#253C7D] uppercase tracking-wider mb-2">
        Attachment Info
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-3 items-start gap-2">
        <label className="text-xs font-bold text-slate-700 sm:text-right sm:pr-4 pt-2">
          Attachment
        </label>
        <div className="sm:col-span-2 space-y-3">
          <label className="border-2 border-dashed border-slate-300 hover:border-[#253C7D] rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-50/50 hover:bg-slate-50 group">
            <input
              type="file"
              multiple
              className="hidden"
              onChange={handleFileChange}
            />
            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <i className="ri-upload-cloud-2-line text-xl" />
            </div>
            <p className="text-xs font-bold text-slate-700">
              Drop file here or <span className="text-[#253C7D] underline">Browse</span>
            </p>
            <p className="text-[10px] text-slate-400 mt-1">
              PDF, PNG, JPG, DOCX up to 15MB
            </p>
          </label>

          {/* List of uploaded attachments */}
          {form.personal_attachments && form.personal_attachments.length > 0 && (
            <div className="space-y-1.5">
              {form.personal_attachments.map((file, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700"
                >
                  <div className="flex items-center gap-2 truncate">
                    <i className="ri-file-text-line text-[#253C7D]" />
                    <span className="truncate font-medium">{file}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemove(idx)}
                    className="text-slate-400 hover:text-rose-600 p-1 rounded-md transition-colors"
                    title="Remove Attachment"
                  >
                    <i className="ri-close-line" />
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
