import React, { useState } from "react";
import type { LeaveTypeSetting } from "../../services/leaveSettingsService";
import { LeaveTypeInfoSection } from "./LeaveTypeInfoSection";
import { LeaveTypeConditionSection } from "./LeaveTypeConditionSection";
import { LeaveTypeContractRulesSection } from "./LeaveTypeContractRulesSection";

interface LeaveTypeFormProps {
  initialData?: LeaveTypeSetting | null;
  onSave: (data: Omit<LeaveTypeSetting, "id"> & { id?: string }) => Promise<boolean>;
  onBack: () => void;
  saving: boolean;
}

export const LeaveTypeForm: React.FC<LeaveTypeFormProps> = ({
  initialData,
  onSave,
  onBack,
  saving,
}) => {
  const [periodType, setPeriodType] = useState<"daily" | "hourly">(
    initialData?.period_type || "daily"
  );
  const [code, setCode] = useState(initialData?.code || "");
  const [name, setName] = useState(initialData?.name || "");
  const [rate, setRate] = useState<number>(initialData?.rate ?? 1.0);
  const [allowCompensatory, setAllowCompensatory] = useState<boolean>(
    initialData?.allow_compensatory ?? false
  );
  const [isUnpaid, setIsUnpaid] = useState<boolean>(initialData?.is_unpaid ?? false);
  const [eligibleFor, setEligibleFor] = useState<"both" | "male" | "female">(
    initialData?.eligible_for || "both"
  );
  const [excludedContractTypes, setExcludedContractTypes] = useState<string[]>(
    initialData?.excluded_contract_types || []
  );
  const [requestInAdvance, setRequestInAdvance] = useState<boolean>(
    initialData?.request_in_advance ?? false
  );
  const [requireAttachment, setRequireAttachment] = useState<boolean>(
    initialData?.require_attachment ?? false
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !name.trim()) return;
    await onSave({
      id: initialData?.id,
      code,
      name,
      period_type: periodType,
      rate,
      allow_compensatory: allowCompensatory,
      is_unpaid: isUnpaid,
      eligible_for: eligibleFor,
      excluded_contract_types: excludedContractTypes,
      request_in_advance: requestInAdvance,
      require_attachment: requireAttachment,
      is_active: initialData?.is_active ?? true,
    });
  };

  return (
    <div className="w-full space-y-6 font-sans">
      <div className="flex items-center justify-between gap-4 pb-2 border-b border-gray-100">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            {initialData ? "Edit Leave Type" : "Create Leave Type"}
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Configure rules, eligible contracts, and entitlement balance policies.
          </p>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl text-gray-700 text-xs font-bold shadow-2xs transition-all cursor-pointer"
        >
          <i className="ri-arrow-left-line text-sm text-[#253C7D]" />
          Back
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <LeaveTypeInfoSection
          periodType={periodType}
          setPeriodType={setPeriodType}
          code={code}
          setCode={setCode}
          name={name}
          setName={setName}
          rate={rate}
          setRate={setRate}
          allowCompensatory={allowCompensatory}
          setAllowCompensatory={setAllowCompensatory}
          isUnpaid={isUnpaid}
          setIsUnpaid={setIsUnpaid}
        />

        <LeaveTypeConditionSection
          eligibleFor={eligibleFor}
          setEligibleFor={setEligibleFor}
        />

        <LeaveTypeContractRulesSection
          excludedContractTypes={excludedContractTypes}
          setExcludedContractTypes={setExcludedContractTypes}
          requestInAdvance={requestInAdvance}
          setRequestInAdvance={setRequestInAdvance}
          requireAttachment={requireAttachment}
          setRequireAttachment={setRequireAttachment}
        />

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#253C7D] hover:bg-[#1E3064] text-white text-xs font-bold rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer disabled:opacity-50"
          >
            {saving ? <i className="ri-loader-4-line animate-spin" /> : <i className="ri-save-3-line" />}
            <span>Save</span>
          </button>
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            <i className="ri-close-line mr-1" />
            Discard
          </button>
        </div>
      </form>
    </div>
  );
};
