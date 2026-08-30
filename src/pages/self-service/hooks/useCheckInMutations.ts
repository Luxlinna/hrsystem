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

  const geofence = useGeofenceCheckIn({
    branch,
    branchLoading,
    onWithinRange: () => clockActions.handleClockIn(),
    showToast,
  });

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
    resetCheckInFlow: geofence.resetCheckInFlow,
    showToast,
    loadRecords,
  });

  const handleRequestClockIn = useCallback(() => {
    const hasOutsideWork = Boolean(todayOutsideWork && todayOutsideWork.work_status !== "checked_out");
    geofence.requestGeofenceVerification(hasOutsideWork);
  }, [geofence, todayOutsideWork]);

  const handleConfirmClockIn = useCallback(async () => {
    clockActions.setProcessing(true);
    await clockActions.handleClockIn();
  }, [clockActions]);

  const autoStartedRef = useRef(false);
  useEffect(() => {
    if (!autoStart || loading || branchLoading || autoStartedRef.current || todayRecord?.clock_in || (todayOutsideWork && todayOutsideWork.work_status !== "checked_out")) return;
    autoStartedRef.current = true;
    handleRequestClockIn();
  }, [autoStart, loading, branchLoading, todayRecord, todayOutsideWork, handleRequestClockIn]);

  const autoCheckedOutRef = useRef(false);
  useEffect(() => {
    if (loading || autoCheckedOutRef.current || !isCheckedIn || isCheckedOut || (todayOutsideWork && todayOutsideWork.work_status !== "checked_out")) return;
    const isSat = zonedDayOfWeek(currentTime, scheduleSettings.timezone) === 6;
    const autoCheckoutThreshold = isSat ? 13 * 60 : 18 * 60;
    const nowMin = zonedParts(currentTime, scheduleSettings.timezone).minutesOfDay;
    const shouldAutoCheckoutByTime = nowMin >= autoCheckoutThreshold;
    const shouldAutoCheckoutByParam = !!autoCheckOut && !isEarlyCheckoutNow;

    if (shouldAutoCheckoutByTime || shouldAutoCheckoutByParam) {
      autoCheckedOutRef.current = true;
      clockActions.handleClockOut();
    }
  }, [autoCheckOut, loading, isCheckedIn, isCheckedOut, isEarlyCheckoutNow, todayOutsideWork, currentTime, scheduleSettings.timezone, clockActions]);

  return {
    processing: clockActions.processing,
    toast,
    notes,
    setNotes,
    earlyCheckoutReason,
    setEarlyCheckoutReason,
    checkInStep: geofence.checkInStep,
    checkInMessage: geofence.checkInMessage,
    checkInDistance: geofence.checkInDistance,
    checkInAccuracy: geofence.checkInAccuracy,
    handleRequestClockIn,
    handleConfirmClockIn,
    handleClockIn: clockActions.handleClockIn,
    handleClockOut: clockActions.handleClockOut,
    resetCheckInFlow: geofence.resetCheckInFlow,
  };
}
