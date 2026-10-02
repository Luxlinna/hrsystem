import { useState, useCallback, useEffect } from "react";
import type { ReportConfig, ReportRow } from "../types";
import {
  fetchAttendanceReport,
  fetchAttendanceSummaryReport,
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
  type ReportResult,
} from "../fetchers";

interface UseReportFetcherProps {
  config: ReportConfig;
  onDataReady: (rows: ReportRow[], columns: string[]) => void;
}

export function useReportFetcher({ config, onDataReady }: UseReportFetcherProps) {
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<Record<string, string | number>>({});

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      let res: ReportResult;
      switch (config.module) {
        case "leave":
          res = await fetchLeaveReport(config);
          break;
        case "payroll":
          res = await fetchPayrollReport(config);
          break;
        case "headcount":
          res = await fetchHeadcountReport(config);
          break;
        case "expenses":
          res = await fetchExpensesReport(config);
          break;
        case "hire":
          res = await fetchHireReport(config);
          break;
        case "daily-logs":
          res = await fetchDailyLogsReport(config);
          break;
        case "attendance":
          res = await fetchAttendanceReport(config);
          break;
        case "attendance-summary":
          res = await fetchAttendanceSummaryReport(config);
          break;
        case "meeting-rooms":
          res = await fetchMeetingRoomsReport(config);
          break;
        case "onboarding":
          res = await fetchOnboardingReport(config);
          break;
        case "onboarding-tasks":
          res = await fetchOnboardingTasksReport(config);
          break;
        case "shifts":
        default:
          res = await fetchShiftsReport(config);
          break;
      }
      setRows(res.rows);
      setColumns(res.columns);
      setSummary(res.summary);
      onDataReady(res.rows, res.columns);
    } catch (err) {
      console.error("fetchData error:", err);
    } finally {
      setLoading(false);
    }
  }, [config, onDataReady]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    rows,
    columns,
    loading,
    summary,
    fetchData,
  };
}
