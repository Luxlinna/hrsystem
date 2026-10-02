import { memo } from "react";
import type { EmployeeFormState } from "../../types";
import type { ModalManagerEmployee } from "./types";
import {
  OrgJoiningInfoSection,
  OrgContractInfoSection,
  OrgAssetInfoSection,
  OrgUserAccountAndAttachmentSection,
} from "./org";

interface AddEmployeeOrgTabProps {
  form: EmployeeFormState;
  onChange: (field: keyof EmployeeFormState, value: any) => void;
  cleanBranches?: Array<{ id: string; name: string; location?: string | null }>;
  currentBranch?: { id: string; name: string; location?: string | null } | null;
  currentBranchName?: string;
  workSites: Array<{ id: string; name: string; description: string | null; branch_id: string | null }>;
  currentSiteSelectValue?: string;
  onSelectBranch?: (branchId: string) => void;
  onSelectSite: (siteIdOrVal: string) => void;
  buManagers?: ModalManagerEmployee[];
  divisions?: string[];
  departments?: string[];
  positions?: string[];
  employeeTypes?: string[];
  contractTypes?: string[];
}

export const AddEmployeeOrgTab = memo(function AddEmployeeOrgTab({
  form,
  onChange,
  cleanBranches = [],
  currentBranch,
  currentBranchName,
  workSites,
  onSelectBranch,
  onSelectSite,
  buManagers = [],
  divisions = [],
  departments = [],
  positions = [],
  employeeTypes = [],
  contractTypes = [],
}: AddEmployeeOrgTabProps) {
  return (
    <div className="w-full">
      <div className="bg-white rounded-xl p-6 sm:p-8 border border-slate-200/90 shadow-2xs space-y-6">
        {/* 1. Joining Info with dynamic BU divisions, departments, positions, employeeTypes, and sites */}
        <OrgJoiningInfoSection
          form={form}
          onChange={onChange}
          cleanBranches={cleanBranches}
          currentBranch={currentBranch}
          currentBranchName={currentBranchName}
          workSites={workSites}
          onSelectBranch={onSelectBranch}
          onSelectSite={onSelectSite}
          buManagers={buManagers}
          divisions={divisions}
          departments={departments}
          positions={positions}
          employeeTypes={employeeTypes}
        />

        {/* 2. Contract Info with dynamic BU contractTypes */}
        <OrgContractInfoSection
          form={form}
          onChange={onChange}
          contractTypes={contractTypes}
        />

        {/* 3. Asset Info */}
        <OrgAssetInfoSection form={form} onChange={onChange} />

        {/* 4. User Account & Attachments */}
        <OrgUserAccountAndAttachmentSection form={form} onChange={onChange} />
      </div>
    </div>
  );
});
