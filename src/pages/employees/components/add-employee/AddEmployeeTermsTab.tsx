import { memo } from "react";
import type { EmployeeFormState } from "../../types";
import type { ModalManagerEmployee } from "./types";
import {
  TermsHeaderBanner,
  TermsScheduleFields,
  TermsReportingFields,
  TermsContractInfoSection,
} from "./terms";

interface AddEmployeeTermsTabProps {
  form: EmployeeFormState;
  onChange: (field: keyof EmployeeFormState, value: any) => void;
  buManagers: ModalManagerEmployee[];
  buCeos: ModalManagerEmployee[];
}

export const AddEmployeeTermsTab = memo(function AddEmployeeTermsTab({
  form,
  onChange,
  buManagers,
  buCeos,
}: AddEmployeeTermsTabProps) {
  return (
    <div className="space-y-6 w-full">
      <TermsHeaderBanner />

      {/* Main Schedule & Contract Panel */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-2xs space-y-6">
        {/* Working Hours, Days, Type & Start Date */}
        <TermsScheduleFields form={form} onChange={onChange} />

        {/* Line Manager & Status */}
        <TermsReportingFields
          form={form}
          onChange={onChange}
          buManagers={buManagers}
          buCeos={buCeos}
        />

        {/* Contract Info Section matching screenshot */}
        <TermsContractInfoSection form={form} onChange={onChange} />
      </div>
    </div>
  );
});
