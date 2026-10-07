import React, { type RefObject } from "react";
import { type BranchOption } from "./types";
import { ChangeStatusOrgFields } from "./ChangeStatusOrgFields";
import { ChangeStatusCompFields } from "./ChangeStatusCompFields";

interface Props {
  statusType: string;
  setStatusType: (v: string) => void;
  effectiveDate: string;
  setEffectiveDate: (v: string) => void;
  bu?: string;
  setBu?: (v: string) => void;
  site: string;
  setSite: (v: string) => void;
  division?: string;
  setDivision?: (v: string) => void;
  department: string;
  setDepartment: (v: string) => void;
  position?: string;
  setPosition?: (v: string) => void;
  designation?: string;
  setDesignation?: (v: string) => void;
  employeeType: string;
  setEmployeeType: (v: string) => void;
  supervisor: string;
  setSupervisor: (v: string) => void;
  isSupervisorDropdownOpen: boolean;
  setIsSupervisorDropdownOpen: (v: boolean) => void;
  supervisorDropdownRef: RefObject<HTMLDivElement | null>;
  salaryType: string;
  setSalaryType: (v: string) => void;
  salary: string;
  setSalary: (v: string) => void;
  remark: string;
  setRemark: (v: string) => void;
  buOptions: BranchOption[];
  siteOptions?: string[];
  divisions?: string[];
  departments?: string[];
  positions?: string[];
  supervisorOptions: any[];
  onReloadBranches?: () => void;
  onReloadSites?: () => void;
}

export const ChangeStatusInfoSection: React.FC<Props> = ({
  statusType, setStatusType,
  effectiveDate, setEffectiveDate,
  bu, setBu,
  site, setSite,
  division, setDivision,
  department, setDepartment,
  position, setPosition,
  designation, setDesignation,
  employeeType, setEmployeeType,
  supervisor, setSupervisor,
  isSupervisorDropdownOpen, setIsSupervisorDropdownOpen,
  supervisorDropdownRef,
  salaryType, setSalaryType,
  salary, setSalary,
  remark, setRemark,
  buOptions = [],
  siteOptions = [],
  divisions = [],
  departments = [],
  positions = [],
  supervisorOptions,
  onReloadBranches,
  onReloadSites,
}) => {
  return (
    <div>
      <h3 className="text-[11px] font-bold text-[#0284c7] uppercase tracking-wider mb-3">
        CHANGE STATUS INFO
      </h3>

      <div className="space-y-2.5">
        <ChangeStatusOrgFields
          statusType={statusType}
          setStatusType={setStatusType}
          effectiveDate={effectiveDate}
          setEffectiveDate={setEffectiveDate}
          bu={bu}
          setBu={setBu}
          site={site}
          setSite={setSite}
          division={division}
          setDivision={setDivision}
          department={department}
          setDepartment={setDepartment}
          position={position}
          setPosition={setPosition}
          designation={designation}
          setDesignation={setDesignation}
          employeeType={employeeType}
          setEmployeeType={setEmployeeType}
          buOptions={buOptions}
          siteOptions={siteOptions}
          divisions={divisions}
          departments={departments}
          positions={positions}
          onReloadBranches={onReloadBranches}
          onReloadSites={onReloadSites}
        />

        <ChangeStatusCompFields
          supervisor={supervisor}
          setSupervisor={setSupervisor}
          isSupervisorDropdownOpen={isSupervisorDropdownOpen}
          setIsSupervisorDropdownOpen={setIsSupervisorDropdownOpen}
          supervisorDropdownRef={supervisorDropdownRef}
          supervisorOptions={supervisorOptions}
          salaryType={salaryType}
          setSalaryType={setSalaryType}
          salary={salary}
          setSalary={setSalary}
          remark={remark}
          setRemark={setRemark}
        />
      </div>
    </div>
  );
};
