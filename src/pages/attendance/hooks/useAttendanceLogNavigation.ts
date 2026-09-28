import type { AttendanceRecord, Employee, WorkLocation } from "../types";
import type { ManagedShift } from "../components/shifts-manager/types";

interface Params {
  handleTabChange: (tab: "attendance" | "attendance-schedule" | "schedule-templates" | "shifts") => void;
  filters: any;
  data: {
    employees: Employee[];
    records: AttendanceRecord[];
    workLocations: WorkLocation[];
    setRecords: React.Dispatch<React.SetStateAction<AttendanceRecord[]>>;
  };
  shifts: ManagedShift[];
}

export function useAttendanceLogNavigation({ handleTabChange, filters, data, shifts }: Params) {
  return (target: any) => {
    handleTabChange("attendance");
    filters.setViewMode("table");
    filters.setSearchQuery(target.employeeCode || target.empName);
    filters.setFilterDatePreset("single_date");
    filters.setSingleDate(target.dateString);
    filters.setFromDate(target.dateString);
    filters.setToDate(target.dateString);
    filters.setFilterStatus("all");
    filters.setFilterDepartment("all");
    filters.setFilterWorkLocation("all");
    filters.setFilterEmployeeId("all");
    filters.setPage(1);

    const hasRecord = data.records.some((r) => r.employee_id === target.empId && r.date === target.dateString);
    if (!hasRecord) {
      const foundEmp = data.employees.find((e) => e.id === target.empId);
      const targetEmp = foundEmp || {
        id: target.empId,
        first_name: target.empName.split(" ")[0] || target.empName,
        last_name: target.empName.split(" ").slice(1).join(" ") || "",
        employee_code: target.employeeCode,
        biometric_user_id: target.employeeCode,
        department: "OPERATIONS",
        role: "Staff Member",
        avatar_url: null,
      };
      const matchedShift = shifts.find((s) => s.code?.toLowerCase() === target.currentCode?.toLowerCase());
      const placeholder: any = {
        id: -Date.now(),
        employee_id: target.empId,
        date: target.dateString,
        clock_in: target.clockIn || null,
        clock_out: target.clockOut || null,
        break_in: null,
        break_out: null,
        hours_worked: 0,
        status: target.status || "absent",
        notes: "",
        shift_id: matchedShift?.id || null,
        shift_code: target.currentCode,
        employees: targetEmp,
        work_location: (targetEmp as any).default_work_location_id
          ? data.workLocations.find((wl) => wl.id === (targetEmp as any).default_work_location_id) || null
          : (data.workLocations[0] || null),
        work_location_id: (targetEmp as any).default_work_location_id || data.workLocations[0]?.id || null,
      };
      data.setRecords((prev) => [placeholder, ...prev]);
    }
  };
}
