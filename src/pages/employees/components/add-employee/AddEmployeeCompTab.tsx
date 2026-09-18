import { memo, useMemo, useCallback } from "react";
import type { EmployeeFormState, EmployeeRateItem, EmployeePayrollAttachment } from "../../types";
import { DEFAULT_PAYROLL_RATE_ITEMS } from "../../constants";
import { toast } from "@/components/Toast";
import { CompPayrollInfoSection } from "./comp-tab/CompPayrollInfoSection";
import { CompTaxInfoSection } from "./comp-tab/CompTaxInfoSection";
import { CompRateItemsSection } from "./comp-tab/CompRateItemsSection";
import { CompAttachmentsSection } from "./comp-tab/CompAttachmentsSection";

interface AddEmployeeCompTabProps {
  form: EmployeeFormState;
  onChange: (field: keyof EmployeeFormState, value: any) => void;
}

export const AddEmployeeCompTab = memo(function AddEmployeeCompTab({
  form,
  onChange,
}: AddEmployeeCompTabProps) {
  const rateItems: EmployeeRateItem[] =
    form.rate_items && form.rate_items.length > 0
      ? form.rate_items
      : DEFAULT_PAYROLL_RATE_ITEMS;

  const handleRateItemChange = useCallback(
    (idx: number, field: keyof EmployeeRateItem, value: any) => {
      const updated = [...rateItems];
      updated[idx] = { ...updated[idx], [field]: value };
      onChange("rate_items", updated);
    },
    [rateItems, onChange]
  );

  const handleAddRateItem = useCallback(() => {
    const newItem: EmployeeRateItem = {
      name: "",
      amount: "0",
      remark: "",
    };
    onChange("rate_items", [...rateItems, newItem]);
  }, [rateItems, onChange]);

  const handleRemoveRateItem = useCallback(
    (idx: number) => {
      const updated = rateItems.filter((_, i) => i !== idx);
      onChange("rate_items", updated);
    },
    [rateItems, onChange]
  );

  const handleResetRateItems = useCallback(() => {
    onChange("rate_items", DEFAULT_PAYROLL_RATE_ITEMS);
    toast("Default Rate Items Restored", "Reset to standard 9 rate items.", "info");
  }, [onChange]);

  // Calculate total monthly rate items
  const totalRateItemsAmount = useMemo(() => {
    return rateItems.reduce((acc, item) => {
      const num = parseFloat(String(item.amount || 0));
      return acc + (isNaN(num) ? 0 : num);
    }, 0);
  }, [rateItems]);

  const attachments: EmployeePayrollAttachment[] = useMemo(
    () => form.payroll_attachments || [],
    [form.payroll_attachments]
  );

  const handleAttachmentsChange = useCallback(
    (newAttachments: EmployeePayrollAttachment[]) => {
      onChange("payroll_attachments", newAttachments);
    },
    [onChange]
  );

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
      <CompPayrollInfoSection form={form} onChange={onChange} />

      {/* 2. TAX INFO */}
      <CompTaxInfoSection form={form} onChange={onChange} />

      {/* 3. RATE ITEM INFO */}
      <CompRateItemsSection
        rateItems={rateItems}
        onRateItemChange={handleRateItemChange}
        onAddRateItem={handleAddRateItem}
        onRemoveRateItem={handleRemoveRateItem}
        onResetRateItems={handleResetRateItems}
        totalRateItemsAmount={totalRateItemsAmount}
      />

      {/* 4. ATTACHMENT INFO */}
      <CompAttachmentsSection
        attachments={attachments}
        onChange={handleAttachmentsChange}
      />
    </div>
  );
});
