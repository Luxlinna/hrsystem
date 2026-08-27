import type { ReportConfig } from "../types";
import type { ReportResult } from "./reportTypes";
import { fetchLeaveReport, fetchPayrollReport, fetchHeadcountReport } from "./hrFetchers";
import { fetchShiftsReport } from "./shiftFetchers";
import { fetchDailyLogsReport, fetchMeetingRoomsReport } from "./operationsFetchers";
import { fetchExpensesReport, fetchHireReport } from "./financeFetchers";
import { fetchOnboardingReport, fetchOnboardingTasksReport } from "./onboardingFetchers";
import { fetchAttendanceReport, fetchAttendanceSummaryReport } from "./attendanceFetchers";

export type { ReportResult } from "./reportTypes";

export type ReportFetcher = (config: ReportConfig) => Promise<ReportResult>;

export const REPORT_FETCHERS: Record<string, ReportFetcher> = {
  leave: fetchLeaveReport,
  payroll: fetchPayrollReport,
  headcount: fetchHeadcountReport,
  expenses: fetchExpensesReport,
  hire: fetchHireReport,
  "daily-logs": fetchDailyLogsReport,
  attendance: fetchAttendanceReport,
  "attendance-summary": fetchAttendanceSummaryReport,
  "meeting-rooms": fetchMeetingRoomsReport,
  shifts: fetchShiftsReport,
  onboarding: fetchOnboardingReport,
  "onboarding-tasks": fetchOnboardingTasksReport,
};

export const REPORT_REALTIME_TABLES: Record<string, string | string[]> = {
  leave: "leave_requests",
  shifts: ["shifts", "shift_assignments"],
  payroll: "payroll_records",
  headcount: "employees",
  expenses: "expense_records",
  hire: "candidates",
  onboarding: "onboarding_requests",
  "onboarding-tasks": "onboarding_checklist_tasks",
  "daily-logs": "work_logs",
  attendance: "attendance_records",
  "attendance-summary": "attendance_records",
  "meeting-rooms": "room_bookings",
};

export {
  fetchLeaveReport,
  fetchPayrollReport,
  fetchHeadcountReport,
  fetchShiftsReport,
  fetchDailyLogsReport,
  fetchMeetingRoomsReport,
  fetchExpensesReport,
  fetchHireReport,
  fetchOnboardingReport,
  fetchOnboardingTasksReport,
  fetchAttendanceReport,
  fetchAttendanceSummaryReport,
};
