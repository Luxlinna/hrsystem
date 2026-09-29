import { memo, useRef, useState, useCallback, useMemo } from "react";
import type { EmployeeFormState, EmployeeNssfInfo } from "../../types";
import { uploadMediaToS3 } from "@/lib/s3-storage";
import { toast } from "@/components/Toast";

interface AddEmployeeNssfTabProps {
  form: EmployeeFormState;
  onChange: (field: keyof EmployeeFormState, value: any) => void;
}

export const AddEmployeeNssfTab = memo(function AddEmployeeNssfTab({
  form,
  onChange,
}: AddEmployeeNssfTabProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const nssf: EmployeeNssfInfo = useMemo(() => {
    return form.nssf_info || {
      register_nssf: Boolean(form.register_nssf || form.nssf_number),
      identity_code: form.nssf_number || "",
      joining_date: form.join_date || form.start_date || "",
      first_name_kh: form.kh_name ? form.kh_name.split(" ")[1] || "" : "",
      last_name_kh: form.kh_name ? form.kh_name.split(" ")[0] || "" : "",
      first_name_latin: form.first_name || "",
      last_name_latin: form.last_name || "",
      monthly_wage_type: "Formula",
      monthly_wage: "Taxable Salary",
      seniority_pension_fund: "",
      remark: "",
      status: "Active",
    };
  }, [form.nssf_info, form.register_nssf, form.nssf_number, form.join_date, form.start_date, form.kh_name, form.first_name, form.last_name]);

  const isRegistered = Boolean(form.register_nssf || nssf.register_nssf);

  const updateNssf = useCallback(
    (field: keyof EmployeeNssfInfo, value: any) => {
      onChange("nssf_info", { ...nssf, [field]: value });
      if (field === "identity_code") onChange("nssf_number", value);
    },
    [nssf, onChange]
  );

  const handleToggleRegister = (checked: boolean) => {
    onChange("register_nssf", checked);
    onChange("nssf_info", { ...nssf, register_nssf: checked });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const media = await uploadMediaToS3(file, "employees/nssf");
      const current = form.payroll_attachments || [];
      const newAtt = {
        id: `att_${Date.now()}`,
        name: file.name,
        url: media.url,
        size: `${(file.size / 1024).toFixed(1)} KB`,
        uploaded_at: new Date().toISOString(),
      };
      onChange("payroll_attachments", [...current, newAtt]);
      toast("Attachment Uploaded", `${file.name} saved successfully.`, "success");
    } catch (err: any) {
      toast("Upload Failed", err.message || "Could not upload attachment", "error");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Register NSSF Checkbox */}
      <div className="flex items-center gap-2 pt-1">
        <label className="inline-flex items-center gap-2 text-xs font-normal text-slate-800 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={isRegistered}
            onChange={(e) => handleToggleRegister(e.target.checked)}
            className="w-4 h-4 rounded text-[#0088cc] focus:ring-[#0088cc] border-slate-300 cursor-pointer"
          />
          <span>Register Nssf</span>
        </label>
      </div>

      {/* Expanded NSSF Form Fields if Checked */}
      {isRegistered && (
        <div className="space-y-4 pt-2 border-t border-slate-100 animate-in fade-in duration-150">
          <h3 className="text-xs font-bold text-[#0088cc] uppercase tracking-wider">NSSF Details</h3>
          <div className="space-y-3 max-w-xl">
            <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
              <label className="text-xs font-normal text-slate-700 sm:text-right sm:pr-4">
                Identity Code <span className="text-rose-500">*</span>
              </label>
              <div className="sm:col-span-2">
                <input
                  type="text"
                  required={isRegistered}
                  value={nssf.identity_code || ""}
                  onChange={(e) => updateNssf("identity_code", e.target.value)}
                  placeholder="Identity Code of Worker"
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-800 focus:outline-none focus:border-[#0088cc]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
              <label className="text-xs font-normal text-slate-700 sm:text-right sm:pr-4">Joining Date</label>
              <div className="sm:col-span-2">
                <input
                  type="date"
                  value={nssf.joining_date || ""}
                  onChange={(e) => updateNssf("joining_date", e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-800 focus:outline-none focus:border-[#0088cc]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
              <label className="text-xs font-normal text-slate-700 sm:text-right sm:pr-4">Wage Type</label>
              <div className="sm:col-span-2">
                <select
                  value={nssf.monthly_wage_type || "Formula"}
                  onChange={(e) => updateNssf("monthly_wage_type", e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-800 focus:outline-none focus:border-[#0088cc] cursor-pointer"
                >
                  <option value="Formula">Formula</option>
                  <option value="Gross Salary">Gross Salary</option>
                  <option value="Net Salary">Net Salary</option>
                  <option value="Fixed Rate">Fixed Rate</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
              <label className="text-xs font-normal text-slate-700 sm:text-right sm:pr-4">Monthly Wage</label>
              <div className="sm:col-span-2">
                <select
                  value={nssf.monthly_wage || "Taxable Salary"}
                  onChange={(e) => updateNssf("monthly_wage", e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-800 focus:outline-none focus:border-[#0088cc] cursor-pointer"
                >
                  <option value="Taxable Salary">Taxable Salary</option>
                  <option value="Basic Salary">Basic Salary</option>
                  <option value="Gross Salary">Gross Salary</option>
                  <option value="Actual Earnings">Actual Earnings</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 items-start gap-2">
              <label className="text-xs font-normal text-slate-700 sm:text-right sm:pr-4 pt-1.5">Remark</label>
              <div className="sm:col-span-2">
                <textarea
                  rows={2}
                  value={nssf.remark || ""}
                  onChange={(e) => updateNssf("remark", e.target.value)}
                  placeholder="Remark"
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-800 focus:outline-none focus:border-[#0088cc]"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ATTACHMENT INFO Section */}
      <div className="pt-6 border-t border-slate-100 space-y-4">
        <h3 className="text-xs font-bold text-[#0088cc] uppercase tracking-wider">Attachment Info</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2 max-w-xl">
          <label className="text-xs font-normal text-slate-700 sm:text-right sm:pr-4">Attachment</label>
          <div className="sm:col-span-2">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="w-full border border-dashed border-slate-300 rounded px-4 py-3 flex items-center justify-center gap-2 text-xs text-slate-500 hover:border-[#0088cc] hover:text-[#0088cc] bg-white cursor-pointer transition-colors"
            >
              <i className="ri-upload-cloud-line text-sm" />
              <span>{uploading ? "Uploading..." : "Drop file here or "}</span>
              <span className="text-[#0088cc] font-semibold underline">Browse</span>
            </div>
            <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} />
          </div>
        </div>

        {Boolean(form.payroll_attachments?.length) && (
          <div className="sm:ml-[33.33%] space-y-1.5 max-w-sm pt-1">
            {form.payroll_attachments?.map((att, idx) => (
              <div
                key={att.id || idx}
                className="flex items-center justify-between px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs text-slate-700"
              >
                <div className="flex items-center gap-1.5 truncate">
                  <i className="ri-file-text-line text-slate-400" />
                  <span className="truncate">{att.name}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const next = (form.payroll_attachments || []).filter((_, i) => i !== idx);
                    onChange("payroll_attachments", next);
                  }}
                  className="text-slate-400 hover:text-rose-500 ml-2 cursor-pointer"
                >
                  <i className="ri-close-line" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});
