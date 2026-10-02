import { memo, useCallback } from "react";
import type { EmployeeFormState, EmployeeRateItem, EmployeePayrollAttachment } from "../../types";
import { DEFAULT_PAYROLL_RATE_ITEMS } from "../../constants";
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

  const handleAttachmentsChange = useCallback(
    (newAttachments: EmployeePayrollAttachment[]) => {
      onChange("payroll_attachments", newAttachments);
    },
    [onChange]
  );

  return (
    <div className="space-y-6 w-full pb-6">
      {/* 1. PAYROLL INFO */}
      <CompPayrollInfoSection form={form} onChange={onChange} />

      {/* 2. TAX INFO */}
      <CompTaxInfoSection form={form} onChange={onChange} />

      {/* 3. RATE ITEM INFO */}
      <CompRateItemsSection
        rateItems={rateItems}
        onRateItemChange={handleRateItemChange}
      />

      {/* 4. ATTACHMENT INFO */}
      <CompAttachmentsSection
        attachments={form.payroll_attachments || []}
        onChange={handleAttachmentsChange}
      />
    </div>
  );
});
