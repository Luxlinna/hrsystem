import { memo } from "react";
import type { EmployeeFormState } from "../../types";
import type { AddEmployeeStepId, ModalManagerEmployee } from "./types";
import { AddEmployeePersonalTab } from "./AddEmployeePersonalTab";
import { AddEmployeeOrgTab } from "./AddEmployeeOrgTab";
import { AddEmployeeCompTab } from "./AddEmployeeCompTab";
import { AddEmployeeAssetTab } from "./AddEmployeeAssetTab";

interface AddEmployeeTabRouterProps {
  activeTab: AddEmployeeStepId;
  form: EmployeeFormState;
  onChange: (field: keyof EmployeeFormState, value: any) => void;
  cleanBranches?: Array<{ id: string; name: string; location?: string | null }>;
  currentBranch?: { id: string; name: string; location?: string | null } | null;
  currentBranchName?: string;
  workSites: Array<{ id: string; name: string; description: string | null; branch_id: string | null }>;
  currentSiteSelectValue?: string;
  onSelectBranch: (branchId: string) => void;
  onSelectSite: (siteIdOrVal: string) => void;
  buManagers?: ModalManagerEmployee[];
  buCeos?: ModalManagerEmployee[];
  divisions?: string[];
  departments?: string[];
  positions?: string[];
  employeeTypes?: string[];
  contractTypes?: string[];
}

export const AddEmployeeTabRouter = memo(function AddEmployeeTabRouter({
  activeTab,
  form,
  onChange,
  cleanBranches,
  currentBranch,
  currentBranchName,
  workSites,
  currentSiteSelectValue,
  onSelectBranch,
  onSelectSite,
  buManagers = [],
  divisions = [],
  departments = [],
  positions = [],
  employeeTypes = [],
  contractTypes = [],
}: AddEmployeeTabRouterProps) {
  switch (activeTab) {
    case "personal":
      return <AddEmployeePersonalTab form={form} onChange={onChange} />;
    case "org":
      return (
        <AddEmployeeOrgTab
          form={form}
          onChange={onChange}
          cleanBranches={cleanBranches}
          currentBranch={currentBranch}
          currentBranchName={currentBranchName}
          workSites={workSites}
          currentSiteSelectValue={currentSiteSelectValue}
          onSelectBranch={onSelectBranch}
          onSelectSite={onSelectSite}
          buManagers={buManagers}
          divisions={divisions}
          departments={departments}
          positions={positions}
          employeeTypes={employeeTypes}
          contractTypes={contractTypes}
        />
      );
    case "compensation":
      return <AddEmployeeCompTab form={form} onChange={onChange} />;
    case "asset":
      return (
        <AddEmployeeAssetTab
          form={form}
          onChange={onChange}
          cleanBranches={cleanBranches}
          currentBranch={currentBranch}
        />
      );
    default:
      return null;
  }
});
