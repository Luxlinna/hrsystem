import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import type { OvertimeRecord } from "../types/overtimeTypes";
import { fetchOvertimeRecords, updateOvertimeStatus, deleteOvertimeRecord } from "../services/overtimeService";
import { exportOvertimeCSV } from "../exports/exportOvertimeCSV";

interface UseAttendanceOvertimeProps {
  targetBranch?: string | null;
  myEmployeeId?: string | null;
  canViewAll?: boolean;
}

export function useAttendanceOvertime({
  targetBranch,
  myEmployeeId,
  canViewAll,
}: UseAttendanceOvertimeProps) {
  const [showOvertimeForm, setShowOvertimeForm] = useState(false);
  const [activeMainTab, setActiveMainTab] = useState<"attendance" | "overtime">("attendance");
  const [overtimeRecords, setOvertimeRecords] = useState<OvertimeRecord[]>([]);
  const [otLoading, setOtLoading] = useState(false);

  const fetchOvertime = useCallback(async () => {
    setOtLoading(true);
    try {
      const records = await fetchOvertimeRecords(
        canViewAll ? targetBranch : null,
        canViewAll ? null : myEmployeeId
      );
      setOvertimeRecords(records);
    } finally {
      setOtLoading(false);
    }
  }, [targetBranch, myEmployeeId, canViewAll]);

  useEffect(() => {
    fetchOvertime();

    const channel = supabase
      .channel("overtime-realtime-sync")
      .on("postgres_changes", { event: "*", schema: "public", table: "overtime_records" }, () => {
        fetchOvertime();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchOvertime]);

  const handleApprove = useCallback(async (id: string) => {
    const ok = await updateOvertimeStatus(id, "approved", myEmployeeId);
    if (ok) {
      toast("Success", "Overtime request approved", "success");
      fetchOvertime();
    } else {
      toast("Error", "Failed to approve overtime", "error");
    }
  }, [myEmployeeId, fetchOvertime]);

  const handleReject = useCallback(async (id: string) => {
    const reason = window.prompt("Reason for rejecting overtime (optional):") || undefined;
    const ok = await updateOvertimeStatus(id, "rejected", myEmployeeId, reason);
    if (ok) {
      toast("Success", "Overtime request rejected", "success");
      fetchOvertime();
    } else {
      toast("Error", "Failed to reject overtime", "error");
    }
  }, [myEmployeeId, fetchOvertime]);

  const handleDelete = useCallback(async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this overtime record?")) return;
    const ok = await deleteOvertimeRecord(id);
    if (ok) {
      toast("Success", "Overtime record deleted", "success");
      fetchOvertime();
    } else {
      toast("Error", "Failed to delete overtime record", "error");
    }
  }, [fetchOvertime]);

  const handleExport = useCallback(() => {
    exportOvertimeCSV(overtimeRecords);
  }, [overtimeRecords]);

  return {
    showOvertimeForm, setShowOvertimeForm, activeMainTab, setActiveMainTab,
    overtimeRecords, otLoading, fetchOvertime,
    handleApprove, handleReject, handleDelete, handleExport,
  };
}
