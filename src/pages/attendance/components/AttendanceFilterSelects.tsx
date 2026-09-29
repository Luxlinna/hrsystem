import { memo } from "react";
import type { Employee, WorkLocation } from "../types";
import { StatusPillDropdown } from "./filters/StatusPillDropdown";
import { FilterFlyoutMenu } from "./filters/FilterFlyoutMenu";

interface Props {
  employees: Employee[];
  availableEmployees: Employee[];
  filterEmployeeId?: string;
  setFilterEmployeeId?: (empId: string) => void;
  departments: string[];
  filterDepartment: string;
  setFilterDepartment: (dept: string) => void;
  roles?: string[];
  filterRole?: string;
  setFilterRole?: (role: string) => void;
  employmentTypes?: string[];
  filterEmploymentType?: string;
  setFilterEmploymentType?: (type: string) => void;
  workLocations?: WorkLocation[];
  filterWorkLocation?: string;
  setFilterWorkLocation?: (locId: string) => void;
  filterStatus: string;
  setFilterStatus: (status: string) => void;
}

export const AttendanceFilterSelects = memo(function AttendanceFilterSelects({
  employees,
  availableEmployees,
  filterEmployeeId = "all",
  setFilterEmployeeId,
  departments,
  filterDepartment,
  setFilterDepartment,
  roles = [],
  filterRole = "all",
  setFilterRole,
  employmentTypes = [],
  filterEmploymentType = "all",
  setFilterEmploymentType,
  workLocations = [],
  filterWorkLocation = "all",
  setFilterWorkLocation,
  filterStatus,
  setFilterStatus,
}: Props) {
  return (
    <div className="flex items-center gap-2 relative">
      {/* 1. Status Pill Dropdown */}
      <StatusPillDropdown
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
      />

      {/* 2. Cascading Filter Flyout (Site, Dept, Role, Emp Type, Emp) */}
      <FilterFlyoutMenu
        employees={employees}
        availableEmployees={availableEmployees}
        filterEmployeeId={filterEmployeeId}
        setFilterEmployeeId={setFilterEmployeeId}
        departments={departments}
        filterDepartment={filterDepartment}
        setFilterDepartment={setFilterDepartment}
        roles={roles}
        filterRole={filterRole}
        setFilterRole={setFilterRole}
        employmentTypes={employmentTypes}
        filterEmploymentType={filterEmploymentType}
        setFilterEmploymentType={setFilterEmploymentType}
        workLocations={workLocations}
        filterWorkLocation={filterWorkLocation}
        setFilterWorkLocation={setFilterWorkLocation}
      />
    </div>
  );
});
