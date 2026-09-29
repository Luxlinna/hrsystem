import { memo, useRef } from "react";
import type { EmployeeFormState } from "../../../types";

interface OrgUserAccountAndAttachmentSectionProps {
  form: EmployeeFormState;
  onChange: (field: keyof EmployeeFormState, value: any) => void;
}

export const OrgUserAccountAndAttachmentSection = memo(
  function OrgUserAccountAndAttachmentSection({
    form,
    onChange,
  }: OrgUserAccountAndAttachmentSectionProps) {
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        const file = e.target.files[0];
        const newDoc = {
          name: file.name,
          url: URL.createObjectURL(file),
          size: file.size,
          type: file.type,
          uploaded_at: new Date().toISOString(),
        };
        const currentDocs = form.documents || [];
        onChange("documents", [...currentDocs, newDoc]);
      }
    };

    return (
      <div className="space-y-6 pt-6 border-t border-slate-100">
        {/* 1. User Account */}
        <div className="space-y-3">
          <h3 className="text-[12px] font-bold text-[#0088cc] uppercase tracking-wider">
            User Account
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
            <label className="text-[13px] font-medium text-slate-600 sm:text-right sm:pr-4">
              Select Your Account Status
            </label>
            <div className="sm:col-span-2 flex items-center gap-6">
              <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                <input
                  type="radio"
                  name="account_status_option"
                  checked={form.send_invite !== true}
                  onChange={() => onChange("send_invite", false)}
                  className="w-4 h-4 text-[#0088cc] focus:ring-[#0088cc] border-slate-300 cursor-pointer"
                />
                <span>None</span>
              </label>

              <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                <input
                  type="radio"
                  name="account_status_option"
                  checked={form.send_invite === true}
                  onChange={() => onChange("send_invite", true)}
                  className="w-4 h-4 text-[#0088cc] focus:ring-[#0088cc] border-slate-300 cursor-pointer"
                />
                <span>Existing User Account</span>
              </label>
            </div>
          </div>
        </div>

        {/* 2. Attachment Info */}
        <div className="space-y-3 pt-4 border-t border-slate-100">
          <h3 className="text-[12px] font-bold text-[#0088cc] uppercase tracking-wider">
            Attachment Info
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
            <label className="text-[13px] font-medium text-slate-600 sm:text-right sm:pr-4">
              Attachment
            </label>
            <div className="sm:col-span-2">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-full border border-dashed border-slate-300 hover:border-slate-400 rounded-lg p-3.5 text-center cursor-pointer transition-colors bg-slate-50/40 hover:bg-slate-50 flex items-center justify-center gap-2"
              >
                <i className="ri-upload-cloud-line text-base text-slate-400" />
                <span className="text-xs text-slate-500 font-normal">
                  Drop file here or <span className="text-[#0088cc] font-medium">Browse</span>
                </span>
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              {form.documents && form.documents.length > 0 && (
                <div className="mt-2 space-y-1">
                  {form.documents.map((doc, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between px-3 py-1.5 rounded-md bg-white border border-slate-200 text-xs"
                    >
                      <span className="font-medium text-slate-700 truncate">{doc.name}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = form.documents?.filter((_, i) => i !== idx);
                          onChange("documents", updated);
                        }}
                        className="text-slate-400 hover:text-rose-600 ml-2"
                      >
                        <i className="ri-close-line text-xs" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
);
