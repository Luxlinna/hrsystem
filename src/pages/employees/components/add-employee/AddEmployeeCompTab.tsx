import { memo, useRef, useState, useCallback, useMemo } from "react";
import type { EmployeeFormState, EmployeeRateItem, EmployeePayrollAttachment } from "../../types";
import { DEFAULT_PAYROLL_RATE_ITEMS, PAYROLL_STRUCTURES } from "../../constants";
import { uploadMultipleFilesToS3 } from "@/lib/s3-storage";
import { toast } from "@/components/Toast";

interface AddEmployeeCompTabProps {
  form: EmployeeFormState;
  onChange: (field: keyof EmployeeFormState, value: any) => void;
}

export const AddEmployeeCompTab = memo(function AddEmployeeCompTab({
  form,
  onChange,
}: AddEmployeeCompTabProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const rateItems: EmployeeRateItem[] =
    form.rate_items && form.rate_items.length > 0
      ? form.rate_items
      : DEFAULT_PAYROLL_RATE_ITEMS;

  const handleRateItemChange = (idx: number, field: keyof EmployeeRateItem, value: any) => {
    const updated = [...rateItems];
    updated[idx] = { ...updated[idx], [field]: value };
    onChange("rate_items", updated);
  };

  const handleAddRateItem = () => {
    const newItem: EmployeeRateItem = {
      label: "",
      type: "Allowance",
      amount: "0",
      is_taxable: true,
      notes: "",
    };
    onChange("rate_items", [...rateItems, newItem]);
  };

  const handleRemoveRateItem = (idx: number) => {
    const updated = rateItems.filter((_, i) => i !== idx);
    onChange("rate_items", updated);
  };

  const handleApplyStructure = (struct: (typeof PAYROLL_STRUCTURES)[number]) => {
    onChange("payroll_structure", struct.name);
    onChange("rate_items", struct.defaultRates);
    toast("Preset Applied", `Loaded default rate structure: ${struct.name}`, "info");
  };

  const handleResetRateItems = () => {
    onChange("rate_items", DEFAULT_PAYROLL_RATE_ITEMS);
    toast("Default Rate Items Restored", "Reset to standard 9 rate items.", "info");
  };

  // Calculate total monthly rate items
  const totalRateItemsAmount = rateItems.reduce((acc, item) => {
    const num = parseFloat(String(item.amount || 0));
    return acc + (isNaN(num) ? 0 : num);
  }, 0);

  // Attachments Handling
  const attachments: EmployeePayrollAttachment[] = useMemo(() => form.payroll_attachments || [], [form.payroll_attachments]);

  const handleFiles = useCallback(
    async (fileList: FileList | null) => {
      if (!fileList || !fileList.length) return;
      const fileArray = Array.from(fileList);
      setUploading(true);
      try {
        const uploaded = await uploadMultipleFilesToS3(fileArray, "employees/payroll-attachments");
        const newItems: EmployeePayrollAttachment[] = uploaded.map((item) => ({
          name: item.name,
          url: item.url,
          size: item.size,
          type: item.type,
          uploaded_at: new Date().toISOString(),
        }));
        onChange("payroll_attachments", [...attachments, ...newItems]);
        toast("File Uploaded", `Added ${fileArray.length} payroll attachment(s).`, "success");
      } catch (err) {
        console.error("Payroll upload error:", err);
        toast("Upload Failed", err instanceof Error ? err.message : "Could not upload file", "error");
      } finally {
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    },
    [attachments, onChange]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles]
  );

  const handleRemoveAttachment = (url: string) => {
    onChange(
      "payroll_attachments",
      attachments.filter((a) => a.url !== url)
    );
    toast("Attachment Removed", "Removed file from payroll attachments.", "info");
  };

  return (
    <div className="space-y-6 w-full">
      {/* Top Header Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50/90 via-blue-50/40 to-white border border-emerald-200/80 flex items-start gap-3.5 shadow-2xs">
        <div className="w-9 h-9 rounded-xl bg-[#253C7D] text-white flex items-center justify-center shrink-0 shadow-xs">
          <i className="ri-money-dollar-circle-line text-lg" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-xs font-black text-slate-900 tracking-wide">
              Compensation, Tax &amp; Payroll Setup
            </h3>
            <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200/60">
              Step 4 of 5
            </span>
          </div>
          <p className="text-[11px] text-slate-600 font-medium mt-0.5 leading-relaxed">
            Payroll structure configuration, residency tax salary calculation, itemized monthly allowances, and supporting payroll attachments.
          </p>
        </div>
      </div>

      {/* 1. PAYROLL INFO */}
      <div className="p-5 bg-white border border-slate-200/90 rounded-2xl shadow-2xs space-y-4">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-lg bg-[#253C7D] text-white flex items-center justify-center text-xs shadow-2xs">
            <i className="ri-file-list-3-line text-xs" />
          </span>
          <h3 className="text-xs font-black text-[#253C7D] uppercase tracking-wider">
            Payroll Info
          </h3>
        </div>

        <div className="space-y-3">
          {/* Payroll Structure */}
          <div>
            <label className="block text-xs font-extrabold text-slate-700 mb-1">
              Payroll Structure
            </label>
            <select
              value={form.payroll_structure || "Standard Monthly"}
              onChange={(e) => onChange("payroll_structure", e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#253C7D] focus:ring-1 focus:ring-[#253C7D] transition-all shadow-2xs cursor-pointer"
            >
              <option value="">Select Payroll Structure</option>
              {PAYROLL_STRUCTURES.map((ps) => (
                <option key={ps} value={ps}>
                  {ps}
                </option>
              ))}
            </select>
          </div>

          {/* Checkboxes */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-1">
            <label className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-slate-900 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={Boolean(form.apply_day_in_month)}
                onChange={(e) => onChange("apply_day_in_month", e.target.checked)}
                className="w-4 h-4 rounded text-[#253C7D] focus:ring-[#253C7D] border-slate-300 cursor-pointer"
              />
              <span>Apply Day In Month</span>
            </label>

            <label className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-slate-900 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={Boolean(form.apply_working_hours_per_day)}
                onChange={(e) => onChange("apply_working_hours_per_day", e.target.checked)}
                className="w-4 h-4 rounded text-[#253C7D] focus:ring-[#253C7D] border-slate-300 cursor-pointer"
              />
              <span>Apply Working Hours Per Day</span>
            </label>
          </div>

          {/* Integrated Basic Salary & Disbursement Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1">
                Base Monthly Salary ($)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">$</span>
                <input
                  type="number"
                  step="0.01"
                  value={form.basic_salary}
                  onChange={(e) => onChange("basic_salary", e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-8 pr-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#253C7D] focus:ring-1 focus:ring-[#253C7D] transition-all shadow-2xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1">
                Disbursement Bank & Account Number
              </label>
              <input
                type="text"
                value={form.bank_account_number}
                onChange={(e) => {
                  onChange("bank_account_number", e.target.value);
                  const val = e.target.value;
                  if (val.toLowerCase().includes("aba")) onChange("bank_name", "ABA Bank");
                  else if (val.toLowerCase().includes("acleda")) onChange("bank_name", "ACLEDA Bank");
                  else if (val.toLowerCase().includes("canadia")) onChange("bank_name", "Canadia Bank");
                  else if (val.toLowerCase().includes("wing")) onChange("bank_name", "Wing Bank");
                }}
                placeholder="e.g. 001 234 567 (ABA Bank)"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-[#253C7D] focus:ring-1 focus:ring-[#253C7D] transition-all shadow-2xs"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. TAX INFO */}
      <div className="p-5 bg-white border border-slate-200/90 rounded-2xl shadow-2xs space-y-4">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-lg bg-[#253C7D] text-white flex items-center justify-center text-xs shadow-2xs">
            <i className="ri-percent-line text-xs" />
          </span>
          <h3 className="text-xs font-black text-[#253C7D] uppercase tracking-wider">
            Tax Info
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Tax Salary (USD [ input ] Monthly) */}
          <div>
            <label className="block text-xs font-extrabold text-slate-700 mb-1">
              Tax Salary
            </label>
            <div className="flex rounded-xl overflow-hidden border border-slate-300 bg-white shadow-2xs focus-within:border-[#253C7D] focus-within:ring-1 focus-within:ring-[#253C7D]">
              <span className="px-3.5 py-2.5 bg-slate-100 text-slate-600 text-xs font-bold border-r border-slate-200 select-none">
                {form.tax_salary_currency || "USD"}
              </span>
              <input
                type="number"
                step="0.01"
                value={form.tax_salary ?? ""}
                onChange={(e) => onChange("tax_salary", e.target.value)}
                placeholder="Tax Salary"
                className="flex-1 px-3.5 py-2.5 text-xs font-mono font-bold text-slate-900 focus:outline-none"
              />
              <span className="px-3.5 py-2.5 bg-slate-50 text-slate-600 text-xs font-bold border-l border-slate-200 select-none">
                {form.tax_salary_frequency || "Monthly"}
              </span>
            </div>
          </div>

          {/* Tax Method */}
          <div>
            <label className="block text-xs font-extrabold text-slate-700 mb-1">
              Tax Method
            </label>
            <select
              value={form.tax_method || "Resident"}
              onChange={(e) => onChange("tax_method", e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#253C7D] focus:ring-1 focus:ring-[#253C7D] cursor-pointer transition-all shadow-2xs"
            >
              <option value="Resident">Resident (Progressive 0% - 20%)</option>
              <option value="Non-resident">Non-resident (Flat 20%)</option>
              <option value="Standard">Standard Cambodian Payroll Tax</option>
              <option value="Gross">Gross Up</option>
              <option value="Net">Net Guaranteed</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. RATE ITEM INFO */}
      <div className="p-5 bg-white border border-slate-200/90 rounded-2xl shadow-2xs space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-[#253C7D] text-white flex items-center justify-center text-xs shadow-2xs">
              <i className="ri-money-dollar-circle-line text-xs" />
            </span>
            <h3 className="text-xs font-black text-[#253C7D] uppercase tracking-wider">
              Rate Item Info
            </h3>
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-blue-50 text-[#253C7D] border border-blue-200">
              {rateItems.length} Items
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetRateItems}
              className="px-2.5 py-1.5 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 text-xs font-bold transition-colors cursor-pointer"
              title="Reset to 9 Standard Rate Items"
            >
              <i className="ri-restart-line mr-1" />
              Reset Defaults
            </button>
            <button
              type="button"
              onClick={handleAddRateItem}
              className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-[#253C7D] text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <i className="ri-add-line font-bold" />
              <span>Add Rate Item</span>
            </button>
          </div>
        </div>

        {/* Rate Items Table */}
        <div className="border border-slate-200 rounded-xl overflow-x-auto shadow-2xs">
          <table className="w-full text-xs text-left min-w-[700px]">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold text-[11px]">
              <tr>
                <th className="py-2.5 px-3 w-12 text-center">No.</th>
                <th className="py-2.5 px-3 w-48">Rate Item Name</th>
                <th className="py-2.5 px-3 w-36">Amount ($)</th>
                <th className="py-2.5 px-3">Remark</th>
                <th className="py-2.5 px-3 w-12 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {rateItems.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-2 px-3 text-center text-slate-500 font-bold">
                    {idx + 1}
                  </td>
                  <td className="py-2 px-3">
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => handleRateItemChange(idx, "name", e.target.value)}
                      placeholder="Rate item name"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#253C7D] bg-white"
                    />
                  </td>
                  <td className="py-2 px-3">
                    <div className="relative">
                      <span className="absolute left-2.5 top-1.5 text-xs text-slate-400 font-bold">
                        $
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        value={item.amount}
                        onChange={(e) => handleRateItemChange(idx, "amount", e.target.value)}
                        placeholder="0"
                        className="w-full pl-6 pr-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-[#253C7D] bg-white"
                      />
                    </div>
                  </td>
                  <td className="py-2 px-3">
                    <input
                      type="text"
                      value={item.remark}
                      onChange={(e) => handleRateItemChange(idx, "remark", e.target.value)}
                      placeholder="e.g. Monthly entitlement criteria"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-700 focus:outline-none focus:border-[#253C7D] bg-white"
                    />
                  </td>
                  <td className="py-2 px-3 text-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveRateItem(idx)}
                      className="w-7 h-7 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors cursor-pointer mx-auto"
                      title="Remove rate item"
                    >
                      <i className="ri-delete-bin-line text-sm" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-50/80 border-t border-slate-200 font-bold text-slate-800 text-xs">
              <tr>
                <td colSpan={2} className="py-2.5 px-3 text-right">
                  Total Rate Items Allowance:
                </td>
                <td className="py-2.5 px-3 font-mono text-[#253C7D] text-xs">
                  ${totalRateItemsAmount.toFixed(2)}
                </td>
                <td colSpan={2} className="py-2.5 px-3 text-slate-500 font-normal italic">
                  Sum of all recurring itemized allowances &amp; perks
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* 4. ATTACHMENT INFO */}
      <div className="p-5 bg-white border border-slate-200/90 rounded-2xl shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-[#253C7D] text-white flex items-center justify-center text-xs shadow-2xs">
              <i className="ri-attachment-2 text-xs" />
            </span>
            <h3 className="text-xs font-black text-[#253C7D] uppercase tracking-wider">
              Attachment Info
            </h3>
            {attachments.length > 0 && (
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                {attachments.length} Attached
              </span>
            )}
          </div>
        </div>

        {/* Drag & Drop Upload Zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
            isDragOver
              ? "border-[#253C7D] bg-blue-50/40 scale-[0.99]"
              : "border-slate-300 hover:border-slate-400 bg-slate-50/40"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
            onChange={(e) => handleFiles(e.target.files)}
          />

          <div className="flex flex-col items-center justify-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#253C7D] flex items-center justify-center text-xl shadow-2xs">
              <i className={uploading ? "ri-loader-4-line animate-spin" : "ri-upload-cloud-2-line"} />
            </div>

            <p className="text-xs font-medium text-slate-700">
              <i className="ri-drag-drop-line mr-1 text-slate-400" />
              Drop file here or{" "}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="font-bold text-[#253C7D] hover:underline cursor-pointer"
              >
                Browse
              </button>
            </p>
            <p className="text-[10px] text-slate-400">
              Supports PDF, Word, Excel, and Image files (contract amendments, tax deduction receipts, payroll agreements)
            </p>
          </div>
        </div>

        {/* Uploaded Attachments List */}
        {attachments && attachments.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            {attachments.map((att, idx) => {
              const isPdf = att.name.toLowerCase().endsWith(".pdf") || att.type?.includes("pdf");
              const isWord = att.name.toLowerCase().endsWith(".doc") || att.name.toLowerCase().endsWith(".docx");
              const isExcel = att.name.toLowerCase().endsWith(".xls") || att.name.toLowerCase().endsWith(".xlsx");
              const isImage = att.type?.startsWith("image/") || /\.(jpg|jpeg|png|webp)$/i.test(att.name);

              return (
                <div
                  key={att.url || idx}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200 text-xs transition-colors group"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
                    <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-2xs">
                      {isPdf ? (
                        <i className="ri-file-pdf-fill text-rose-500 text-base" />
                      ) : isWord ? (
                        <i className="ri-file-word-fill text-blue-600 text-base" />
                      ) : isExcel ? (
                        <i className="ri-file-excel-fill text-emerald-600 text-base" />
                      ) : isImage ? (
                        <i className="ri-image-2-fill text-purple-600 text-base" />
                      ) : (
                        <i className="ri-file-text-fill text-slate-500 text-base" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-800 truncate" title={att.name}>
                        {att.name}
                      </p>
                      {att.size && (
                        <span className="text-[10px] text-slate-400">
                          {(att.size / 1024).toFixed(1)} KB
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <a
                      href={att.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-6 h-6 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-white flex items-center justify-center text-xs transition-colors"
                      title="Preview / Download"
                    >
                      <i className="ri-external-link-line" />
                    </a>
                    <button
                      type="button"
                      onClick={() => handleRemoveAttachment(att.url)}
                      className="w-6 h-6 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center text-xs transition-colors cursor-pointer"
                      title="Delete attachment"
                    >
                      <i className="ri-delete-bin-line" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
});
