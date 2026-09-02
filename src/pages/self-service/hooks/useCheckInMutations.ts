import { useState, useRef, useEffect, useCallback } from "react";
import { zonedParts, zonedDayOfWeek } from "@/lib/date";
import type { AttendanceRecord, BranchGeofence, OutsideWorkTask } from "../types";
import { useGeofenceCheckIn } from "./useGeofenceCheckIn";
import { useClockInOutActions } from "./useClockInOutActions";

interface UseCheckInMutationsProps {
  employeeId: string;
  employeeName: string;
  autoStart?: boolean;
  autoCheckOut?: boolean;
  today: string;
  todayRecord: AttendanceRecord | null;
  loading: boolean;
  branch: BranchGeofence | null;
  branchLoading: boolean;
  scheduleSettings: {
    timezone: string;
    earlyLeaveGraceMinutes: number;
    breakStartTime: string;
    breakEndTime: string;
  };
  daySchedule: { startTime: string; endTime: string } | null;
  workStartTime: string;
  workEndTime: string | null;
  defaultWorkLocationId: string | null;
  todayOutsideWork: OutsideWorkTask | null;
  currentTime: Date;
  isCheckedIn: boolean;
  isCheckedOut: boolean;
  isEarlyCheckoutNow: boolean;
  loadRecords: () => Promise<void>;
}

export function useCheckInMutations({
  employeeId,
  employeeName,
  autoStart,
  autoCheckOut,
  today,
  todayRecord,
  loading,
  branch,
  branchLoading,
  scheduleSettings,
  daySchedule,
  workStartTime,
  workEndTime,
  defaultWorkLocationId,
  todayOutsideWork,
  currentTime,
  isCheckedIn,
  isCheckedOut,
  isEarlyCheckoutNow,
  loadRecords,
}: UseCheckInMutationsProps) {
  const [toast, setToast] = useState<{ type: string; message: string } | null>(null);
  const [notes, setNotes] = useState("");
  const [earlyCheckoutReason, setEarlyCheckoutReason] = useState("");

  const showToast = useCallback((type: string, message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const clockActions = useClockInOutActions({
    employeeId,
    employeeName,
    today,
    todayRecord,
    branch,
    scheduleSettings,
    daySchedule,
    workStartTime,
    workEndTime,
    defaultWorkLocationId,
    todayOutsideWork,
    notes,
    setNotes,
    earlyCheckoutReason,
    setEarlyCheckoutReason,
    resetCheckInFlow: () => geofence.resetCheckInFlow(),
    showToast,
    loadRecords,
  });

  const geofence = useGeofenceCheckIn({
    branch,
    branchLoading,
    onWithinRange: () => clockActions.handleClockIn(),
    showToast,
  });

  const handleRequestClockIn = useCallback(() => {
    const hasOutsideWork = Boolean(todayOutsideWork && todayOutsideWork.work_status !== "checked_out");
    geofence.requestGeofenceVerification(hasOutsideWork);
  }, [geofence, todayOutsideWork]);

  const handleConfirmClockIn = useCallback(async () => {
    clockActions.setProcessing(true);
    await clockActions.handleClockIn();
  }, [clockActions]);

  // Auto check-in handler when query param triggers
  const autoStartHandled = useRef(false);
  useEffect(() => {
    if (!autoStart || autoStartHandled.current || loading || branchLoading || isCheckedIn || isCheckedOut) return;
    autoStartHandled.current = true;
    handleRequestClockIn();
  }, [autoStart, loading, branchLoading, isCheckedIn, isCheckedOut, handleRequestClockIn]);

  // Auto check-out handler when query param triggers
  const autoOutHandled = useRef(false);
  useEffect(() => {
    if (!autoCheckOut || autoOutHandled.current || loading || !isCheckedIn || isCheckedOut) return;
    autoOutHandled.current = true;
    if (isEarlyCheckoutNow) {
      setEarlyCheckoutReason("Auto check-out triggered via quick action");
    }
    clockActions.handleClockOut();
  }, [autoCheckOut, loading, isCheckedIn, isCheckedOut, isEarlyCheckoutNow, clockActions]);

  return {
    toast,
    notes,
    setNotes,
    earlyCheckoutReason,
    setEarlyCheckoutReason,
    processing: clockActions.processing,
    checkInStep: geofence.checkInStep,
    checkInMessage: geofence.checkInMessage,
    handleRequestClockIn,
    handleConfirmClockIn,
    handleClockIn: clockActions.handleClockIn,
    handleClockOut: clockActions.handleClockOut,
    resetCheckInFlow: geofence.resetCheckInFlow,
  };
}
