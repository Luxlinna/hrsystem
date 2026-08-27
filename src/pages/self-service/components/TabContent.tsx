import type { Employee } from "../types";
import PayslipTab from "./PayslipTab";
import LeaveTab from "./LeaveTab";
import BenefitsTab from "./BenefitsTab";
import CheckInTab from "./CheckInTab";
import AttendanceTab from "./AttendanceTab";
import DailyReportTab from "./DailyReportTab";
import WorkOutsideTab from "./WorkOutsideTab";

interface Props {
  activeTab: string;
  employee: NonNullable<Employee>;
  employeeName: string;
  quickCheckIn: boolean;
  quickCheckOut: boolean;
}

export function TabContent({ activeTab, employee, employeeName, quickCheckIn, quickCheckOut }: Props) {
  return (
    <>
      {activeTab === "payslips" && (
        <PayslipTab employeeId={employee.id} employeeName={employeeName} />
      )}
      {activeTab === "leave" && (
        <LeaveTab employeeId={employee.id} />
      )}
      {activeTab === "attendance" && (
        <AttendanceTab employeeId={employee.id} />
      )}
      {activeTab === "checkin" && (
        <CheckInTab
          employeeId={employee.id}
          employeeName={employeeName}
          autoStart={quickCheckIn}
          autoCheckOut={quickCheckOut}
        />
      )}
      {activeTab === "work-outside" && (
        <WorkOutsideTab employeeId={employee.id} />
      )}
      {activeTab === "daily-report" && (
        <DailyReportTab employeeId={employee.id} />
      )}
      {activeTab === "benefits" && (
        <BenefitsTab employeeId={employee.id} />
      )}
    </>
  );
}
