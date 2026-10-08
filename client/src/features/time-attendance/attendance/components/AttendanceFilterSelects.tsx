import { memo } from "react";
import type { WorkLocation } from "../types";
import { StatusPillDropdown } from "./filters/StatusPillDropdown";
import { FilterFlyoutMenu } from "./filters/FilterFlyoutMenu";

interface Props {
  divisions?: string[];
  filterDivision?: string;
  setFilterDivision?: (division: string) => void;
  departments: string[];
  filterDepartment: string;
  setFilterDepartment: (dept: string) => void;
  roles?: string[];
  filterRole?: string;
  setFilterRole?: (role: string) => void;
  employmentTypes?: string[];
  filterEmploymentType?: string;
  setFilterEmploymentType?: (type: string) => void;
  employeeLevels?: string[];
  filterEmployeeLevel?: string;
  setFilterEmployeeLevel?: (level: string) => void;
  workLocations?: WorkLocation[];
  branches?: { id: string; name: string }[];
  filterBranch?: string;
  setFilterBranch?: (branch: string) => void;
  filterWorkLocation?: string;
  setFilterWorkLocation?: (locId: string) => void;
  filterStatus: string;
  setFilterStatus: (status: string) => void;
}

export const AttendanceFilterSelects = memo(function AttendanceFilterSelects({
  divisions = [],
  filterDivision = "all",
  setFilterDivision = () => {},
  departments = [],
  filterDepartment,
  setFilterDepartment,
  roles = [],
  filterRole = "all",
  setFilterRole = () => {},
  employmentTypes = [],
  filterEmploymentType = "all",
  setFilterEmploymentType = () => {},
  employeeLevels = [],
  filterEmployeeLevel = "",
  setFilterEmployeeLevel = () => {},
  workLocations = [],
  branches = [],
  filterBranch = "",
  setFilterBranch = () => {},
  filterWorkLocation = "all",
  setFilterWorkLocation = () => {},
  filterStatus,
  setFilterStatus,
}: Props) {
  return (
    <div className="flex items-center gap-2 relative">
      <StatusPillDropdown
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
      />

      <FilterFlyoutMenu
        branches={branches}
        workLocations={workLocations}
        divisions={divisions}
        depts={departments}
        positions={roles}
        employeeTypes={employmentTypes}
        employeeLevels={employeeLevels}
        filterBranch={filterBranch}
        setFilterBranch={setFilterBranch}
        filterWorkLocation={filterWorkLocation}
        setFilterWorkLocation={setFilterWorkLocation}
        filterDivision={filterDivision}
        setFilterDivision={setFilterDivision}
        filterDepartment={filterDepartment}
        setFilterDepartment={setFilterDepartment}
        filterRole={filterRole}
        setFilterRole={setFilterRole}
        filterEmploymentType={filterEmploymentType}
        setFilterEmploymentType={setFilterEmploymentType}
        filterEmployeeLevel={filterEmployeeLevel}
        setFilterEmployeeLevel={setFilterEmployeeLevel}
      />
    </div>
  );
});
